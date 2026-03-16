"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    emoji: "👋",
    title: "Welcome to Fork My Feels!",
    body: "Rascal is your emotional sous chef. Tell us how you're feeling right now and we'll find the perfect recipe for your vibe.",
    bg: "from-rose-100 to-pink-200",
  },
  {
    emoji: "🎡",
    title: "Spin the mood wheel",
    body: "Tap a mood on the orbital wheel — tired, happy, chill, or date-night — then hit Feed Me and Rascal will work his magic.",
    bg: "from-orange-100 to-rose-100",
  },
  {
    emoji: "📸",
    title: "Share & connect",
    body: "Cook your recipe, snap a photo and post it to Today's Feed. Find friends, earn confetti, and play Rascal Space Glide between bites.",
    bg: "from-pink-100 to-fuchsia-100",
  },
];

export default function Onboarding({ onDone }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const advance = () => {
    if (isLast) {
      localStorage.setItem("fmf_onboarded", "1");
      onDone();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.35 }}
          className={`w-full max-w-sm rounded-3xl bg-gradient-to-br ${slide.bg} p-8 shadow-2xl flex flex-col items-center text-center`}
        >
          <div className="text-6xl mb-4">{slide.emoji}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{slide.title}</h2>
          <p className="text-gray-700 leading-relaxed mb-8">{slide.body}</p>

          {/* Progress dots */}
          <div className="flex gap-2 mb-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-pink-500" : "w-2 bg-pink-200"}`}
              />
            ))}
          </div>

          <button
            onClick={advance}
            className="w-full bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-semibold py-3 rounded-2xl shadow-md transition-all"
          >
            {isLast ? "Let's eat! 🍴" : "Next →"}
          </button>

          {!isLast && (
            <button
              onClick={() => { localStorage.setItem("fmf_onboarded", "1"); onDone(); }}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Skip
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
