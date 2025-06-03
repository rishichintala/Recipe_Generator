import fetch from "node-fetch";

/* ------------------------------------------------------------------ *
 * 1. Simple in‑memory maps. Survive warm invocations only.
 * ------------------------------------------------------------------ */
const cache = new Map();               // key ➜ { ts, recipes }
const inflight = new Map();            // key ➜ Promise
const requestHistory = new Map();      // ip ➜ [timestamps]

const RATE_LIMIT = 5;                  // hits/IP
const RATE_WINDOW_MS = 30_000;         // per 30 s
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 h

/* ------------------------------------------------------------------ *
 * 2. Helper utilities
 * ------------------------------------------------------------------ */
const sortArray = arr => [...arr].sort((a, b) => a.localeCompare(b));

const cacheKey = ({ ingredients, previousRecipes }) =>
  JSON.stringify({
    i: sortArray(ingredients),
    p: previousRecipes.map(r => r.name).sort()   // keep it stable & small
  });

const withinWindow = (ts, windowMs) => Date.now() - ts < windowMs;

/* ------------------------------------------------------------------ *
 * 3. Main handler
 * ------------------------------------------------------------------ */
export async function handler(event) {
  try {
    /* ---------------- Rate‑limit per IP ---------------- */
    const ip = event.headers["x-nf-client-connection-ip"] || "anon";
    const now = Date.now();
    const hits = (requestHistory.get(ip) || []).filter(t => withinWindow(t, RATE_WINDOW_MS));
    if (hits.length >= RATE_LIMIT) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: "Too many requests. Please wait a few seconds." })
      };
    }
    hits.push(now);
    requestHistory.set(ip, hits);

    /* ---------------- Parse body ---------------- */
    const { ingredients = [], previousRecipes = [] } = JSON.parse(event.body || "{}");
    if (!ingredients.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No ingredients supplied." }) };
    }

    const key = cacheKey({ ingredients, previousRecipes });

    /* ---------------- Serve from cache if fresh ---------------- */
    const cached = cache.get(key);
    if (cached && withinWindow(cached.ts, CACHE_TTL_MS)) {
      return { statusCode: 200, body: JSON.stringify(cached.recipes) };
    }

    /* ---------------- Share in‑flight requests ---------------- */
    if (inflight.has(key)) {
      const recipes = await inflight.get(key);
      return { statusCode: 200, body: JSON.stringify(recipes) };
    }

    /* ---------------- Build prompt ---------------- */
/* ----------  Build prompt  ---------- */
const systemPrompt = `
You are “Hestia”, a friendly home-cook assistant.

↘︎ OUTPUT FORMAT (STRICT)
Before generating recipes:
- STRICTLY VALIDATE INGREDIENTS BEFORE GENERATING RECIPES. Reject gibberish, placeholders like "abc", "xyz","tap",
"mop", "vat","mat" etc.
- If even ONE ingredient is invalid, DO NOT GENERATE RECIPES, respond with: {"error": "Invalid ingredients. Please enter real food items."}
Return ONE valid JSON array (no markdown, no prose).
Each element is an object with these keys IN THIS ORDER:
"name", "servings", "cook_time_minutes", "ingredients", "optional", "instructions"

↘︎ FIELD RULES
• name               – 2-8 words, unique
• servings           – integer 1-6
• cook_time_minutes  – integer ≤60
• ingredients / optional – string arrays
• instructions       – 5-8 concise steps

↘︎ QUANTITY RULE
Always output **exactly 5 recipes** — never more, never fewer.

↘︎ INGREDIENT RULES
1-2. “Core-Only” block – use *only* the ingredients provided by the user.  
3-5. “Pantry-Plus” block – may add common pantry staples (oil, salt, pepper, water, basic spices)  
  or up to two popular complementary items (e.g. avocado, beans).

↘︎ OTHER GUIDELINES
• Reuse all user-supplied ingredients in every recipe.  
• Keep recipes affordable and home-kitchen-friendly.  
• Minimise food waste.
• Reject nonsensical ingredient names or anything that isn’t a real food item. check thoroughly.
• Avoid recipes whose name or main ingredients match “previousRecipes”.
`.trim();

const userPrompt = `
Core ingredients: ${ingredients.join(", ")}

previousRecipes: ${JSON.stringify(previousRecipes)}

Please follow ALL rules above and return ONLY the JSON array.
`.trim();

const messages = [
  { role: "system", content: systemPrompt },
  { role: "user",   content: userPrompt }
];

const payload = {
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  max_tokens: 900,
  messages
};

    /* ---------------- OpenAI call (with in‑flight dedup) ---------------- */
    const openAiCall = fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => data.choices?.[0]?.message?.content ?? "[]");

    inflight.set(key, openAiCall);

    let raw;
    try {
      raw = await openAiCall;
    } finally {
      inflight.delete(key);       // clean no matter what
    }

    /* ---------------- Parse & validate ---------------- */
    let recipes;
    try {
      recipes = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!Array.isArray(recipes)) throw new Error("Not an array");
    } catch {
      recipes = [];
    }

    // Retry once at T=0.2 if parse failed or recipe count invalid
    if (recipes.length < 2 || recipes.length > 6) {
      const retryData = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({ ...payload, temperature: 0.2 })
      }).then(r => r.json());

      try {
        recipes = JSON.parse(retryData.choices?.[0]?.message?.content ?? "[]");
      } catch { recipes = []; }
    }

    /* ---------------- Only cache *valid* results ---------------- */
    if (recipes.length >= 2 && recipes.length <= 6) {
      cache.set(key, { ts: Date.now(), recipes });
    }

    return { statusCode: 200, body: JSON.stringify(recipes) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error." }) };
  }
}

/* ------------------------------------------------------------------ *
 * 4. Function‑level rate‑limit (Netlify native)
 * ------------------------------------------------------------------ */
export const config = {
  rateLimit: { window: "60 s", limit: 20, action: "block" }
};
