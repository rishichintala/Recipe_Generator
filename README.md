# 🥘 What’s Cooking? – AI Recipe Generator

![Recipe Finder Banner](https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)

> A sleek, AI-powered web application that helps you generate simple, affordable home-style recipes based on ingredients you already have in your kitchen. Just enter ingredients, and let AI do the thinking.

---

## ✨ Features

- 🧪 **Ingredient-Based Generator** – Get recipes based on items you already have in your kitchen
- 💾 **Save Favorites** – Bookmark recipes using localStorage
- 🎨 **Tailwind UI** – Clean, responsive interface with modern styling
- 📱 **Mobile Ready** – Fully responsive design for phones, tablets, and desktops
- 🤖 **Powered by OpenAI GPT-3.5** – Securely integrated using Netlify Functions
- 🏷️ **Simple Recipes** – Focused on easy, everyday meals
- 📄 **JSON-Formatted Output** – Structured responses for clean UI rendering

---
## 💻 Usage

### 🧑‍🍳 1. Enter Ingredients

- Start typing ingredients like "tomato", "cheese", or "chicken" and press Enter or click on Add button to add them. Remove any by clicking × .
- If you enter the correct ingredients and still don't get the recipes, please try again.

### ⚡ 2. Generate Recipes

- Click on **"Suggest Recipes"**
- The app sends your ingredients to a secure Netlify Function
- OpenAI GPT-3.5 returns 3–4 personalized, home-style recipe suggestions.

### 📋 3. View Recipes

- Each recipe displays:
  - ✅ Recipe Name
  - 🛒 Ingredients
  - ✨ Optional Add-ons
  - 📖 Step-by-step Instructions

### 🔖 4. Save Recipes

- Click the 🔖 **Bookmark** button to save a recipe locally
- Saved recipes are stored using `localStorage` and stay even after refresh
- View them anytime under the **"Saved Recipes"** section
- Click 🔖 again to remove from saved

### 📱 5. Responsive Experience

- The app adapts beautifully across devices
- Optimized for desktop, tablet, and mobile screens using Tailwind CSS
-----

## ❌ Drawbacks & Future Improvements

### 1. Hardcoded Input Validation
The current input validation uses a hardcoded blacklist and simple string checks to filter unsupported or irrelevant ingredients. While this works for a small-scale project or proof of concept, it's **not scalable** or flexible enough for diverse user inputs.

**✔ Potential Improvements:**
- Integrate third-party ingredient APIs like [Spoonacular](https://spoonacular.com/food-api) or [Edamam](https://developer.edamam.com/) etc for dynamic ingredient recognition.
- Use fuzzy string matching (e.g., `fuzzywuzzy`, `RapidFuzz`) to handle typos and close variants.
- Implement NLP-based input processing to extract valid ingredients from free-form text.
- Add autocomplete/tag suggestion inputs to improve user experience and reduce errors.

---

### 2. Netlify Timeout Limitation (Free Tier)
This project is hosted on Netlify's **free-tier**, which enforces a **10-second timeout** on serverless function execution. If the backend processing or OpenAI API call takes longer, the function silently times out and the user receives no response.

**✔ Potential Improvements:**
- Optimize prompt construction and reduce response latency by simplifying API calls.
- Add client-side feedback (e.g., “Request timed out, please try again.”) to improve UX.
- Migrate backend functions to a platform with longer execution limits (e.g., AWS Lambda, Vercel Pro).
- Consider implementing background processing with polling or webhooks for long-running tasks.



-----------
## 🌟 Show your support

Give a ⭐️ if this project helped you or you liked the project!

## 📫 Contact

Have questions? Reach out to me:
- 💼 LinkedIn: [Sai Rishith Chintala](https://www.linkedin.com/in/sai-rishith-chintala)
- 📧 Email: [rishi.chintala19@gmail.com](mailto:rishi.chintala19@gmail.com)
- 🌐 Check out the live app: [Kitchen to Feast AI](https://kitchentofeastai.netlify.app/)
