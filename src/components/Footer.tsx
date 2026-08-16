"use client";

import { HelpCircle } from "lucide-react";

interface FooterProps {
  onOpenHowToPlay: () => void;
}

export function Footer({ onOpenHowToPlay }: FooterProps) {
  return (
    <footer className="w-full max-w-sm sm:max-w-md mx-auto px-4 pb-6 pt-2 z-10 flex items-center justify-between">
      {/* Botão Como Jogar? */}
      <button
        type="button"
        id="btn-como-jogar"
        onClick={onOpenHowToPlay}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-purple-100 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.15)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
      >
        <HelpCircle className="w-3.5 h-3.5 text-lime-400" />
        <span>Como jogar?</span>
      </button>

      {/* Versão Pequena: v0.1 */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[11px] font-medium tracking-tight">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>v0.1</span>
      </div>
    </footer>
  );
}
