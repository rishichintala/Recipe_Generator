import './index.css'
// src/App.jsx

import React, { useState } from "react";
import { generateRecipePrompt } from "./utils/generateRecipe";
import { Bookmark, RefreshCw } from "lucide-react";

function App() {
  const [inputText, setInputText] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [saved, setSaved] = useState(
    () => JSON.parse(localStorage.getItem("savedRecipes") || "[]")
  );
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [msg, setMsg] = useState("");

  // Auto‐clear status messages after 2 seconds
  const clearMsg = () => {
    setTimeout(() => setMsg(""), 2000);
  };

  // Refresh: clears input + generated recipes (but keeps saved)
  const handleRefresh = () => {
    setInputText("");
    setRecipes([]);
    setExpandedId(null);
    setMsg("");
  };

  // Toggle save/unsave in localStorage
  const toggleSave = (recipe) => {
    const exists = saved.some((r) => r.name === recipe.name);
    const next = exists
      ? saved.filter((r) => r.name !== recipe.name)
      : [...saved, recipe];
    setSaved(next);
    localStorage.setItem("savedRecipes", JSON.stringify(next));
    setMsg(exists ? "Recipe removed from Saved" : "Recipe saved!");
    clearMsg();
  };

  // Render a single recipe card (generated or saved)
  const renderCard = (recipe, idx, section) => {
    // Create a unique ID by replacing spaces with underscores
    const sanitized = recipe.name.replace(/\s+/g, "_");
    const cardId = `${section}-${idx}-${sanitized}`;
    const isOpen = expandedId === cardId;
    const isAlreadySaved = saved.some((r) => r.name === recipe.name);

    return (
      <div
        key={cardId}
        className="bg-white rounded-xl p-4 shadow hover:shadow-md 
                   transition-shadow self-start grid-auto-rows-min"
      >
        {/* Recipe Title */}
        <h3 className="text-xl font-[Belleza] text-green-700 mb-2">
          {recipe.name}
        </h3>

        {/* Ingredients */}
        <p className="text-sm text-gray-700">
          <strong>Ingredients:</strong> {recipe.ingredients.join(", ")}
        </p>

        {/* Optional */}
        {recipe.optional?.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            <strong>Optional:</strong> {recipe.optional.join(", ")}
          </p>
        )}

        {/* Toggle Instructions */}
        <button
          onClick={() => setExpandedId(isOpen ? null : cardId)}
          className="mt-3 text-sm text-lime-600 hover:underline flex items-center gap-1"
        >
          📋 Cooking Instructions
        </button>

        {/* Only show instructions + <hr> if expanded */}
        {isOpen && (
          <>
            <ol className="list-decimal list-inside mt-3 text-sm text-gray-800">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="mb-1">
                  {step}
                </li>
              ))}
            </ol>
            <hr className="my-4" />
          </>
        )}

        {/* Save / Unsave Button */}
        <button
          onClick={() => toggleSave(recipe)}
          className="w-full flex items-center justify-center gap-2
                     text-sm text-green-700 bg-green-100 hover:bg-green-200
                     rounded py-2"
        >
          <Bookmark size={16} />
          {isAlreadySaved ? "Saved" : "Save Recipe"}
        </button>
      </div>
    );
  };

  // Call OpenAI to generate recipes
  const generate = async () => {
    const list = inputText
      .split(/[\n,]+/) // split on commas or new lines
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (list.length === 0) {
      setMsg("Please enter some ingredients.");
      clearMsg();
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const data = await generateRecipePrompt(list);
      setRecipes(data);
    } catch (err) {
      console.error("generateRecipePrompt error:", err);
      setMsg("Could not fetch recipes. Try again.");
      clearMsg();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 text-gray-800 font-[Alegreya]">
      <header className="text-center py-6 shadow bg-green-100">
      <h1 className="text-4xl font-bold text-black font-sans tracking-wide">👨‍🍳🤖 What’s Cooking?</h1>
<p className="text-md text-black italic font-sans">Delicious Ideas, Powered by AI</p>


      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Ingredient Input + Buttons */}
        <section className="bg-white rounded-xl shadow p-6 mb-10">
          <h2 className="text-2xl font-[Belleza] text-green-700 mb-2">
            What's in your fridge?
          </h2>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g., chicken, rice, onions..."
            className="w-full p-3 bg-green-50 border border-green-200 rounded resize-none mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={generate}
              disabled={loading}
              className="flex-1 bg-lime-500 hover:bg-lime-600 text-white font-semibold
                         py-2 rounded flex items-center justify-center gap-2"
            >
              ✨ {loading ? "Thinking..." : "Suggest Recipes"}
            </button>
            <button
              onClick={handleRefresh}
              className="flex-none bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold
                         py-2 px-3 rounded flex items-center justify-center gap-1"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {msg && <p className="text-center text-sm text-red-500 mt-4">{msg}</p>}
        </section>

        {/* Generated Recipes (two cards per row) */}
        {recipes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-[Belleza] text-green-700 text-center mb-6">
              🍽️ Recipe Ideas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {recipes.map((r, i) => renderCard(r, i, "gen"))}
            </div>
          </section>
        )}

        {/* Saved Recipes (two cards per row) */}
        {saved.length > 0 && (
          <section className="pt-6 border-t border-green-200">
            <h2 className="text-2xl font-[Belleza] text-green-700 text-center mb-4">
              📌 Your Saved Recipes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {saved.map((r, i) => renderCard(r, i, "saved"))}
            </div>
          </section>
        )}
      </main>

      <footer className="text-center text-sm py-6 text-gray-500 bg-green-50">
        © 2025 What's Cooking? | Built with ❤️ by Sai Rishith Chintala
      </footer>
    </div>
  );
}

export default App;





