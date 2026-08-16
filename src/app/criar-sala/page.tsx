"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Sparkles, Timer, Users, Flame, AlertCircle, Coins, PlusCircle } from "lucide-react";
import { SurrealDecorations } from "@/components/SurrealDecorations";
import { createSupabaseRoom } from "@/lib/supabaseGame";
import { useAuth } from "@/contexts/AuthContext";

export default function CriarSalaPage() {
  const router = useRouter();
  const { profile, coinsBalance, setIsShopOpen } = useAuth();

  // Estados dos campos
  const [nickname, setNickname] = useState(profile?.display_name || profile?.username || "");
  const [rounds, setRounds] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<string>("45s");
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opções solicitadas
  const roundOptions = [5, 10, 15];
  const timeOptions = ["30s", "45s", "60s"];
  const playerOptions = [4, 6, 8, 10];

  const requiredCoins = rounds * 5;
  const isBalanceSufficient = coinsBalance >= requiredCoins;

  // Gerador de código aleatório de 5 caracteres (Ex: FDP69, ALC99, ESDTP)
  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setErrorMessage("Digite seu apelido para ser o dono da bagunça! 💩");
      return;
    }

    if (!isBalanceSufficient) {
      setErrorMessage(
        `Saldo insuficiente! Para ${rounds} rodadas, você precisa de no mínimo ${requiredCoins} moedas (5 por rodada). Seu saldo é ${coinsBalance} moedas.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const roomCode = generateRoomCode();

    // Cria a sala e o ADM no Supabase com validação de caução
    const result = await createSupabaseRoom(
      roomCode,
      nickname.trim(),
      rounds,
      timeLimit,
      maxPlayers,
      coinsBalance
    );

    if (!result.success) {
      setIsSubmitting(false);
      setErrorMessage(result.error || "Erro ao criar sala. Tente novamente.");
      return;
    }

    // Redirecionamento suave para /lobby
    router.push("/lobby");
  };

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col bg-surreal-grid overflow-x-hidden text-slate-100">
      {/* Camada de Decorações Sutis */}
      <SurrealDecorations />

      {/* Container Principal Mobile-First */}
      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-4 pt-4 pb-28 sm:pb-32">
        {/* TOPO: Botão Voltar + Título + Subtítulo */}
        <header className="w-full mb-4">
          <div className="flex items-center justify-between mb-3">
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
              <span>CRIAR SALA</span>
              <span className="text-xl">🎪</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/80 font-medium mt-0.5">
              “Monte sua bagunça com caução de 5 moedas por rodada.”
            </p>
          </div>
        </header>

        {/* FORMULÁRIO DE CAMPOS */}
        <form onSubmit={handleCreateRoom} className="flex flex-col gap-4 my-auto">
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
                    <span>CAUÇÃO DE SEGURANÇA (NÃO GASTA NA CRIAÇÃO)</span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-purple-200 font-medium">
                    {errorMessage}
                  </p>

                  <div className="p-2.5 rounded-xl bg-purple-950/80 border border-lime-400/30 text-[11px] text-lime-300 font-medium flex items-center gap-1.5">
                    <span>💡</span>
                    <span>
                      Suas moedas <strong>permanecem na sua conta</strong>! Você só perde 5 moedas se for o mais votado da rodada.
                    </span>
                  </div>
                </div>

                {!isBalanceSufficient && (
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

          {/* CAMPO 1: Apelido */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="input-nickname"
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
                id="input-nickname"
                type="text"
                maxLength={15}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ex: Alicinha69"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#14082c]/95 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-base font-semibold focus:outline-none focus:border-lime-400 focus:shadow-[0_0_20px_rgba(57,255,20,0.35)] transition-all shadow-inner"
              />
            </div>
          </div>

          {/* CAMPO 2: Quantidade de rodadas (5, 10, 15) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                Quantidade de rodadas
              </label>
              <span className="text-[11px] font-mono font-bold text-amber-300">
                Caução: {requiredCoins} moedas
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {roundOptions.map((opt) => {
                const isSelected = rounds === opt;
                const cost = opt * 5;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setRounds(opt);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`relative py-3 px-2 rounded-2xl font-[family-name:var(--font-fredoka)] font-bold text-base transition-all duration-200 flex flex-col items-center justify-center cursor-pointer border-2 ${
                      isSelected
                        ? "bg-gradient-to-b from-purple-700 to-purple-900 border-lime-400 text-white shadow-[0_0_20px_rgba(57,255,20,0.35)] scale-[1.02]"
                        : "bg-[#13082a]/70 hover:bg-[#1b0a3d] border-purple-500/25 text-purple-200 hover:text-white"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className="text-[10px] font-medium tracking-normal text-purple-300/80 -mt-0.5">
                      rodadas ({cost} 🪙)
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CAMPO 3: Tempo para responder (30s, 45s, 60s) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-yellow-400" />
              Tempo para responder
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {timeOptions.map((opt) => {
                const isSelected = timeLimit === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTimeLimit(opt)}
                    className={`relative py-3 px-2 rounded-2xl font-[family-name:var(--font-fredoka)] font-bold text-base transition-all duration-200 flex flex-col items-center justify-center cursor-pointer border-2 ${
                      isSelected
                        ? "bg-gradient-to-b from-purple-700 to-purple-900 border-lime-400 text-white shadow-[0_0_20px_rgba(57,255,20,0.35)] scale-[1.02]"
                        : "bg-[#13082a]/70 hover:bg-[#1b0a3d] border-purple-500/25 text-purple-200 hover:text-white"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className="text-[10px] font-medium tracking-normal text-purple-300/80 -mt-0.5">
                      por resposta
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CAMPO 4: Máximo de jogadores (4, 6, 8, 10) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Máximo de jogadores
            </label>

            <div className="grid grid-cols-4 gap-2">
              {playerOptions.map((opt) => {
                const isSelected = maxPlayers === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMaxPlayers(opt)}
                    className={`relative py-2.5 px-1 rounded-2xl font-[family-name:var(--font-fredoka)] font-bold text-base transition-all duration-200 flex flex-col items-center justify-center cursor-pointer border-2 ${
                      isSelected
                        ? "bg-gradient-to-b from-purple-700 to-purple-900 border-lime-400 text-white shadow-[0_0_20px_rgba(57,255,20,0.35)] scale-[1.02]"
                        : "bg-[#13082a]/70 hover:bg-[#1b0a3d] border-purple-500/25 text-purple-200 hover:text-white"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className="text-[9px] font-medium tracking-tight text-purple-300/80 -mt-0.5">
                      amigos
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-lime-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* BOTÃO FIXO PRÓXIMO AO RODAPÉ (Safe-Area Mobile) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-[#07020d] via-[#07020d]/95 to-transparent backdrop-blur-md">
          <div className="w-full max-w-md mx-auto">
            <motion.button
              type="button"
              id="btn-criar-minha-sala"
              onClick={handleCreateRoom}
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              className="w-full relative group overflow-hidden rounded-2xl py-4 sm:py-4.5 px-6 font-[family-name:var(--font-fredoka)] text-lg sm:text-xl font-bold tracking-wider text-slate-950 uppercase btn-3d-green flex items-center justify-center gap-2 cursor-pointer shadow-[0_10px_25px_rgba(34,197,94,0.45)] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

              <span>{isSubmitting ? "CRIANDO..." : `CRIAR MINHA SALA (${requiredCoins} 🪙)`}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  );
}
