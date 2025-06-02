import React, { useState } from "react";
import { generateRecipePrompt } from "./utils/generateRecipe";
import { Bookmark, RefreshCw, X } from "lucide-react";
import "./index.css";

// Blacklist words for input validation
const blacklist = [
  "hi", "hello", "bye", "goodbye", "see you", "thanks", "thank you", "lol", "haha",
  "nothing", "no ingredients", "test", "sample", "asdf", "qwerty", "what", "how", "why",
  "stop", "cancel", "clear", "exit", "nice", "awesome", "cool", "google", "search", "weather",
  "recipe ideas", "help", "bug", "problem", "error", "cooking tips", "this isn't working",
  "it's broken", "wish", "wash", "hat", "kiss", "miss","hit",
  "what are you doing", "how are you", "who are you", "what is your name", "i don't cook",
  "i won't tell", "i have no ingredients", "nevermind", "go away", "sing a song",
  "tell me a joke", "tell me something funny","code","write","bake","nope","tell","you tell",
  "ah", "ahem", "alright", "amazing", "answer", "anyone there", "awesome sauce",
"be right back", "bonjour", "boo", "brb", "bye bye", "cya", "checking", "cheers",
"confirm", "cool beans", "copy", "cya later", "damn", "darn", "debug", "ding",
"dont know", "dont care", "done yet", "echo", "excuse me", "fantastic", "fine",
"gday", "gee", "greetings", "great job", "haha yes", "hello there", "hey",
"hey bot", "hey there", "hmm", "hold on", "howdy", "i guess", "i said",
"i wonder", "idk", "im bored", "im fine", "im happy", "im sad", "just asking",
"just checking", "just kidding", "k", "kinda", "knock knock", "lmao", "lmk",
"lolz", "maybe later", "meh", "no clue", "no idea", "no thanks", "nonono",
"not sure", "nothing else", "ok", "ok cool", "ok thanks", "okay", "okay bye",
"okay then", "okay thanks", "oops", "please help", "please reply", "ping",
"pong", "question", "quit", "ready", "roger", "roger that", "sad", "same here",
"see ya", "seriously", "shoot", "shoutout", "silly", "so", "so cool", "so funny",
"sorry", "stack overflow", "stop it", "sup", "sure", "sweet", "test123",
"testing", "thanks a lot", "thanks bot", "thanks bye", "thanks dude",
"thanks man", "thanks so much", "thx", "too long", "ttyl", "uh", "uhh",
"uhhh", "wait", "what else", "whatever", "whats up", "who cares", "who knows",
"wow", "yay", "yes", "yikes", "yo", "you rock","good morning", "good afternoon", "good night", "morning", "afternoon", "evening",
"night", "sunny", "rain", "oopsie", "instructions", "direction", "guide", "guidance",
"login", "logout", "signup", "register", "username", "password", "email", "contact",
"support", "feedback", "report", "comments", "birthday", "holiday", "vacation",
"travel", "location", "address", "phone", "number", "numbers", "age", "gender",
"male", "female", "other", "unknown", "random", "spam", "nonsense", "garbage",
"junk", "stuff", "things", "items", "placeholder", "dummy", "lorem", "ipsum",
"blah", "blah blah", "testing123", "test test", "foo", "bar", "foobar", "baz",
"qux", "quux", "corge", "grault", "garply", "waldo", "fred", "plugh", "xyzzy",
"thud", "alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta",
"iota", "kappa", "lambda", "mu", "nu", "xi", "omicron", "pi", "rho", "sigma",
"tau", "upsilon", "phi","psi", "omega", "random text", "whatever dude",
"this sucks", "fix it", "try again", "restart", "reboot", "refresh", "update",
"upgrade", "install", "uninstall", "settings", "options", "preferences", "config",
"configuration", "reset", "default", "defaults", "issue", "issues", "trouble",
"troubleshoot", "manual", "docs", "documentation", "tutorial", "example", "examples",
"sample text", "demo", "demonstration", "play", "pause", "resume", "begin", "finish",
"completed", "halt", "freeze", "crash", "lag", "slow", "faster", "speed", "boost",
"optimize", "invalid", "valid", "boolean", "null", "undefined", "nan", "404",
"500", "bad request", "forbidden", "unauthorized", "not found", "server down",
"offline", "online", "reconnect", "backend", "frontend", "database", "sql", "nosql",
"endpoint", "hyperlink", "http", "https", "ftp", "ssh", "telnet", "port", "protocol",
"ip", "ipv4", "ipv6", "domain", "hostname", "localhost", "terminate", "latency","ai","fridge",
"sai","rishith","artificial","intelligence","chat","bot"


];
const allowList = ["bbq", "msg", "aioli", "tzatziki", "naan", "gf", "umami", "egg", "rye"];

function App() {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("savedRecipes") || "[]"));
  const [loading, setLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [msg, setMsg] = useState("");

  const clearMsg = () => setTimeout(() => setMsg(""), 3000);

  const validateIngredient = (word) => {
    const clean = word.trim().toLowerCase();
  
    // Base check: only letters, spaces, hyphens, and correct length
    const isValidFormat = /^[a-z\s\-]{2,20}$/.test(clean);
  
    if (!isValidFormat) return false;
  
    // Always allow certain known words even if they fail other rules
    if (allowList.includes(clean)) return true;
  
    // Must have at least 1 vowel or 'y'
    const hasVowelOrY = /[aeiouy]/.test(clean);
  
    // Must not be a blacklisted word
    const isBlacklisted = blacklist.includes(clean);
  
    // Must NOT contain 3 or more consecutive consonants (like "jwr" or "ndq")
    const hasBadChunk = /[^aeiouy\s\-]{3,}/.test(clean);
  
    return hasVowelOrY && !isBlacklisted && !hasBadChunk;
  };
  
  

  const handleAddIngredient = () => {
    const clean = input.trim().toLowerCase();
    if (!validateIngredient(clean)) {
      setMsg("❌ Please enter a valid ingredients.");
      clearMsg();
    } else if (!ingredients.includes(clean)) {
      setIngredients([...ingredients, clean]);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleRemoveIngredient = (item) => {
    setIngredients(ingredients.filter(i => i !== item));
  };

  const handleClearAll = () => {
    setIngredients([]);
  };

  const toggleSave = (recipe) => {
    const exists = saved.some(r => r.name === recipe.name);
    const next = exists ? saved.filter(r => r.name !== recipe.name) : [...saved, recipe];
    setSaved(next);
    localStorage.setItem("savedRecipes", JSON.stringify(next));
    setMsg(exists ? "❌ Removed from saved" : "✅ Recipe saved!");
    clearMsg();
  };

  const handleRefresh = () => {
    setIngredients([]);
    setRecipes([]);
    setExpandedRecipe(null);
    setMsg("");
  };

  const generate = async () => {
    if (ingredients.length < 2) {
      setMsg("❌ Please enter at least 2 valid ingredients.");
      clearMsg();      // still clear after 4 s
      return;
    }
  
    // Show a heads-up when user supplied only 1-2 items
    if (ingredients.length <= 2) {
      setMsg("ℹ️ With only a couple of ingredients, some recipes may add 1–2 basic staples.");
    } else {
      setMsg("");      
    }
  
    setLoading(true);
  
    try {
      const data = await generateRecipePrompt(ingredients);
      setRecipes(data);
    } catch (err) {
      console.error(err);
      setMsg("⚠️ Something went wrong. Try again.");
      clearMsg();
    } finally {
      setLoading(false);
    }
  };
  
  

  const renderCard = (recipe, idx, section) => {
    const isSaved = saved.some((r) => r.name === recipe.name);
  
    return (
      <div
        key={recipe.name}
        className="bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow h-full flex flex-col justify-between"
      >
        <div>
          <h3 className="text-xl font-semibold text-green-700 mb-2">{recipe.name}</h3>
          <p><strong>Ingredients:</strong> {recipe.ingredients.join(", ")}</p>
          {recipe.optional?.length > 0 && (
            <p className="mt-1"><strong>Optional:</strong> {recipe.optional.join(", ")}</p>
          )}
        </div>
  
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => setExpandedRecipe(recipe)}
            className="text-sm text-green-600 hover:underline text-left"
          >
            📋 Cooking Instructions
          </button>
          <button
            onClick={() => toggleSave(recipe)}
            className="w-full bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded flex justify-center gap-2 items-center"
          >
            <Bookmark size={16} /> {isSaved ? "Saved" : "Save Recipe"}
          </button>
        </div>
      </div>
    );
  };
  

  return (
    <div className="min-h-screen bg-green-50 text-gray-800 font-sans">
      <header className="text-center py-6 bg-green-100 shadow">
        <h1 className="text-4xl font-bold text-black">👨‍🍳🤖 What’s Cooking?</h1>
        <p className="text-md text-black italic">Delicious Ideas, Powered by AI</p>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <section className="bg-white rounded-xl shadow p-6 mb-10">
          <h2 className="text-2xl text-green-700 mb-3 font-semibold">What's in your fridge?</h2>

          <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded text-sm mb-3">
            Add ingredients one at a time by typing and pressing <strong>Enter</strong>. You can remove any by clicking the × icon.
          </div>

          <div className="flex gap-3 mb-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an ingredient and press enter"
              className="flex-1 border border-green-200 rounded px-4 py-2"
            />
            <button
              onClick={handleAddIngredient}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              + Add
            </button>
          </div>

          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center mb-4">
              {ingredients.map((item) => (
                <span
                  key={item}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1"
                >
                  {item}
                  <X size={14} className="cursor-pointer" onClick={() => handleRemoveIngredient(item)} />
                </span>
              ))}
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-500 underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={generate}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
            >
              {loading ? "Generating..." : "Generate Recipes"}
            </button>
            <button
              onClick={handleRefresh}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {msg && <p className="text-center text-red-500 mt-4">{msg}</p>}
        </section>

        {recipes.length > 0 && (
  <section className="mb-12">
    <h2 className="text-2xl text-green-700 text-center mb-6">🍽️ Recipe Ideas</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
      {recipes.map((r, i) => renderCard(r, i, "gen"))}
    </div>
  </section>
)}

{saved.length > 0 && (
  <section className="border-t pt-6 border-green-200">
    <h2 className="text-2xl text-green-700 text-center mb-4">📌 Your Saved Recipes</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
      {saved.map((r, i) => renderCard(r, i, "saved"))}
    </div>
  </section>
)}

      </main>

      {/* Modal for Cooking Instructions */}
      {expandedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6 relative animate-fade-in">
            <button
              onClick={() => setExpandedRecipe(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              <X />
            </button>
            <h3 className="text-2xl font-bold mb-2 text-green-700">{expandedRecipe.name}</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {expandedRecipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <footer className="text-center text-sm py-6 text-gray-500 bg-green-50">
        © 2025 What's Cooking? | Built with ❤️ by Sai Rishith Chintala
      </footer>
    </div>
  );
}

export default App;

