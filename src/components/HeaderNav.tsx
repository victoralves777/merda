"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Plus, User, LogIn, Sparkles, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function HeaderNav() {
  const pathname = usePathname();
  const { profile, isAuthenticated, coinsBalance, setIsShopOpen, toastMessage } = useAuth();

  // Não exibe o header nav dentro da partida ativa para manter imersão total
  if (pathname === "/jogo") return null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#07020d]/85 backdrop-blur-md border-b border-purple-500/20 px-4 py-2.5 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* LOGO / HOME LINK */}
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            aria-label="Ir para página inicial"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              💩
            </div>
            <span className="font-[family-name:var(--font-fredoka)] font-black text-xs sm:text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-lime-300">
              MERDA SE FUDEU
            </span>
          </Link>

          {/* ÁREA DIREITA: CARTEIRA DE MOEDAS + PERFIL/LOGIN */}
          <div className="flex items-center gap-2">
            {/* BADGE DE SALDO DE MOEDAS */}
            <motion.button
              type="button"
              id="btn-abrir-loja-moedas-header"
              onClick={() => setIsShopOpen(true)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-purple-950/80 to-amber-950/70 border border-amber-400/40 hover:border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer group"
              title="Abrir Loja de Moedas (MerdaCoins)"
            >
              <Coins className="w-3.5 h-3.5 text-yellow-400 group-hover:rotate-12 transition-transform" />
              <span className="font-mono font-black text-xs text-yellow-300">
                {coinsBalance}
              </span>
              <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-sm ml-0.5">
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </motion.button>

            {/* BOTÃO DE PERFIL OU LOGIN */}
            {isAuthenticated && profile ? (
              <Link
                href="/perfil"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/30 hover:border-lime-400/50 text-purple-200 hover:text-white transition-all cursor-pointer group shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                title="Meu Perfil"
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-5 h-5 rounded-full object-cover border border-purple-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white">
                    {(profile.display_name || profile.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-xs max-w-[80px] truncate hidden xs:inline">
                  {profile.display_name || profile.username}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-pink-950/70 hover:bg-pink-900/80 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(236,72,153,0.25)]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* TOAST GLOBAL DE NOTIFICAÇÃO */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#1e0738] border-2 border-lime-400/80 shadow-[0_0_30px_rgba(57,255,20,0.5)] backdrop-blur-md text-xs font-bold text-white flex items-center gap-2 whitespace-nowrap"
          >
            <Flame className="w-4 h-4 text-lime-400 shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
