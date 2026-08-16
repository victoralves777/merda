"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle, Sparkles, MessageSquare, Award, Flame } from "lucide-react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
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

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm sm:max-w-md bg-[#120726] border-2 border-purple-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(168,85,247,0.35)] overflow-hidden"
          >
            {/* Background Glow inside modal */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-lime-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold font-[family-name:var(--font-fredoka)] text-white tracking-wide">
                  COMO JOGAR?
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

            {/* Rules Steps */}
            <div className="flex flex-col gap-3.5 my-5 text-left">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Crie ou Entre na Sala</h3>
                  <p className="text-xs text-purple-200/80 leading-relaxed mt-0.5">
                    Junte sua galera através do código ou link da sala para começar a loucura.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Responda Sem Filtro</h3>
                  <p className="text-xs text-purple-200/80 leading-relaxed mt-0.5">
                    Perguntas insanas vão surgir na tela. Seja criativo, sem vergonha e responda a pior merda possível.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Vote e Ganhe Pontos</h3>
                  <p className="text-xs text-purple-200/80 leading-relaxed mt-0.5">
                    Todos votam nas respostas mais engraçadas. Quem acumular mais votos leva a rodada e o pódio final!
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  4
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Economia de Moedas</h3>
                  <p className="text-xs text-purple-200/80 leading-relaxed mt-0.5">
                    O mais votado da rodada <strong className="text-yellow-300 font-bold">ganha +1 moeda 🪙</strong> e todo o restante <strong className="text-rose-400 font-bold">perde 2 moedas 💸</strong>!
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-[family-name:var(--font-fredoka)] font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              ENTENDI TUDO 💩
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
