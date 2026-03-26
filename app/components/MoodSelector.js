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

// Each mood gets its own color identity — using hex for SVG fills
const moodStyles = {
  tired: { fill: "#eef2ff", activeFill: "#c7d2fe", stroke: "#a5b4fc", activeStroke: "#818cf8" },
  happy: { fill: "#fffbeb", activeFill: "#fde68a", stroke: "#fcd34d", activeStroke: "#f59e0b" },
  sad: { fill: "#f0f9ff", activeFill: "#bae6fd", stroke: "#7dd3fc", activeStroke: "#38bdf8" },
  rushed: { fill: "#fef2f2", activeFill: "#fecaca", stroke: "#fca5a5", activeStroke: "#f87171" },
  "date-night": { fill: "#fdf2f8", activeFill: "#fbcfe8", stroke: "#f9a8d4", activeStroke: "#f472b6" },
  chill: { fill: "#ecfeff", activeFill: "#a5f3fc", stroke: "#67e8f9", activeStroke: "#22d3ee" },
  overwhelmed: { fill: "#fff7ed", activeFill: "#fed7aa", stroke: "#fdba74", activeStroke: "#fb923c" },
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

// Generate SVG arc path for a donut segment
function arcPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const cos = Math.cos;
  const sin = Math.sin;

  const s = toRad(startAngle);
  const e = toRad(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  // Outer arc: start → end (clockwise)
  const ox1 = cx + outerR * cos(s);
  const oy1 = cy + outerR * sin(s);
  const ox2 = cx + outerR * cos(e);
  const oy2 = cy + outerR * sin(e);

  // Inner arc: end → start (counter-clockwise)
  const ix1 = cx + innerR * cos(e);
  const iy1 = cy + innerR * sin(e);
  const ix2 = cx + innerR * cos(s);
  const iy2 = cy + innerR * sin(s);

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
    `Z`,
  ].join(" ");
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

  // Ring dimensions
  const rascalSize = Math.min(containerSize * 0.42, 220);
  const innerRadius = rascalSize / 2 + (isMobile ? 6 : 8); // small gap from Rascal
  const outerRadius = containerSize / 2 - 4; // nearly to container edge

  // Gap between petals in degrees
  const gap = 4;
  const totalMoods = 7;
  const sliceAngle = 360 / totalMoods;

  const currentMood = selectedMoods[0];
  const videoSrc = useMemo(() => rascalVideos[currentMood] || "/videos/rascal-idle.mp4", [currentMood]);

  const moodKeys = useMemo(
    () => Object.keys(recipes).filter((k) => k !== "default"),
    [recipes]
  );

  return (
    <div
      className="relative mx-auto"
      style={{ width: containerSize, height: containerSize }}
    >
      {/* SVG petal ring */}
      <svg
        width={containerSize}
        height={containerSize}
        viewBox={`0 0 ${containerSize} ${containerSize}`}
        className="absolute inset-0"
        style={{ zIndex: 10 }}
      >
        <defs>
          {/* Define clip paths and filters */}
          <filter id="petal-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
          <filter id="petal-shadow-active" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
          </filter>
        </defs>

        <motion.g
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
          }}
        >
          {moodKeys.map((moodKey, i) => {
            const startAngle = sliceAngle * i - 90 + gap / 2;
            const endAngle = sliceAngle * (i + 1) - 90 - gap / 2;
            const midAngle = (startAngle + endAngle) / 2;
            const midRad = (midAngle * Math.PI) / 180;

            const isSelected = selectedMoods.includes(moodKey);
            const style = moodStyles[moodKey] || moodStyles.happy;

            // Position label at middle of the arc segment
            const labelRadius = (innerRadius + outerRadius) / 2;
            const labelX = center + labelRadius * Math.cos(midRad);
            const labelY = center + labelRadius * Math.sin(midRad);

            const path = arcPath(center, center, innerRadius, outerRadius, startAngle, endAngle);

            return (
              <motion.g
                key={moodKey}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${moodKey.replace("-", " ")} mood`}
                tabIndex={0}
                style={{ cursor: "pointer", outline: "none", transformOrigin: `${labelX}px ${labelY}px` }}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1 },
                }}
                whileTap={{ scale: 0.95 }}
                animate={isSelected ? { scale: 1.06 } : { scale: 1 }}
                onClick={() => {
                  clickSound?.play();
                  haptic?.("light");
                  const next = selectedMoods[0] === moodKey ? [] : [moodKey];
                  onMoodChange(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.currentTarget.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                  }
                }}
                filter={isSelected ? "url(#petal-shadow-active)" : "url(#petal-shadow)"}
              >
                {/* Arc segment shape */}
                <path
                  d={path}
                  fill={isSelected ? style.activeFill : style.fill}
                  stroke={isSelected ? style.activeStroke : style.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Emoji + Label using foreignObject so they stay upright */}
                <foreignObject
                  x={labelX - 40}
                  y={labelY - (isMobile ? 22 : 26)}
                  width={80}
                  height={isMobile ? 44 : 52}
                  style={{ pointerEvents: "none", overflow: "visible" }}
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                      gap: "1px",
                    }}
                  >
                    <span style={{ fontSize: isMobile ? "1.4rem" : "1.7rem", lineHeight: 1 }}>
                      {moodEmojis[moodKey] || "🍽️"}
                    </span>
                    <span
                      style={{
                        fontSize: isMobile ? "0.55rem" : "0.7rem",
                        fontWeight: 600,
                        color: isSelected ? "#1f2937" : "#6b7280",
                        textTransform: "capitalize",
                        textAlign: "center",
                        lineHeight: 1.1,
                      }}
                    >
                      {moodKey.replace("-", " ")}
                    </span>
                  </div>
                </foreignObject>
              </motion.g>
            );
          })}
        </motion.g>
      </svg>

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
