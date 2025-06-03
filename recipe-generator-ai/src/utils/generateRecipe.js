// src/utils/generateRecipe.js

export async function generateRecipePrompt(ingredients, previousRecipes = []) {
  try {
    const response = await fetch("/.netlify/functions/generateRecipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ingredients, previousRecipes })
    });
    if (Array.isArray(recipes) === false || recipes.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid ingredients. Please enter real food items." })
      };
    }
    const data = await response.json();
    return data;
  } catch (err) {
    return [];
  }
 
  
}
