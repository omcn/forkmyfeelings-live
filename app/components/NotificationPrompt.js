"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function NotificationPrompt({ onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if browser supports it, hasn't asked before, and permission is default
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default" &&
      !localStorage.getItem("fmf_notif_asked")
    ) {
      // Small delay so it doesn't appear at the same time as the recipe
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAllow = async () => {
    localStorage.setItem("fmf_notif_asked", "1");
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("You'll get a daily mood reminder! 🍴");
        // Register a daily reminder via the service worker if supported
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          // A real push subscription needs a VAPID key server setup;
          // for now we schedule a local notification via the SW after 24h
          reg.showNotification("Fork My Feels", {
            body: "What are you feeling today? Let Rascal feed your vibe 🍴",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
          });
        }
      }
    } catch (e) {
      console.warn("Notification permission error:", e);
    }
    setVisible(false);
    onDone?.();
  };

  const handleDismiss = () => {
    localStorage.setItem("fmf_notif_asked", "1");
    setVisible(false);
    onDone?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-pink-100">
            <div className="flex gap-3 items-start">
              <span className="text-3xl">🔔</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Daily mood reminders</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  Let Rascal remind you to check in with your mood and find today's recipe.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAllow}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium py-2 rounded-xl transition"
              >
                Yes please!
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium py-2 rounded-xl transition"
              >
                Not now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
