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

// Colors as inline styles (hex) for clip-path divs
const moodColorStyles = {
  tired:        { bg: "#eef2ff", activeBg: "#c7d2fe", border: "#a5b4fc", activeBorder: "#818cf8" },
  happy:        { bg: "#fffbeb", activeBg: "#fde68a", border: "#fcd34d", activeBorder: "#f59e0b" },
  sad:          { bg: "#f0f9ff", activeBg: "#bae6fd", border: "#7dd3fc", activeBorder: "#38bdf8" },
  rushed:       { bg: "#fef2f2", activeBg: "#fecaca", border: "#fca5a5", activeBorder: "#f87171" },
  "date-night": { bg: "#fdf2f8", activeBg: "#fbcfe8", border: "#f9a8d4", activeBorder: "#f472b6" },
  chill:        { bg: "#ecfeff", activeBg: "#a5f3fc", border: "#67e8f9", activeBorder: "#22d3ee" },
  overwhelmed:  { bg: "#fff7ed", activeBg: "#fed7aa", border: "#fdba74", activeBorder: "#fb923c" },
};

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

/**
 * Build an SVG path string for a donut arc segment.
 * All coordinates are in a 0–size space.
 */
function makeArcClipPath(size, innerR, outerR, startDeg, endDeg) {
  const cx = size / 2;
  const cy = size / 2;
  const toRad = (d) => (d * Math.PI) / 180;

  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;

  const ox1 = cx + outerR * Math.cos(s);
  const oy1 = cy + outerR * Math.sin(s);
  const ox2 = cx + outerR * Math.cos(e);
  const oy2 = cy + outerR * Math.sin(e);

  const ix1 = cx + innerR * Math.cos(e);
  const iy1 = cy + innerR * Math.sin(e);
  const ix2 = cx + innerR * Math.cos(s);
  const iy2 = cy + innerR * Math.sin(s);

  return `path('M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z')`;
}

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
  const center = containerSize / 2;

  // Ring sizing
  const rascalSize = Math.min(containerSize * 0.42, 220);
  const innerR = rascalSize / 2 + (isMobile ? 8 : 10);
  const outerR = containerSize / 2 - 2;

  const gap = 3; // degrees between petals
  const totalMoods = 7;
  const sliceAngle = 360 / totalMoods;

  const currentMood = selectedMoods[0];
  const videoSrc = useMemo(
    () => rascalVideos[currentMood] || "/videos/rascal-idle.mp4",
    [currentMood]
  );

  const moodKeys = useMemo(
    () => Object.keys(recipes).filter((k) => k !== "default"),
    [recipes]
  );

  return (
    <div
      className="relative mx-auto"
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Petal buttons */}
      {moodKeys.map((moodKey, i) => {
        const startDeg = sliceAngle * i - 90 + gap / 2;
        const endDeg = sliceAngle * (i + 1) - 90 - gap / 2;
        const midDeg = (startDeg + endDeg) / 2;
        const midRad = (midDeg * Math.PI) / 180;

        const isSelected = selectedMoods.includes(moodKey);
        const colors = moodColorStyles[moodKey] || moodColorStyles.happy;

        // Label position: center of the arc band
        const labelR = (innerR + outerR) / 2;
        const labelX = center + labelR * Math.cos(midRad);
        const labelY = center + labelR * Math.sin(midRad);

        const clipPath = makeArcClipPath(containerSize, innerR, outerR, startDeg, endDeg);

        return (
          <motion.div
            key={moodKey}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${moodKey.replace("-", " ")} mood`}
            tabIndex={0}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: isSelected ? 1.04 : 1,
            }}
            whileTap={{ scale: 0.96 }}
            transition={{ delay: i * 0.05 + 0.3, duration: 0.3 }}
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
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: containerSize,
              height: containerSize,
              clipPath,
              WebkitClipPath: clipPath,
              background: isSelected ? colors.activeBg : colors.bg,
              boxShadow: isSelected
                ? `0 0 0 2.5px ${colors.activeBorder}`
                : `0 0 0 1.5px ${colors.border}`,
              cursor: "pointer",
              zIndex: 10,
              transformOrigin: `${labelX}px ${labelY}px`,
            }}
          >
            {/* Emoji + label — regular HTML, always upright */}
            <div
              style={{
                position: "absolute",
                left: labelX - 36,
                top: labelY - (isMobile ? 20 : 24),
                width: 72,
                height: isMobile ? 40 : 48,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: isMobile ? "1.3rem" : "1.6rem", lineHeight: 1 }}>
                {moodEmojis[moodKey] || "🍽️"}
              </span>
              <span
                style={{
                  fontSize: isMobile ? "0.6rem" : "0.7rem",
                  fontWeight: 600,
                  color: isSelected ? "#1f2937" : "#6b7280",
                  textTransform: "capitalize",
                  textAlign: "center",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }}
              >
                {moodKey.replace("-", " ")}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* Rascal center */}
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
