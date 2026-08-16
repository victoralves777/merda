"use client";

import { motion } from "framer-motion";

export function SurrealDecorations() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
      {/* Background radial spotlights */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[110px] animate-pulse-glow" />
      <div className="absolute bottom-[10%] left-[-15%] w-[320px] h-[320px] bg-pink-600/15 rounded-full blur-[100px]" />
      <div className="absolute top-[40%] right-[-15%] w-[320px] h-[320px] bg-emerald-500/15 rounded-full blur-[100px]" />

      {/* Central Hypnotic Spiral Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] animate-spin-slow">
        <svg width="600" height="600" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" stroke="#b026ff" strokeWidth="1.5" strokeDasharray="6 8" />
          <circle cx="100" cy="100" r="70" stroke="#39ff14" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="100" cy="100" r="50" stroke="#ff007f" strokeWidth="1.5" strokeDasharray="8 6" />
          <circle cx="100" cy="100" r="30" stroke="#ffee00" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M100 10 Q140 100 100 190 Q60 100 100 10" stroke="#ffffff" strokeWidth="1" />
          <path d="M10 100 Q100 140 190 100 Q100 60 10 100" stroke="#ffffff" strokeWidth="1" />
        </svg>
      </div>

      {/* Floating Surreal Playing Card 1 (Top Left) */}
      <motion.div
        aria-hidden="true"
        className="absolute top-6 left-3 sm:left-10 w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br from-[#1b0a36] to-[#0c0418] border-2 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.25)] flex flex-col justify-between p-2 transform -rotate-12 backdrop-blur-sm"
        animate={{
          y: [0, -14, 0],
          rotate: [-12, -7, -12],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="flex justify-between items-center text-[11px] font-black text-emerald-400">
          <span>A</span>
          <span className="text-[10px]">♠</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto">
          <span className="text-xl">👑</span>
          <span className="text-[9px] font-bold text-fuchsia-400 tracking-tighter">CHAOS</span>
        </div>
        <div className="flex justify-between items-center text-[11px] font-black text-emerald-400 rotate-180">
          <span>A</span>
          <span className="text-[10px]">♠</span>
        </div>
      </motion.div>

      {/* Floating Surreal Playing Card 2 (Bottom Right) */}
      <motion.div
        aria-hidden="true"
        className="absolute bottom-24 right-3 sm:right-10 w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br from-[#280826] to-[#100318] border-2 border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.25)] flex flex-col justify-between p-2 transform rotate-12 backdrop-blur-sm"
        animate={{
          y: [0, 15, 0],
          rotate: [12, 18, 12],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <div className="flex justify-between items-center text-[11px] font-black text-pink-400">
          <span>J</span>
          <span className="text-[10px]">♥</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto">
          <span className="text-xl">🃏</span>
          <span className="text-[8px] font-bold text-yellow-300 tracking-tighter">MERDA</span>
        </div>
        <div className="flex justify-between items-center text-[11px] font-black text-pink-400 rotate-180">
          <span>J</span>
          <span className="text-[10px]">♥</span>
        </div>
      </motion.div>

      {/* Melting / Distorted Surreal Clock (Top Right) */}
      <motion.div
        aria-hidden="true"
        className="absolute top-10 right-4 sm:right-12 w-20 h-20 sm:w-24 sm:h-24 opacity-85"
        animate={{
          y: [0, 12, 0],
          rotate: [6, -4, 6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_12px_rgba(250,204,21,0.35)]">
          {/* Distorted Melting Clock Frame */}
          <path
            d="M 50 10 C 80 8, 95 30, 90 60 C 86 85, 65 98, 48 94 C 25 90, 8 72, 10 45 C 12 18, 25 12, 50 10 Z"
            fill="#180c2e"
            stroke="#facc15"
            strokeWidth="3.5"
          />
          {/* Numbers / Surreal Marks */}
          <text x="50" y="26" textAnchor="middle" fill="#39ff14" fontSize="11" fontWeight="bold" fontFamily="monospace">∞</text>
          <text x="76" y="55" textAnchor="middle" fill="#ff007f" fontSize="10" fontWeight="bold" fontFamily="monospace">?</text>
          <text x="48" y="85" textAnchor="middle" fill="#39ff14" fontSize="10" fontWeight="bold" fontFamily="monospace">💩</text>
          <text x="24" y="52" textAnchor="middle" fill="#facc15" fontSize="10" fontWeight="bold" fontFamily="monospace">!</text>
          
          {/* Distorted Clock Hands */}
          <circle cx="50" cy="50" r="3.5" fill="#facc15" />
          <line x1="50" y1="50" x2="62" y2="35" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="50" x2="38" y2="60" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" />
          
          {/* Dripping melting drops */}
          <path d="M 48 94 Q 50 102 52 94" fill="#facc15" />
        </svg>
      </motion.div>

      {/* Psychedelic Glowing Mushroom (Bottom Left) */}
      <motion.div
        aria-hidden="true"
        className="absolute bottom-28 left-4 sm:left-12 w-16 h-16 sm:w-20 sm:h-20 opacity-90"
        animate={{
          y: [0, -10, 0],
          rotate: [-5, 8, -5],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_14px_rgba(57,255,20,0.4)]">
          {/* Mushroom Stem */}
          <path
            d="M 42 55 Q 38 85 40 92 C 45 95, 55 95, 60 92 Q 62 85 58 55 Z"
            fill="#ede9fe"
            stroke="#a855f7"
            strokeWidth="2"
          />
          {/* Mushroom Cap */}
          <path
            d="M 15 55 C 10 25, 90 25, 85 55 C 75 60, 25 60, 15 55 Z"
            fill="url(#mush-grad)"
            stroke="#22c55e"
            strokeWidth="2.5"
          />
          {/* Glowing spots */}
          <circle cx="35" cy="40" r="5" fill="#39ff14" />
          <circle cx="55" cy="32" r="6" fill="#facc15" />
          <circle cx="70" cy="45" r="4.5" fill="#39ff14" />
          <circle cx="48" cy="48" r="3" fill="#ff007f" />

          <defs>
            <linearGradient id="mush-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7e22ce" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating Neon Dust & Mysterious Symbols */}
      <motion.div
        className="absolute top-1/3 left-8 text-yellow-300 text-sm opacity-60"
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3], rotate: [0, 45, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        ✦
      </motion.div>
      <motion.div
        className="absolute top-1/4 right-8 text-emerald-400 text-lg opacity-60"
        animate={{ y: [0, 25, 0], opacity: [0.2, 0.9, 0.2], rotate: [0, -90, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        ★
      </motion.div>
      <motion.div
        className="absolute bottom-1/3 right-10 text-fuchsia-400 text-xs opacity-60"
        animate={{ y: [0, -15, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        ✦
      </motion.div>
      <motion.div
        className="absolute top-2/3 left-6 text-purple-400 text-sm opacity-50"
        animate={{ y: [0, 18, 0], opacity: [0.2, 0.7, 0.2] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        ◆
      </motion.div>
    </div>
  );
}
