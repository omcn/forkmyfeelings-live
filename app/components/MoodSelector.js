"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const moodEmojis = {
  tired: "😴",
  happy: "😊",
  sad: "😢",
  rushed: "⏰",
  "date-night": "💘",
  chill: "🧊",
  recovering: "🛌",
  bored: "😐",
  nostalgic: "🕰️",
  overwhelmed: "😵‍💫",
};

function MoodTooltip({ label, children }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(true)}
      onTouchEnd={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full mb-1 px-2 py-1 text-xs rounded bg-black text-white shadow z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
}

export { moodEmojis };

const rascalVideos = {
  sad: "/videos/rascal-sad.mp4",
  tired: "/videos/rascal-tired.mp4",
  chill: "/videos/rascal-chill.mp4",
  rushed: "/videos/rascal-rushed.mp4",
  happy: "/videos/rascal-happy1.mp4",
  overwhelmed: "/videos/rascal-overwhelmed.mp4",
  nostalgic: "/videos/rascal-nostalgic.mp4",
  "date-night": "/videos/rascal-date-night.mp4",
  recovering: "/videos/rascal-recovering.mp4",
  bored: "/videos/rascal-bored.mp4",
};

export default function MoodSelector({
  recipes,
  selectedMoods,
  onMoodChange,
  windowWidth,
  isMobile,
  clickSound,
  haptic,
}) {
  const containerSize = Math.min((windowWidth || 390) - 32, 460);
  const btnWidth = isMobile ? Math.max(containerSize * 0.22, 70) : 120;
  const btnHeight = isMobile ? 52 : 62;
  const maxRadius = containerSize / 2 - btnWidth / 2 - 6;
  const radius = Math.min(containerSize * 0.44, maxRadius);

  const currentMood = selectedMoods[0];
  const videoSrc = useMemo(() => rascalVideos[currentMood] || "/videos/rascal-idle.mp4", [currentMood]);
  const rascalSize = Math.min(containerSize * 0.46, 250);

  const moodKeys = useMemo(
    () => Object.keys(recipes).filter((k) => k !== "default"),
    [recipes]
  );

  return (
    <div
      className="relative mx-auto"
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Mood Buttons in orbit */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
        }}
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: { staggerChildren: 0.04, delayChildren: 0.5 },
          },
        }}
      >
        {moodKeys.map((moodKey, i) => {
          const total = moodKeys.length;
          const angle = (360 / total) * i - 90;
          const x = radius * Math.cos((angle * Math.PI) / 180);
          const y = radius * Math.sin((angle * Math.PI) / 180);

          return (
            <motion.button
              key={moodKey}
              role="radio"
              aria-checked={selectedMoods.includes(moodKey)}
              aria-label={`${moodKey.replace("-", " ")} mood`}
              tabIndex={0}
              style={{
                position: "absolute",
                left: x - btnWidth / 2,
                top: y - btnHeight / 2,
                width: btnWidth,
                height: btnHeight,
                borderRadius: "999px",
              }}
              variants={{
                hidden: { opacity: 0, scale: 0.8, originX: "50%", originY: "50%" },
                visible: { opacity: 1, scale: 1, originX: "50%", originY: "50%" },
              }}
              onClick={() => {
                clickSound?.play();
                haptic?.("light");
                const next = selectedMoods[0] === moodKey ? [] : [moodKey];
                onMoodChange(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.click();
                }
              }}
              whileTap={{ scale: 0.95 }}
              className={`shadow-md ${isMobile ? "px-1 py-1" : "px-4 py-2"} text-base rounded-full border transition focus:ring-2 focus:ring-pink-400 focus:outline-none ${
                selectedMoods.includes(moodKey)
                  ? "bg-pink-200 border-pink-400"
                  : "bg-white border-gray-300 hover:bg-pink-100"
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <span style={{ fontSize: isMobile ? "1.2rem" : "1.5rem" }}>
                  {moodEmojis[moodKey] || "🍽️"}
                </span>
                <span className={`${isMobile ? "text-[10px]" : "text-sm"} font-medium capitalize truncate w-full text-center block`}>
                  {moodKey.replace("-", " ")}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Rascal center animation */}
      <div
        className="absolute z-20 rounded-full border-2 border-pink-300 shadow-lg bg-white overflow-hidden"
        style={{
          width: rascalSize,
          height: rascalSize,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.video
            key={videoSrc}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}
