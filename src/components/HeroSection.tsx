"use client";

import { motion } from "framer-motion";
import { Sparkles, Flame, Orbit } from "lucide-react";

export function HeroSection() {
  return (
    <div className="flex flex-col items-center text-center z-10 w-full max-w-sm sm:max-w-md mx-auto px-4 pt-4 sm:pt-6">
      {/* Top Floating Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs font-semibold tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-md"
      >
        <Sparkles className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
        <span>Party Game Insano</span>
        <Flame className="w-3.5 h-3.5 text-pink-500" />
      </motion.div>

      {/* Hero Animated Avatar / Icon */}
      <motion.div
        className="relative my-2 sm:my-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Pulsing neon rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-lime-400 via-fuchsia-500 to-purple-600 blur-xl opacity-50 animate-pulse-glow" />
        <div className="absolute -inset-3 rounded-full border-2 border-dashed border-purple-500/30 animate-spin-slow" />

        {/* Poop Hero Container */}
        <motion.div
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-b from-[#240d45] to-[#120526] border-2 border-fuchsia-500/50 shadow-[0_0_30px_rgba(236,72,153,0.35)] flex items-center justify-center"
          animate={{
            rotate: [-2, 2, -2],
            y: [0, -6, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Poop Emoji with crazy party details */}
          <span className="text-5xl sm:text-6xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] select-none">
            💩
          </span>

          {/* Mini surreal glowing accent */}
          <span className="absolute -top-2 -right-2 text-xl filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
            👑
          </span>
          <span className="absolute -bottom-1 -left-2 text-sm">
            🍄
          </span>
        </motion.div>
      </motion.div>

      {/* Main Title: 💩 MERDA SE FUDEU! */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="w-full mt-2"
      >
        <h1 className="text-3xl sm:text-4xl xs:text-[2.6rem] font-black tracking-tight uppercase leading-none font-[family-name:var(--font-fredoka)]">
          <span className="inline-block transform hover:scale-105 transition-transform duration-200 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            💩 MERDA
          </span>{" "}
          <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_25px_rgba(236,72,153,0.5)]">
            SE FUDEU!
          </span>
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-3 px-3 py-2 rounded-2xl bg-purple-950/40 border border-purple-500/20 backdrop-blur-md shadow-inner"
      >
        <p className="text-xs sm:text-sm font-medium text-purple-200/90 leading-relaxed italic">
          “Entre na bagunça. Responda merda. Não se foda.”
        </p>
      </motion.div>
    </div>
  );
}
