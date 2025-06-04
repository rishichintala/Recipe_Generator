// import React from "react";

// const IngredientDemo = () => {
//   return (
//     <div className="ingredient-demo mb-4 px-4 py-3 border border-dashed border-green-300 rounded bg-green-50 text-green-800 text-sm animate-fade-in">
//       👉 Start typing ingredients like <strong>"tomato"</strong>, <strong>"cheese"</strong>, or <strong>"chicken"</strong> and press <strong>Enter</strong> or click 
//       on <strong>Add button</strong> to add them.
//       Remove any by clicking <strong> × </strong>.
//     </div>
//   );
// };

// export default IngredientDemo;

import React, { useEffect, useState } from "react";

const IngredientDemo = () => {
  const rawHtml = `👉 Start typing ingredients like <strong>"tomato"</strong>, <strong>"cheese"</strong>, or <strong>"chicken"</strong> etc and press <strong>Enter</strong> or click on <strong>Add button</strong> to add them.
       Remove any by clicking <strong> × </strong>.
       <strong>Tip:</strong> Make sure your ingredients are simple and relevant. If no results appear, give it another try!

       `;
  
       

  const [charIndex, setCharIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (charIndex < rawHtml.length) {
      const timeout = setTimeout(() => setCharIndex(charIndex + 1), 10);
      return () => clearTimeout(timeout);
    } else {
      setIsDone(true);
    }
  }, [charIndex]);

  const visibleHtml = rawHtml.slice(0, charIndex);

  return (
    <div
      className="ingredient-demo mb-4 px-4 py-3 border border-dashed border-green-300 rounded bg-green-50 text-green-800 text-sm font-mono"
      dangerouslySetInnerHTML={{
        __html: visibleHtml + (!isDone ? '<span class="blinking-cursor">|</span>' : ""),
      }}
    />
  );
};

export default IngredientDemo;

