// netlify/functions/generateRecipe.js
import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const { ingredients } = JSON.parse(event.body);

    const payload = {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful home cook assistant. Respond ONLY in valid JSON. Do not use markdown. " +
              "Each recipe must include: name, ingredients, optional ingredients, and instructions. " +
              "Make the output an array of 3-4 simple recipes based on ingredients the user gives."
          },
          {
            role: "user",
            content:
              `Ingredients: ${ingredients.join(", ")}\n` +
              `Return only valid JSON like this:\n\n` +
              `[{"name":"Recipe Name","ingredients":["item1","item2"],"optional":["opt1"],"instructions":["Step 1","Step 2"]}]\n\n` +
              `If unsure, just make up practical recipes using everyday items and basic spices.`
          }
        ],
        temperature: 0.7
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
    const content = data.choices?.[0]?.message?.content || "[]";

    // Fix stringified JSON issues if needed
    let fixedContent = content;
    if (typeof content === "string" && content.trim().startsWith('"')) {
      try {
        fixedContent = JSON.parse(content); // unwrap double-encoded string
      } catch {
        fixedContent = content;
      }
    }

    try {
      const parsed = typeof fixedContent === "string"
        ? JSON.parse(fixedContent)
        : fixedContent;

      return {
        statusCode: 200,
        body: JSON.stringify(parsed)
      };
    } catch (parseError) {
      return {
        statusCode: 200,
        body: JSON.stringify([]) // fallback empty array
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
}
