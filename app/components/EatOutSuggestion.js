"use client";
import { useEffect, useState } from "react";

export default function EatOutSuggestion({ selectedMoods }) {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const moodKeywords = {
    anxious: "cozy", stressed: "cozy",
    tired: "coffee", sleepy: "coffee",
    sad: "comfort food", heartbroken: "comfort food",
    happy: "ice cream", joyful: "ice cream",
    excited: "dessert", energetic: "dessert",
    calm: "tea", peaceful: "tea",
    romantic: "romantic", flirty: "romantic",
    bored: "fast food", curious: "fusion",
    adventurous: "international", nostalgic: "diner",
    angry: "spicy food", hangry: "quick bites",
    focused: "healthy", productive: "healthy",
    social: "bar", celebrating: "steakhouse",
    lonely: "diner", lazy: "brunch",
    "date-night": "romantic", chill: "café",
    overwhelmed: "comfort food", recovering: "soup",
    rushed: "fast food",
  };

  const resolvedKeywords = selectedMoods.map((mood) => moodKeywords[mood]).filter(Boolean);
  const moodToSearch = [...new Set(resolvedKeywords)].join(" ") || "restaurant";

  useEffect(() => {
    if (!location) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation failed:", err)
      );
    }
  }, []);

  useEffect(() => {
    if (location && selectedMoods.length > 0) fetchPlaces();
  }, [location, selectedMoods]);

  const fetchPlaces = async () => {
    setLoading(true);
    const { lat, lng } = location;
    const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&keyword=${encodeURIComponent(moodToSearch)}&type=restaurant`;
    const response = await fetch(`/api/proxy-places?endpoint=${encodeURIComponent(endpoint)}`);
    const data = await response.json();
    setPlaces(data.results || []);
    setLoading(false);
  };

  return (
    <div className="mt-8 max-w-xl w-full bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🍽️ Nearby Spots for Your Mood</h2>
      {selectedMoods.length === 0 ? (
        <p className="text-gray-600">Pick a mood to discover spots nearby!</p>
      ) : loading ? (
        <p className="text-gray-500 animate-pulse">Finding the vibe…</p>
      ) : places.length === 0 ? (
        <p className="text-gray-600">No results found. Try again later!</p>
      ) : (
        <ul className="space-y-3">
          {places.slice(0, 5).map((place) => (
            <li key={place.place_id} className="border border-gray-100 rounded-xl p-3">
              <p className="font-semibold text-gray-800">{place.name}</p>
              <p className="text-gray-500 text-sm">{place.vicinity}</p>
              {place.rating && <p className="text-yellow-500 text-sm mt-0.5">⭐ {place.rating}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
