// netlify/functions/generateRecipe.js
import fetch from "node-fetch";

// In-memory cache (non-persistent)
const cache = new Map();
const requestHistory = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 30 * 1000; // 30 seconds

export async function handler(event) {
  try {
    const ip = event.headers["x-nf-client-connection-ip"] || "anon";
    const now = Date.now();

    // Clean up old requests and enforce limit
    requestHistory.set(ip, (requestHistory.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS));
    if (requestHistory.get(ip).length >= RATE_LIMIT) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: "Too many requests. Please wait and try again." })
      };
    }
    requestHistory.get(ip).push(now);

    const {
      ingredients = [],
      previousRecipes = []
    } = JSON.parse(event.body || "{}");

    const key = JSON.stringify({ ingredients, previousRecipes });
    if (cache.has(key)) {
      return {
        statusCode: 200,
        body: JSON.stringify(cache.get(key))
      };
    }

    // Prompt setup
    const systemPrompt = `
You are "Hestia", a friendly home‑cook assistant.

OUTPUT RULES:
- Return 2–4 recipes in valid JSON only.
- Each recipe must include:
  • name (string, 2–8 words),
  • servings (integer 1–6),
  • cook_time_minutes (integer ≤60),
  • ingredients (string array),
  • optional (string array),
  • instructions (5–8 short string steps)
- No markdown, no explanations.
- Use all provided core ingredients.
`.trim();

    const userPrompt = `
Create 2–4 recipes using ALL these ingredients:
${ingredients.join(", ")}

Avoid repeating previous recipes. Output JSON array only.
`.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    if (previousRecipes.length > 0) {
      messages.push({
        role: "assistant",
        content: JSON.stringify(previousRecipes)
      });
    }

    const payload = {
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      messages
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "[]";

    let recipes;
    try {
      recipes = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!Array.isArray(recipes)) throw new Error();
    } catch {
      recipes = [];
    }

    if (recipes.length < 1 || recipes.length > 6) recipes = [];

    // Store in cache
    cache.set(key, recipes);

    return {
      statusCode: 200,
      body: JSON.stringify(recipes)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error. Please try again later." })
    };
  }
}
