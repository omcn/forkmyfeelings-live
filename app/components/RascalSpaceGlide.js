
// "use client";
// import { useEffect, useState, useRef } from "react";

// const RascalSpaceGlide = ({ secondsRemaining = 60, onTimeUp }) => {
//   const [rascalX, setRascalX] = useState(150);
//   const rascalXRef = useRef(150);
//   const [obstacles, setObstacles] = useState([]);
//   const [timeLeft, setTimeLeft] = useState(secondsRemaining);
//   const [gameOver, setGameOver] = useState(false);
//   const rascalY = 340;

//   const gameWidth = 300;
//   const rascalWidth = 50;

//   // Spawn and fall logic
//   useEffect(() => {
//     if (gameOver) return;

//     const spawn = setInterval(() => {
//       const obj = {
//         id: Date.now(),
//         x: Math.floor(Math.random() * (gameWidth - 30)),
//         y: 0,
//         emoji: ["🥚", "🧂", "🍳", "🔪"][Math.floor(Math.random() * 4)],
//       };
//       setObstacles((prev) => [...prev, obj]);
//     }, 800);

//     const fall = setInterval(() => {
//       setObstacles((prev) => {
//         const updated = prev
//           .map((o) => ({ ...o, y: o.y + 5 }))
//           .filter((o) => o.y < 400);

//         for (const obj of updated) {
//           const rascalHitbox = {
//             x: rascalXRef.current + 8,
//             y: rascalY + 10,
//             width: 34,
//             height: 30,
//           };

//           const obstacleHitbox = {
//             x: obj.x + 4,
//             y: obj.y + 4,
//             width: 22,
//             height: 22,
//           };

//           const hit =
//             rascalHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
//             rascalHitbox.x + rascalHitbox.width > obstacleHitbox.x &&
//             rascalHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
//             rascalHitbox.y + rascalHitbox.height > obstacleHitbox.y;

//           if (hit) {
//             setGameOver(true);
//             return [];
//           }
//         }

//         return updated;
//       });
//     }, 50);

//     return () => {
//       clearInterval(spawn);
//       clearInterval(fall);
//     };
//   }, [gameOver]);

//   // Countdown
//   useEffect(() => {
//     if (gameOver) return;

//     const countdown = setInterval(() => {
//       setTimeLeft((t) => {
//         if (t <= 1) {
//           clearInterval(countdown);
//           onTimeUp?.();
//           return 0;
//         }
//         return t - 1;
//       });
//     }, 1000);

//     return () => clearInterval(countdown);
//   }, [gameOver]);

//   // Movement: keyboard + tilt
//   useEffect(() => {
//     let velocity = 0;
//     let animationFrameId;
//     let currentX = rascalXRef.current;

//     const handleKeyDown = (e) => {
//       if (e.key === "ArrowLeft") velocity = -4;
//       if (e.key === "ArrowRight") velocity = 4;
//     };

//     const handleKeyUp = () => {
//       velocity = 0;
//     };

//     const handleTilt = (event) => {
//       const gamma = event.gamma;
//       if (gamma < -5) velocity = -4;
//       else if (gamma > 5) velocity = 4;
//       else velocity = 0;
//     };

//     const animate = () => {
//       currentX = Math.max(0, Math.min(gameWidth - rascalWidth, currentX + velocity));
//       rascalXRef.current = currentX;
//       setRascalX(currentX);
//       animationFrameId = requestAnimationFrame(animate);
//     };

//     if (!gameOver) {
//       window.addEventListener("keydown", handleKeyDown);
//       window.addEventListener("keyup", handleKeyUp);
//       window.addEventListener("deviceorientation", handleTilt);
//       animationFrameId = requestAnimationFrame(animate);
//     }

//     return () => {
//       window.removeEventListener("keydown", handleKeyDown);
//       window.removeEventListener("keyup", handleKeyUp);
//       window.removeEventListener("deviceorientation", handleTilt);
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, [gameOver]);

//   // Game Over Screen
//   if (gameOver) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[400px]">
//         <h2 className="text-3xl font-bold text-red-600 mb-4">💥 Game Over!</h2>
//         <button
//           onClick={() => {
//             setGameOver(false);
//             setObstacles([]);
//             setTimeLeft(secondsRemaining);
//             rascalXRef.current = 150;
//             setRascalX(150);
//           }}
//           className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-full shadow-md"
//         >
//           🔁 Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col items-center gap-4">
//       <div className="text-xl font-semibold text-gray-700">⏱️ {timeLeft}s</div>
//       <div
//         className="relative border-2 border-pink-300 rounded-lg bg-gradient-to-b from-white to-pink-100 overflow-hidden"
//         style={{ width: gameWidth, height: 400 }}
//       >
//         {obstacles.map((obj) => (
//           <div
//             key={obj.id}
//             className="absolute text-xl"
//             style={{ left: obj.x, top: obj.y }}
//           >
//             {obj.emoji}
//           </div>
//         ))}
//         <div
//           className="absolute text-3xl"
//           style={{ bottom: 10, left: rascalX }}
//         >
//           🛸
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RascalSpaceGlide;
"use client";
import { useEffect, useState, useRef } from "react";

const RascalSpaceGlide = ({ secondsRemaining = 60, onTimeUp }) => {
  const [rascalX, setRascalX] = useState(150);
  const rascalXRef = useRef(150);
  const [obstacles, setObstacles] = useState([]);
  const [timeLeft, setTimeLeft] = useState(secondsRemaining);
  const [gameOver, setGameOver] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const rascalY = 340;

  const gameWidth = 300;
  const rascalWidth = 50;

  // Enable Tilt (iOS permission)
  const enableTiltControls = async () => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === "granted") {
          setTiltEnabled(true);
        } else {
          alert("Permission denied. You can still use arrow keys!");
        }
      } catch (err) {
        console.error("Tilt permission error:", err);
      }
    } else {
      // Not iOS
      setTiltEnabled(true);
    }
  };

  // Spawn & Fall Logic
  useEffect(() => {
    if (gameOver) return;

    const spawn = setInterval(() => {
      const obj = {
        id: Date.now(),
        x: Math.floor(Math.random() * (gameWidth - 30)),
        y: 0,
        emoji: ["🥚", "🧂", "🍳", "🔪"][Math.floor(Math.random() * 4)],
      };
      setObstacles((prev) => [...prev, obj]);
    }, 800);

    const fall = setInterval(() => {
      setObstacles((prev) => {
        const updated = prev
          .map((o) => ({ ...o, y: o.y + 5 }))
          .filter((o) => o.y < 400);

        for (const obj of updated) {
          const rascalHitbox = {
            x: rascalXRef.current + 8,
            y: rascalY + 10,
            width: 34,
            height: 30,
          };

          const obstacleHitbox = {
            x: obj.x + 4,
            y: obj.y + 4,
            width: 22,
            height: 22,
          };

          const hit =
            rascalHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
            rascalHitbox.x + rascalHitbox.width > obstacleHitbox.x &&
            rascalHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
            rascalHitbox.y + rascalHitbox.height > obstacleHitbox.y;

          if (hit) {
            setGameOver(true);
            return [];
          }
        }

        return updated;
      });
    }, 50);

    return () => {
      clearInterval(spawn);
      clearInterval(fall);
    };
  }, [gameOver]);

  // Countdown
  useEffect(() => {
    if (gameOver) return;

    const countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(countdown);
          onTimeUp?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [gameOver]);

  // Movement: Keys + Tilt
  useEffect(() => {
    let velocity = 0;
    let animationFrameId;
    let currentX = rascalXRef.current;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") velocity = -4;
      if (e.key === "ArrowRight") velocity = 4;
    };

    const handleKeyUp = () => {
      velocity = 0;
    };

    const handleTilt = (event) => {
      const gamma = event.gamma;
      if (gamma < -5) velocity = -4;
      else if (gamma > 5) velocity = 4;
      else velocity = 0;
    };

    const animate = () => {
      currentX = Math.max(0, Math.min(gameWidth - rascalWidth, currentX + velocity));
      rascalXRef.current = currentX;
      setRascalX(currentX);
      animationFrameId = requestAnimationFrame(animate);
    };

    if (!gameOver) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      if (tiltEnabled) {
        window.addEventListener("deviceorientation", handleTilt);
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (tiltEnabled) {
        window.removeEventListener("deviceorientation", handleTilt);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameOver, tiltEnabled]);

  // Game Over UI
  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-3xl font-bold text-red-600 mb-4">💥 Game Over!</h2>
        <button
          onClick={() => {
            setGameOver(false);
            setObstacles([]);
            setTimeLeft(secondsRemaining);
            rascalXRef.current = 150;
            setRascalX(150);
          }}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-full shadow-md"
        >
          🔁 Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {!tiltEnabled && (
        <button
          onClick={enableTiltControls}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-full shadow-md"
        >
          📱 Enable Tilt Controls
        </button>
      )}

      <div className="text-xl font-semibold text-gray-700">⏱️ {timeLeft}s</div>

      <div
        className="relative border-2 border-pink-300 rounded-lg bg-gradient-to-b from-white to-pink-100 overflow-hidden"
        style={{ width: gameWidth, height: 400 }}
      >
        {obstacles.map((obj) => (
          <div
            key={obj.id}
            className="absolute text-xl"
            style={{ left: obj.x, top: obj.y }}
          >
            {obj.emoji}
          </div>
        ))}
        <div
          className="absolute text-3xl"
          style={{ bottom: 10, left: rascalX }}
        >
          🛸
        </div>
      </div>
    </div>
  );
};

export default RascalSpaceGlide;
