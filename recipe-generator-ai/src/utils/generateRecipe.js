// src/utils/generateRecipe.js

export async function generateRecipePrompt(ingredients) {
  try {
    const response = await fetch("/.netlify/functions/generateRecipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ingredients })
    });

    if (response.status === 429) {
      return { error: "rate-limit", status: 429 };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return { error: "unknown", status: 500 };
  }
}
