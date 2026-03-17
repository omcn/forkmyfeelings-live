"use client";
import { useState } from "react";

export default function ShoppingListModal({ recipe, onClose }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : JSON.parse(recipe.ingredients || "[]");

  const listText = ingredients.join("\n");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
          aria-label="Close shopping list"
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-center">🛍️ Shopping List</h2>
        <ul className="list-disc list-inside text-left space-y-1 text-gray-800">
          {ingredients.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(listText).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
              });
            }}
            className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition"
          >
            📋 Copy to Clipboard
          </button>

          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(listText)}`}
            download={`shopping-list-${recipe.name.replace(/\s+/g, "-").toLowerCase()}.txt`}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-xl transition text-center"
          >
            💾 Save to Notes
          </a>
          {copySuccess && (
            <p className="text-green-600 mt-2 text-sm text-center">
              ✅ Copied to clipboard!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
