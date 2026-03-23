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
  overwhelmed: "😵‍💫",
};

// Each mood gets its own color identity
const moodColors = {
  tired: { bg: "bg-indigo-50", border: "border-indigo-200", activeBg: "bg-indigo-200", activeBorder: "border-indigo-400", shadow: "shadow-indigo-100" },
  happy: { bg: "bg-amber-50", border: "border-amber-200", activeBg: "bg-amber-200", activeBorder: "border-amber-400", shadow: "shadow-amber-100" },
  sad: { bg: "bg-sky-50", border: "border-sky-200", activeBg: "bg-sky-200", activeBorder: "border-sky-400", shadow: "shadow-sky-100" },
  rushed: { bg: "bg-red-50", border: "border-red-200", activeBg: "bg-red-200", activeBorder: "border-red-400", shadow: "shadow-red-100" },
  "date-night": { bg: "bg-pink-50", border: "border-pink-200", activeBg: "bg-pink-200", activeBorder: "border-pink-400", shadow: "shadow-pink-100" },
  chill: { bg: "bg-cyan-50", border: "border-cyan-200", activeBg: "bg-cyan-200", activeBorder: "border-cyan-400", shadow: "shadow-cyan-100" },
  overwhelmed: { bg: "bg-orange-50", border: "border-orange-200", activeBg: "bg-orange-200", activeBorder: "border-orange-400", shadow: "shadow-orange-100" },
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
  "date-night": "/videos/rascal-date-night.mp4",
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
  const btnWidth = isMobile ? Math.max(containerSize * 0.26, 82) : 130;
  const btnHeight = isMobile ? 60 : 68;
  const maxRadius = containerSize / 2 - btnWidth / 2 - 4;
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
          const isSelected = selectedMoods.includes(moodKey);
          const colors = moodColors[moodKey] || moodColors.happy;

          return (
            <motion.button
              key={moodKey}
              role="radio"
              aria-checked={isSelected}
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
              whileTap={{ scale: 0.9 }}
              animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
              className={`border-2 transition-all duration-200 focus:ring-2 focus:ring-pink-400 focus:outline-none ${
                isSelected
                  ? `${colors.activeBg} ${colors.activeBorder} shadow-lg ${colors.shadow}`
                  : `${colors.bg} ${colors.border} shadow-md hover:shadow-lg`
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-0.5">
                <span style={{ fontSize: isMobile ? "1.5rem" : "1.8rem", lineHeight: 1 }}>
                  {moodEmojis[moodKey] || "🍽️"}
                </span>
                <span className={`${isMobile ? "text-[9px]" : "text-xs"} font-semibold capitalize truncate w-full text-center block ${
                  isSelected ? "text-gray-800" : "text-gray-500"
                }`}>
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
