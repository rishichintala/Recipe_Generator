import { useState } from "react";
import { generateRecipePrompt } from "./utils/generateRecipe";

export default function App() {
  const [input, setInput] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateIngredients = (text) => {
    const list = text.split(",").map(i => i.trim().toLowerCase());
    const cleanList = list.filter(i => /^[a-z\s]+$/.test(i));
    if (cleanList.length < 2 || cleanList.length > 15) {
      return { valid: false, message: "Please enter 2 to 15 real ingredients, separated by commas." };
    }
    return { valid: true, cleanList };
  };

  const handleSubmit = async () => {
    setError("");
    setRecipes([]);

    const { valid, cleanList, message } = validateIngredients(input);
    if (!valid) {
      setError(message);
      return;
    }

    setLoading(true);
    try {
      const data = await generateRecipePrompt(cleanList);
      if (data?.error) {
        setError(data.error);
      } else if (!data || data.length === 0) {
        setError("No recipes found. Try changing the ingredients.");
      } else {
        setRecipes(data);
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-6 text-gray-800">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-orange-600 text-center">AI Recipe Suggester</h1>

        <input
          type="text"
          placeholder="Enter ingredients (e.g., chicken, rice, spinach)"
          className="w-full p-3 border border-orange-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition w-full"
        >
          {loading ? "Generating..." : "Suggest Recipes"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-6">
          {recipes.map((recipe, idx) => (
            <div key={idx} className="border border-orange-200 rounded shadow-md p-4 bg-white">
              <h2 className="text-xl font-semibold text-orange-700">{recipe.name}</h2>
              <p className="text-sm text-gray-500 mb-2">Servings: {recipe.servings} | Cook Time: {recipe.cook_time_minutes} mins</p>
              <ul className="text-sm mb-2">
                <li><strong>Ingredients:</strong> {recipe.ingredients.join(", ")}</li>
                <li><strong>Optional:</strong> {recipe.optional.join(", ")}</li>
              </ul>
              <details className="text-sm cursor-pointer mt-2">
                <summary className="text-orange-600 font-medium">Cooking Instructions</summary>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  {recipe.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
