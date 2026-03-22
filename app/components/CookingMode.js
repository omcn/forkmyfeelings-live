"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import RascalSpaceGlide from "./RascalSpaceGlide";
import { moodEmojis } from "./MoodSelector";

function extractMinutes(stepText) {
  const match = stepText.match(/(\d+)\s*(min|minutes?)/i);
  return match ? parseInt(match[1]) : null;
}

export default function CookingMode({
  recipe,
  selectedMoods,
  moodRating,
  setMoodRating,
  timeLeft,
  setTimeLeft,
  isTiming,
  setIsTiming,
  haptic,
  windowWidth,
  onDone,
  onPostCapture,
  submitRecipeRating,
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  let stepsArray = [];
  try {
    stepsArray = Array.isArray(recipe.steps)
      ? recipe.steps
      : JSON.parse(recipe.steps || "[]");
  } catch (err) {
    console.error("Failed to parse steps", err);
  }

  if (stepsArray.length === 0) {
    return (
      <div className="mt-6 bg-white p-6 rounded-2xl shadow-xl max-w-4xl w-full text-center">
        <p className="text-gray-500">This recipe has no steps yet.</p>
        <button onClick={onDone} className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-full">Go Back</button>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white p-6 rounded-2xl shadow-xl max-w-4xl w-full">
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-6">
        {/* Left side: Mood info */}
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm text-gray-500">You're feeling...</p>
          <h2 className="text-2xl font-bold mt-1 capitalize">
            {moodEmojis[selectedMoods[0]] || "🍴"} {selectedMoods[0] || "hungry"}
          </h2>
          <p className="text-md mt-2 text-gray-600 italic">
            Let's cook something to match your vibe.
          </p>
        </div>

        {/* Right side: Rascal animation */}
        <div className="flex-1 flex justify-center">
          <video
            src="/videos/rascal-cooking.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-48 h-48 md:w-60 md:h-60 rounded-full shadow-lg object-cover"
          />
        </div>
      </div>

      {/* Recipe Step Display */}
      <h3 className="text-xl font-semibold mb-2">
        Step {activeStepIndex + 1} of {stepsArray.length}
      </h3>
      <p className="text-gray-800 mb-4">{stepsArray[activeStepIndex]}</p>

      {/* Timer logic */}
      {(() => {
        const minutes = extractMinutes(stepsArray[activeStepIndex]);

        if (minutes && !isTiming && timeLeft === null) {
          return (
            <button
              onClick={() => {
                const secs = minutes * 60;
                const endTime = Date.now() + secs * 1000;
                setTimeLeft(secs);
                setIsTiming(true);
                localStorage.setItem("fmf_timer_end", endTime.toString());
                haptic("medium");
                navigator.serviceWorker?.controller?.postMessage({
                  type: "TIMER_SET",
                  endTime,
                  recipeName: recipe?.name,
                  minutes,
                });
              }}
              className="mt-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl"
            >
              ⏱️ Start {minutes}-Minute Timer
            </button>
          );
        } else if (isTiming && timeLeft > 0) {
          return (
            <>
              <p className="mt-4 text-lg text-pink-600 font-bold">
                ⏳ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")} left...
              </p>
              <div className="my-6">
                <RascalSpaceGlide
                  secondsRemaining={timeLeft}
                  onTimeUp={() => {
                    setTimeLeft(0);
                    setIsTiming(false);
                    setActiveStepIndex((i) => Math.min(i + 1, stepsArray.length - 1));
                  }}
                />
              </div>
            </>
          );
        } else if (isTiming && timeLeft === 0) {
          return (
            <p className="mt-4 text-green-600 font-semibold">
              ✅ Time's up! Let's keep going.
            </p>
          );
        }
        return null;
      })()}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
          disabled={activeStepIndex === 0}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
        >
          ← Back
        </button>

        {activeStepIndex < stepsArray.length - 1 ? (
          <button
            onClick={() => {
              haptic("light");
              setActiveStepIndex((i) => Math.min(stepsArray.length - 1, i + 1));
            }}
            className="text-sm text-pink-500 hover:text-pink-700"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => {
              setShowCelebration(true);
              setTimeout(() => setShowRatingModal(true), 1500);
            }}
          >
            Done ✓
          </button>
        )}
      </div>

      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative text-center">
            <button
              onClick={() => setShowRatingModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
              aria-label="Close rating modal"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-2">⭐ Rate This Recipe</h2>
            <p className="text-gray-600 mb-4">How well did it match your mood?</p>

            {showCelebration && (
              <div className="fixed inset-0 z-[9999] pointer-events-none">
                <Confetti
                  width={windowWidth || 390}
                  height={typeof window !== "undefined" ? window.innerHeight : 800}
                  numberOfPieces={300}
                  recycle={false}
                />
              </div>
            )}

            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => { setMoodRating(star); haptic("light"); }}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  className={`text-4xl p-1 transition-transform active:scale-110 ${
                    star <= moodRating ? "text-yellow-400" : "text-gray-300"
                  } hover:text-yellow-500`}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  onDone();
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition"
              >
                Skip
              </button>
              <button
                disabled={moodRating === 0}
                onClick={() => {
                  setShowRatingModal(false);
                  submitRecipeRating(moodRating);
                  onPostCapture();
                }}
                className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-200 disabled:text-pink-400 text-white font-semibold py-2 px-4 rounded-xl transition"
              >
                {moodRating === 0 ? "Tap a star ↑" : `Submit ${moodRating}★`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
