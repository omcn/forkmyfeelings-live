"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const moodFilters = [
  { key: "all", label: "🍽️ All", search: "restaurant" },
  { key: "cozy", label: "🛋️ Cozy", search: "cozy restaurant" },
  { key: "romantic", label: "💘 Date Night", search: "romantic restaurant" },
  { key: "coffee", label: "☕ Coffee", search: "coffee shop" },
  { key: "brunch", label: "🥞 Brunch", search: "brunch" },
  { key: "healthy", label: "🥗 Healthy", search: "healthy restaurant" },
  { key: "fast", label: "🍔 Quick Bites", search: "fast food" },
  { key: "spicy", label: "🌶️ Spicy", search: "spicy food restaurant" },
  { key: "dessert", label: "🍰 Dessert", search: "dessert cafe" },
  { key: "bar", label: "🍸 Drinks", search: "bar cocktails" },
  { key: "international", label: "🌍 World Food", search: "international restaurant" },
  { key: "diner", label: "🍳 Diner", search: "diner" },
  { key: "steakhouse", label: "🥩 Steak", search: "steakhouse" },
  { key: "sushi", label: "🍣 Sushi", search: "sushi restaurant" },
  { key: "pizza", label: "🍕 Pizza", search: "pizza restaurant" },
  { key: "chinese", label: "🥡 Chinese", search: "chinese restaurant" },
  { key: "indian", label: "🍛 Indian", search: "indian restaurant" },
  { key: "mexican", label: "🌮 Mexican", search: "mexican restaurant" },
];

// Mood-to-vibe mapping for auto-suggesting filters
const moodToFilter = {
  tired: "coffee", sleepy: "coffee",
  happy: "dessert", joyful: "dessert",
  sad: "cozy", heartbroken: "cozy",
  anxious: "cozy", stressed: "cozy",
  romantic: "romantic", flirty: "romantic", "date-night": "romantic",
  calm: "coffee", peaceful: "coffee",
  bored: "fast", curious: "international",
  adventurous: "international",
  angry: "spicy", hangry: "fast",
  focused: "healthy", productive: "healthy",
  social: "bar", celebrating: "steakhouse",
  nostalgic: "diner", lonely: "diner",
  lazy: "brunch", chill: "brunch",
  overwhelmed: "cozy", recovering: "cozy",
  rushed: "fast", excited: "dessert", energetic: "bar",
};

export default function EatOutPage() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const filterScrollRef = useRef(null);

  // Load saved places from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fmf_saved_places");
      if (raw) setSavedPlaces(JSON.parse(raw));
    } catch {}
  }, []);

  // Get location on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Location not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error("Geolocation error:", err);
        setLocationError("Enable location access to find places near you.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Check if user came with a mood from the home page
  useEffect(() => {
    try {
      const lastMood = localStorage.getItem("lastMood");
      if (lastMood && moodToFilter[lastMood]) {
        setActiveFilter(moodToFilter[lastMood]);
      }
    } catch {}
  }, []);

  const currentFilter = moodFilters.find((f) => f.key === activeFilter) || moodFilters[0];

  const openInMaps = (searchTerm) => {
    if (!location) {
      toast.error("Waiting for your location...");
      return;
    }
    // Use sll (search lat/lng) + spn (span) to force Apple Maps to search near the user's location
    // This prevents it from jumping to a random country
    const url = `https://maps.apple.com/?q=${encodeURIComponent(searchTerm)}&sll=${location.lat},${location.lng}&spn=0.05,0.05&z=14`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const savePlace = (filter) => {
    const place = {
      id: `${filter.key}-${Date.now()}`,
      label: filter.label,
      search: filter.search,
      savedAt: new Date().toISOString(),
    };
    const next = [place, ...savedPlaces.filter((p) => p.search !== filter.search)].slice(0, 20);
    setSavedPlaces(next);
    localStorage.setItem("fmf_saved_places", JSON.stringify(next));
    toast.success(`Saved "${filter.label}" to favourites`);
  };

  const removeSavedPlace = (id) => {
    const next = savedPlaces.filter((p) => p.id !== id);
    setSavedPlaces(next);
    localStorage.setItem("fmf_saved_places", JSON.stringify(next));
    toast("Removed from favourites", { icon: "💔" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-rose-100 to-rose-100/95 backdrop-blur-sm px-4 pt-6 pb-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition"
            >
              <span className="text-lg">←</span> Home
            </button>
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full transition ${
                showSaved
                  ? "bg-pink-500 text-white"
                  : "bg-white/80 text-pink-600 border border-pink-200"
              }`}
            >
              ❤️ Saved {savedPlaces.length > 0 && `(${savedPlaces.length})`}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">🍽️ Eating Out</h1>
          <p className="text-sm text-gray-500 mb-4">Find the perfect spot for your mood.</p>

          {/* Location status */}
          {locationError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
              <span className="text-lg">📍</span>
              <div className="flex-1">
                <p className="text-sm text-red-700">{locationError}</p>
              </div>
              <button
                onClick={() => {
                  setLocationError(null);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => setLocationError("Still can't access location. Check your settings."),
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                className="text-xs text-red-600 font-semibold"
              >
                Retry
              </button>
            </div>
          ) : !location ? (
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <div className="w-3 h-3 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
              <span className="text-sm">Getting your location…</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-green-600 mb-4">
              <span className="text-sm">📍</span>
              <span className="text-xs font-medium">Location found</span>
            </div>
          )}

          {/* Filter chips — scrollable */}
          <div
            ref={filterScrollRef}
            className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {moodFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setActiveFilter(filter.key);
                  setShowSaved(false);
                }}
                className={`whitespace-nowrap px-3.5 py-2 rounded-full text-sm font-medium transition shrink-0 ${
                  activeFilter === filter.key
                    ? "bg-pink-500 text-white shadow-sm"
                    : "bg-white/80 text-gray-600 border border-gray-200 hover:bg-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <AnimatePresence mode="wait">
          {showSaved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Favourites</h2>
              {savedPlaces.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <div className="text-5xl mb-3">📍</div>
                  <p className="text-gray-700 font-semibold mb-1">No saved places yet</p>
                  <p className="text-sm text-gray-400">Tap the heart on any category to save it here.</p>
                </div>
              ) : (
                savedPlaces.map((place) => (
                  <div key={place.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{place.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Saved {new Date(place.savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <button
                        onClick={() => openInMaps(place.search)}
                        className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
                      >
                        Open Maps
                      </button>
                      <button
                        onClick={() => removeSavedPlace(place.id)}
                        className="text-gray-300 hover:text-red-400 text-lg transition p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Main CTA card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{currentFilter.label.split(" ")[0]}</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{currentFilter.label.split(" ").slice(1).join(" ") || "All Restaurants"}</h2>
                    <p className="text-xs text-gray-500">Searching for "{currentFilter.search}" near you</p>
                  </div>
                </div>

                <button
                  onClick={() => openInMaps(currentFilter.search)}
                  disabled={!location}
                  className="w-full bg-pink-500 hover:bg-pink-600 active:bg-pink-700 disabled:bg-pink-200 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm mb-3"
                >
                  <span className="text-lg">🗺️</span>
                  {location ? "Open in Apple Maps" : "Waiting for location..."}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => savePlace(currentFilter)}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium py-2.5 rounded-xl transition border border-rose-200"
                  >
                    ❤️ Save to Favourites
                  </button>
                  <button
                    onClick={() => {
                      if (!location) return;
                      const text = `Let's go to a ${currentFilter.search}! 🍽️\n\nFound on Fork My Feels`;
                      if (navigator.share) {
                        navigator.share({ title: `${currentFilter.label} near me`, text, url: "https://forkmyfeelings.com/eat-out" });
                      } else {
                        navigator.clipboard.writeText(text);
                        toast.success("Copied to clipboard!");
                      }
                    }}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2.5 rounded-xl transition border border-blue-200"
                  >
                    📤 Share with Friend
                  </button>
                </div>
              </div>

              {/* Suggestions section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2.5">More to explore</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {moodFilters
                    .filter((f) => f.key !== activeFilter && f.key !== "all")
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 6)
                    .map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => openInMaps(filter.search)}
                        className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 text-left hover:bg-pink-50 hover:border-pink-200 active:bg-pink-100 transition"
                      >
                        <span className="text-2xl block mb-1">{filter.label.split(" ")[0]}</span>
                        <p className="text-sm font-medium text-gray-800">{filter.label.split(" ").slice(1).join(" ")}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Tap to open Maps</p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Tip */}
              <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 text-center">
                <p className="text-xs text-pink-700">
                  💡 <strong>Tip:</strong> Select a mood on the home page first — we'll auto-pick the best food vibe for you!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
