"use client";
import { useEffect, useState } from "react";

export default function EatOutSuggestion({ selectedMoods }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const moodKeywords = {
    anxious: "cozy restaurant", stressed: "cozy restaurant",
    tired: "coffee shop", sleepy: "coffee shop",
    sad: "comfort food", heartbroken: "comfort food",
    happy: "ice cream", joyful: "ice cream",
    excited: "dessert", energetic: "dessert",
    calm: "tea room", peaceful: "tea room",
    romantic: "romantic restaurant", flirty: "romantic restaurant",
    bored: "fast food", curious: "fusion restaurant",
    adventurous: "international restaurant", nostalgic: "diner",
    angry: "spicy food", hangry: "quick bites",
    focused: "healthy restaurant", productive: "healthy restaurant",
    social: "bar", celebrating: "steakhouse",
    lonely: "diner", lazy: "brunch",
    "date-night": "romantic restaurant", chill: "café",
    overwhelmed: "comfort food", recovering: "soup restaurant",
    rushed: "fast food",
  };

  const resolvedKeywords = selectedMoods.map((mood) => moodKeywords[mood]).filter(Boolean);
  const moodToSearch = [...new Set(resolvedKeywords)].join(" ") || "restaurant";

  useEffect(() => {
    if (!location) {
      if (!("geolocation" in navigator)) {
        setError("Location is not supported by your browser.");
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoading(false);
        },
        (err) => {
          console.error("Geolocation failed:", err);
          setError("Could not get your location. Please enable location access.");
          setLoading(false);
        }
      );
    }
  }, [location]);

  const openInAppleMaps = () => {
    if (!location) return;
    // Apple Maps URL scheme — opens natively on iOS, falls back to maps.apple.com on web
    const query = encodeURIComponent(moodToSearch);
    const url = `https://maps.apple.com/?q=${query}&near=${location.lat},${location.lng}&z=14`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Build mood-specific suggestions to show as quick-tap buttons
  const suggestions = [...new Set(resolvedKeywords)].slice(0, 4);

  const openSuggestion = (keyword) => {
    if (!location) return;
    const url = `https://maps.apple.com/?q=${encodeURIComponent(keyword)}&near=${location.lat},${location.lng}&z=14`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-8 max-w-xl w-full bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-1">🍽️ Eating Out</h2>
      <p className="text-sm text-gray-500 mb-5">
        We'll find spots near you that match your mood.
      </p>

      {selectedMoods.length === 0 ? (
        <p className="text-gray-600 text-sm">Pick a mood first to get suggestions!</p>
      ) : error ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => { setError(null); setLocation(null); }}
            className="mt-3 text-sm text-pink-600 hover:text-pink-800 font-medium"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
          <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
          <span className="text-sm">Getting your location…</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Main CTA — opens Apple Maps with mood search */}
          <button
            onClick={openInAppleMaps}
            className="w-full bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <span className="text-lg">🗺️</span>
            Open in Maps — "{moodToSearch}"
          </button>

          {/* Quick suggestion chips */}
          {suggestions.length > 1 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Or try a specific vibe:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => openSuggestion(keyword)}
                    className="bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-medium px-3.5 py-2 rounded-full transition border border-rose-200"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center pt-2">
            Opens in Apple Maps with restaurants near you
          </p>
        </div>
      )}
    </div>
  );
}
