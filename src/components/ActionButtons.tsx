import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, LogIn, Sparkles, AlertCircle } from "lucide-react";

export function ActionButtons() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleClick = (actionName: string) => {
    setToastMessage(`✨ "${actionName}" estará disponível em breve no lobby!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto px-4 z-10 flex flex-col gap-4 my-auto py-4">
      {/* Botão CRIAR SALA */}
      <Link href="/criar-sala" className="w-full block focus:outline-none">
        <motion.div
          id="btn-criar-sala"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full relative group overflow-hidden rounded-2xl py-4 sm:py-5 px-6 font-[family-name:var(--font-fredoka)] text-lg sm:text-xl font-bold tracking-wider text-slate-950 uppercase btn-3d-green flex items-center justify-between cursor-pointer active:outline-none"
        >
          {/* Glowing sweep effect on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950/15 flex items-center justify-center border border-slate-950/10">
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            </div>
            <span className="drop-shadow-sm">CRIAR SALA</span>
          </div>

          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 opacity-70 group-hover:rotate-45 transition-transform duration-300" />
        </motion.div>
      </Link>

      {/* Botão ENTRAR EM SALA */}
      <Link href="/entrar-sala" className="w-full block focus:outline-none">
        <motion.div
          id="btn-entrar-sala"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full relative group overflow-hidden rounded-2xl py-4 sm:py-5 px-6 font-[family-name:var(--font-fredoka)] text-lg sm:text-xl font-bold tracking-wider text-white uppercase btn-3d-pink flex items-center justify-between cursor-pointer active:outline-none"
        >
          {/* Glowing sweep effect on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
              <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="drop-shadow-sm">ENTRAR EM SALA</span>
          </div>

          <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping opacity-80" />
        </motion.div>
      </Link>

      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="self-center px-4 py-2.5 rounded-xl bg-purple-950/90 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-md text-xs font-semibold text-purple-200 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-lime-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
