"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, KeyRound, User, Sparkles, AlertCircle, ArrowRight, Coins, PlusCircle } from "lucide-react";
import { SurrealDecorations } from "@/components/SurrealDecorations";
import { joinSupabaseRoom } from "@/lib/supabaseGame";
import { useAuth } from "@/contexts/AuthContext";

export default function EntrarSalaPage() {
  const router = useRouter();
  const { profile, coinsBalance, setIsShopOpen } = useAuth();

  // Estados dos campos
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState(profile?.display_name || profile?.username || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInsufficientCoins, setIsInsufficientCoins] = useState(false);

  // Formata o código para aceitar apenas letras e números em maiúsculas (máx. 5 caracteres)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleanValue = rawValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);
    setRoomCode(cleanValue);
    if (errorMessage) {
      setErrorMessage(null);
      setIsInsufficientCoins(false);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    if (errorMessage) {
      setErrorMessage(null);
      setIsInsufficientCoins(false);
    }
  };

  // Botão só fica habilitado quando o código tiver 5 caracteres e apelido preenchido
  const isFormValid = roomCode.trim().length === 5 && nickname.trim().length > 0;

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim() || roomCode.trim().length !== 5) {
      setErrorMessage("Digite um código de sala válido com 5 caracteres! 🔢");
      setIsInsufficientCoins(false);
      return;
    }

    if (!nickname.trim()) {
      setErrorMessage("Digite seu apelido para entrar na bagunça! 💩");
      setIsInsufficientCoins(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setIsInsufficientCoins(false);

    const cleanCode = roomCode.trim().toUpperCase();
    const cleanNickname = nickname.trim();

    // Valida e registra o jogador real no Supabase (verificando caução de 5 moedas por rodada)
    const result = await joinSupabaseRoom(cleanCode, cleanNickname, coinsBalance);

    if (!result.success) {
      setIsSubmitting(false);
      setErrorMessage(result.error || "Essa sala caiu no buraco 🕳️");
      if (result.error?.includes("Saldo insuficiente")) {
        setIsInsufficientCoins(true);
      }
      return;
    }

    // Redireciona para /lobby
    router.push("/lobby");
  };

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col bg-surreal-grid overflow-x-hidden text-slate-100">
      {/* Camada de Decorações Sutis */}
      <SurrealDecorations />

      {/* Container Principal Mobile-First */}
      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-4 pt-4 pb-28 sm:pb-32">
        {/* TOPO: Botão Voltar + Título + Subtítulo */}
        <header className="w-full mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 cursor-pointer"
              aria-label="Voltar para a página inicial"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Saldo de Moedas */}
            <button
              type="button"
              onClick={() => setIsShopOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-amber-400/40 text-yellow-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>{coinsBalance} Moedas</span>
              <PlusCircle className="w-3.5 h-3.5 text-lime-400 ml-0.5" />
            </button>
          </div>

          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-fredoka)] flex items-center gap-2">
              <span>ENTRAR NA BAGUNÇA</span>
              <span className="text-2xl">💩</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/80 font-medium mt-0.5">
              “Tem um código? Então já era.”
            </p>
          </div>
        </header>

        {/* FORMULÁRIO DE ENTRADA */}
        <form onSubmit={handleJoinRoom} className="flex flex-col gap-5 my-auto">
          {/* MENSAGEM DE ERRO COM BOTÃO DE RECARGA */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="p-4 rounded-2xl bg-gradient-to-b from-[#2a0b22] to-[#1a0520] border-2 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-300 font-[family-name:var(--font-fredoka)] tracking-wide">
                    <AlertCircle className="w-4.5 h-4.5 text-yellow-400 shrink-0" />
                    <span>CAUÇÃO DE SEGURANÇA (NÃO GASTA NA ENTRADA)</span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-purple-200 font-medium">
                    {errorMessage}
                  </p>

                  <div className="p-2.5 rounded-xl bg-purple-950/80 border border-lime-400/30 text-[11px] text-lime-300 font-medium flex items-center gap-1.5">
                    <span>💡</span>
                    <span>
                      Suas moedas <strong>permanecem na sua conta</strong>! O mais votado ganha +1 moeda e os demais perdem -2 moedas por rodada.
                    </span>
                  </div>
                </div>

                {isInsufficientCoins && (
                  <button
                    type="button"
                    onClick={() => setIsShopOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-[family-name:var(--font-fredoka)] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.5)] active:scale-95 cursor-pointer transition-all"
                  >
                    <Coins className="w-4.5 h-4.5" />
                    <span>RECARREGAR MOEDAS VIA PIX ⚡</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CAMPO 1: Código da Sala (5 Caracteres Grandes) */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="input-room-code"
              className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-pink-400" />
                Código da Sala
              </span>
              <span className="text-[11px] text-purple-400 font-mono">
                {roomCode.length}/5
              </span>
            </label>

            <div className="relative">
              <input
                id="input-room-code"
                type="text"
                maxLength={5}
                value={roomCode}
                onChange={handleCodeChange}
                placeholder="Ex: FDP69"
                autoComplete="off"
                spellCheck="false"
                className="w-full py-4 px-4 rounded-2xl bg-[#14082c]/95 border-2 border-purple-500/40 text-center font-mono font-black text-2xl sm:text-3xl text-pink-400 tracking-[0.25em] uppercase placeholder-purple-400/30 focus:outline-none focus:border-pink-500 focus:shadow-[0_0_25px_rgba(236,72,153,0.35)] transition-all shadow-inner"
              />
            </div>
          </div>

          {/* CAMPO 2: Apelido do Jogador */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="input-player-nickname"
              className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-lime-400" />
                Seu Apelido
              </span>
              <span className="text-[11px] text-purple-400 font-normal">
                {nickname.length}/15
              </span>
            </label>

            <div className="relative">
              <input
                id="input-player-nickname"
                type="text"
                maxLength={15}
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="Ex: PatoLoko"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#14082c]/95 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-base font-semibold focus:outline-none focus:border-lime-400 focus:shadow-[0_0_20px_rgba(57,255,20,0.35)] transition-all shadow-inner"
              />
            </div>
          </div>
        </form>

        {/* BOTÃO FIXO PRÓXIMO AO RODAPÉ (Safe-Area Mobile) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-[#07020d] via-[#07020d]/95 to-transparent backdrop-blur-md">
          <div className="w-full max-w-md mx-auto">
            <motion.button
              type="button"
              id="btn-entrar-sala-action"
              onClick={handleJoinRoom}
              disabled={!isFormValid || isSubmitting}
              whileTap={isFormValid && !isSubmitting ? { scale: 0.97 } : {}}
              whileHover={isFormValid && !isSubmitting ? { scale: 1.01 } : {}}
              className={`w-full relative group overflow-hidden rounded-2xl py-4 sm:py-4.5 px-6 font-[family-name:var(--font-fredoka)] text-lg sm:text-xl font-bold tracking-wider text-slate-950 uppercase flex items-center justify-center gap-2 transition-all duration-200 ${
                isFormValid && !isSubmitting
                  ? "btn-3d-pink text-white shadow-[0_10px_25px_rgba(236,72,153,0.45)] cursor-pointer"
                  : "bg-purple-950/40 border-2 border-purple-800/30 text-purple-400/50 cursor-not-allowed opacity-60"
              }`}
            >
              {isFormValid && !isSubmitting && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
              )}

              <span>{isSubmitting ? "ENTRANDO..." : "ENTRAR NA SALA"}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  );
}
