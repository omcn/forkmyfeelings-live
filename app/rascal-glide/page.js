"use client";
import RascalSpaceGlide from "../components/RascalSpaceGlide";
import toast from "react-hot-toast";

export default function RascalGlidePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-pink-50">
      <h1 className="text-3xl font-bold mb-6 text-pink-600">🚀 Rascal Space Glide</h1>
      <RascalSpaceGlide
        secondsRemaining={30}
        onTimeUp={() => toast("⏰ Time's up!", { icon: "🕹️" })}
      />
      <p className="mt-4 text-gray-500 text-sm">Use ← and → arrow keys to dodge!</p>
    </main>
  );
}
