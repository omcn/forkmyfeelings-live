"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ShoppingListModal({ recipe, onClose }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : (() => { try { return JSON.parse(recipe.ingredients || "[]"); } catch { return []; } })();

  const listText = ingredients.join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(listText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard API
      try {
        const textarea = document.createElement("textarea");
        textarea.value = listText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {
        toast.error("Couldn't copy — try long-pressing to select text instead");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
          aria-label="Close shopping list"
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-center">🛍️ Shopping List</h2>
        {ingredients.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No ingredients found for this recipe.</p>
        ) : (
          <ul className="list-disc list-inside text-left space-y-1 text-gray-800">
            {ingredients.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopy}
            disabled={ingredients.length === 0}
            className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold py-2 px-4 rounded-xl transition flex items-center justify-center gap-1"
          >
            {copySuccess ? "✅ Copied!" : "📋 Copy to Clipboard"}
          </button>

          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(listText)}`}
            download={`shopping-list-${recipe.name.replace(/\s+/g, "-").toLowerCase()}.txt`}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-xl transition text-center"
          >
            💾 Save to Notes
          </a>
        </div>
      </div>
    </div>
  );
}
