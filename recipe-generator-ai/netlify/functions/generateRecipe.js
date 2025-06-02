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
    const systemPrompt = `
You are "Hestia", a friendly home‑cook assistant.

OUTPUT RULES (MANDATORY)
1. Respond with *one* JSON array — no markdown or commentary.
2. Each element has exactly these keys *in this order*:
   "name", "servings", "cook_time_minutes", "ingredients",
   "optional", "instructions"
3. Values:
   • name: 2–8 words, unique
   • servings: integer 1–6
   • cook_time_minutes: integer ≤60
   • ingredients / optional: string arrays
   • instructions: 5–8 short step strings
4. Wrap every key and string value in double quotes.

COUNT RULE
• Aim for 5–6 distinct recipes.
• If ingredients genuinely can’t support 5, provide 2–3.
• Never output <2 or >6 recipes.

CONTENT RULES
• Every recipe must use *all* provided core ingredients.
• You may add common pantry items (oil, salt, pepper, water, basic spices).
• Keep recipes affordable, simple, and minimise food waste.

VARIETY RULE
Avoid any recipe whose name *or* main ingredient list appears in "previousRecipes" below.
`.trim();

    const userPrompt = `
Core ingredients: ${ingredients.join(", ")}

previousRecipes: ${JSON.stringify(previousRecipes)}

Return ONLY the JSON array as specified.
`.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const payload = {
      model: "gpt-4o",            // upgrade from 3.5‑turbo
      temperature: 0.8,
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
