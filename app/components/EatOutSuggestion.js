"use client";
import { useEffect, useState } from "react";

export default function EatOutSuggestion({ selectedMoods }) {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      if (!("geolocation" in navigator)) {
        setError("Location is not supported by your browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.error("Geolocation failed:", err);
          setError("Could not get your location. Please enable location access.");
        }
      );
    }
  }, [location]);

  useEffect(() => {
    if (location && selectedMoods.length > 0) fetchPlaces();
  }, [location, selectedMoods]);

  const fetchPlaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lng } = location;
      const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&keyword=${encodeURIComponent(moodToSearch)}&type=restaurant`;
      const response = await fetch(`/api/proxy-places?endpoint=${encodeURIComponent(endpoint)}`);
      if (!response.ok) throw new Error("Failed to fetch nearby places");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setPlaces(data.results || []);
    } catch (err) {
      console.error("Places fetch error:", err);
      setError("Could not find nearby places. Try again later.");
      setPlaces([]);
    }
    setLoading(false);
  };

  const openInMaps = (place) => {
    // Use universal Google Maps link that works on iOS (opens Apple Maps or Google Maps) and Android
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-8 max-w-xl w-full bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-1">🍽️ Nearby Spots</h2>
      <p className="text-xs text-gray-400 mb-4">Based on your mood: {moodToSearch}</p>
      {selectedMoods.length === 0 ? (
        <p className="text-gray-600">Pick a mood to discover spots nearby!</p>
      ) : error ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => { setError(null); if (location) fetchPlaces(); }}
            className="mt-3 text-sm text-pink-600 hover:text-pink-800 font-medium"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🤷</div>
          <p className="text-gray-600">No results found nearby.</p>
          <p className="text-sm text-gray-400 mt-1">Try a different mood!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {places.slice(0, 8).map((place) => (
            <li key={place.place_id}>
              <button
                onClick={() => openInMaps(place)}
                className="w-full text-left border border-gray-100 rounded-xl p-3.5 hover:bg-pink-50 hover:border-pink-200 active:bg-pink-100 transition flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{place.name}</p>
                  <p className="text-gray-500 text-xs truncate">{place.vicinity}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {place.rating && (
                      <span className="text-xs text-amber-600 font-medium">⭐ {place.rating}</span>
                    )}
                    {place.opening_hours?.open_now !== undefined && (
                      <span className={`text-xs font-medium ${place.opening_hours.open_now ? "text-green-600" : "text-red-500"}`}>
                        {place.opening_hours.open_now ? "Open now" : "Closed"}
                      </span>
                    )}
                    {place.price_level && (
                      <span className="text-xs text-gray-400">{"£".repeat(place.price_level)}</span>
                    )}
                  </div>
                </div>
                <span className="text-pink-400 text-sm shrink-0">Maps →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
