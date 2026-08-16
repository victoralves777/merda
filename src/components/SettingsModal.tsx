"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders, Flame, Timer, Users, KeyRound } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    code: string;
    hostNickname: string;
    rounds: number;
    timeLimit: string;
    maxPlayers: number;
  };
}

export function SettingsModal({ isOpen, onClose, config }: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm sm:max-w-md bg-[#120726] border-2 border-purple-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(168,85,247,0.35)] overflow-hidden text-slate-100"
          >
            {/* Ambient glow inside */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-lime-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-lime-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold font-[family-name:var(--font-fredoka)] text-white tracking-wide">
                  CONFIGURAÇÕES DA SALA
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full bg-purple-900/40 hover:bg-purple-900/80 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Config details list */}
            <div className="flex flex-col gap-3 my-5">
              {/* Código */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
                <span className="text-xs text-purple-300 flex items-center gap-2 font-semibold">
                  <KeyRound className="w-4 h-4 text-yellow-400" />
                  Código da Sala
                </span>
                <span className="font-mono font-bold text-lime-400 tracking-wider">
                  {config.code}
                </span>
              </div>

              {/* Rodadas */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
                <span className="text-xs text-purple-300 flex items-center gap-2 font-semibold">
                  <Flame className="w-4 h-4 text-pink-400" />
                  Total de Rodadas
                </span>
                <span className="font-bold text-white">
                  {config.rounds} rodadas
                </span>
              </div>

              {/* Tempo */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
                <span className="text-xs text-purple-300 flex items-center gap-2 font-semibold">
                  <Timer className="w-4 h-4 text-lime-400" />
                  Tempo por Resposta
                </span>
                <span className="font-bold text-white">
                  {config.timeLimit}
                </span>
              </div>

              {/* Capacidade */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
                <span className="text-xs text-purple-300 flex items-center gap-2 font-semibold">
                  <Users className="w-4 h-4 text-purple-400" />
                  Limite de Jogadores
                </span>
                <span className="font-bold text-white">
                  Até {config.maxPlayers} jogadores
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-[family-name:var(--font-fredoka)] font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              FECHAR
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
