// netlify/functions/generateRecipe.js
import fetch from "node-fetch";

// Temporary in-memory cache (only survives during runtime)
const cache = new Map();
const requestHistory = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 30 * 1000; // 30 seconds


export async function handler(event) {
  try {
    const ip = event.headers["x-nf-client-connection-ip"] || "anon";
    const now = Date.now();

    // Rate limit: store timestamps per IP
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

    // PROMPT
    const systemPrompt = `
You are "Hestia", a friendly home‑cook assistant.

OUTPUT RULES:
- Return 2–6 recipes only in valid JSON.
- Each recipe has these keys ONLY (in this order): name, servings, cook_time_minutes, ingredients, optional, instructions.
- Use all core ingredients and basic pantry items. Avoid repeats from "previousRecipes".
`.trim();

    const userPrompt = `
Ingredients: ${ingredients.join(", ")}

Use ALL core ingredients. Return JSON array only. Avoid repeats. 5–6 recipes preferred.
`.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    if (previousRecipes.length > 0) {
      messages.push({ role: "assistant", content: JSON.stringify(previousRecipes) });
    }

    const payload = {
      model: "gpt-4o",
      temperature: 0.9,
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

    if (recipes.length < 2 || recipes.length > 6) recipes = [];

    // Cache the result for this input
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
