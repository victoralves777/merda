"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  Sliders,
  Play,
  Users,
  Crown,
  Sparkles,
  LogOut,
  Flame,
  Loader2,
  Hourglass,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { SurrealDecorations } from "@/components/SurrealDecorations";
import { SettingsModal } from "@/components/SettingsModal";
import { getRandomQuestion } from "@/lib/questions";
import {
  fetchRoomAndPlayers,
  leaveSupabaseRoom,
  subscribeToRoom,
  startSupabaseGame,
  getPlayerColor,
  type SupabasePlayer,
  type SupabaseRoom,
} from "@/lib/supabaseGame";

export default function LobbyPage() {
  const router = useRouter();

  // Papel e identidade do usuário atual
  const [userRole, setUserRole] = useState<"admin" | "player">("admin");
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [sessionRoomId, setSessionRoomId] = useState<string>("");

  // Dados oficiais da sala vindos do Supabase
  const [room, setRoom] = useState<SupabaseRoom | null>(null);

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameStarting, setIsGameStarting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Previne múltiplas navegações
  const hasNavigatedRef = useRef(false);

  // Lista real de jogadores da sala sincronizada em tempo real
  const [players, setPlayers] = useState<SupabasePlayer[]>([]);

  // Função para navegar para o jogo com segurança
  const navigateToGame = useCallback(() => {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      router.push("/jogo");
    }
  }, [router]);

  // Função para carregar a sala e os jogadores baseados estritamente no UUID da sala
  const loadRoomData = useCallback(async (roomIdToFetch: string) => {
    if (!roomIdToFetch) {
      console.warn("[Lobby] Nenhum roomId fornecido. Redirecionando...");
      router.replace("/entrar-sala");
      return;
    }

    try {
      const { room: fetchedRoom, players: fetchedPlayers, error: fetchErr } = await fetchRoomAndPlayers(roomIdToFetch);

      if (fetchErr || !fetchedRoom) {
        console.error("[Lobby] Erro ao carregar sala do Supabase:", fetchErr);
        setErrorMessage(fetchErr || "Essa sala caiu no buraco 🕳️");
        setIsLoadingInitial(false);
        return;
      }

      setErrorMessage(null);
      setRoom(fetchedRoom);
      setPlayers(fetchedPlayers);
      setIsLoadingInitial(false);

      // LOGS OBRIGATÓRIOS CONFORME ESPECIFICAÇÃO
      const storedPlayerId = typeof window !== "undefined" ? localStorage.getItem("merdas_player_id") : null;
      console.log("ROOM CODE:", fetchedRoom.code);
      console.log("ROOM UUID:", fetchedRoom.id);
      console.log("SESSION ROOM ID:", roomIdToFetch);
      console.log("CURRENT PLAYER ID:", storedPlayerId);
      console.log("PLAYERS:", fetchedPlayers);

      // Se a sala já estiver em jogo, redireciona imediatamente
      if (fetchedRoom.status === "playing") {
        navigateToGame();
      }
    } catch (e) {
      console.error("[Lobby] Exceção ao carregar dados da sala:", e);
      setErrorMessage("Não consegui carregar os malucos da sala.");
      setIsLoadingInitial(false);
    }
  }, [navigateToGame, router]);

  // 1. CARREGAMENTO INICIAL: Lê a sessão e busca a sala pelo UUID (com fallback por código)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRoomId = localStorage.getItem("merdas_room_id");
    const storedCode = localStorage.getItem("merdas_room_code");
    const storedPlayerId = localStorage.getItem("merdas_player_id");
    const storedRole = (localStorage.getItem("merdas_player_role") as "admin" | "player") || "admin";

    const effectiveRoomId =
      storedRoomId ||
      (storedCode ? (storedCode.startsWith("local_") ? storedCode : `local_${storedCode}`) : "");

    if (!effectiveRoomId) {
      console.warn("[Lobby] Sessão sem roomId. Redirecionando para entrar na sala...");
      router.replace("/entrar-sala");
      return;
    }

    setSessionRoomId(effectiveRoomId);
    setCurrentPlayerId(storedPlayerId);
    setUserRole(storedRole);

    loadRoomData(effectiveRoomId);
  }, [loadRoomData, router]);

  // 2. SUBSCRIPTION REALTIME: Conecta estritamente ao canal daquele room.id (UUID)
  useEffect(() => {
    if (!room?.id || room.id.startsWith("local_")) return;

    console.log("Lobby roomId:", room.id);

    const unsubscribe = subscribeToRoom(room.id, {
      onInsert: (newPlayer) => {
        setPlayers((prev) => {
          if (prev.some((p) => p.id === newPlayer.id)) {
            return prev;
          }
          const enriched: SupabasePlayer = {
            ...newPlayer,
            color: getPlayerColor(prev.length),
          };
          const updated = [...prev, enriched];
          console.log("PLAYERS:", updated);
          return updated;
        });
      },
      onUpdate: (updatedPlayer) => {
        setPlayers((prev) => {
          let updated: SupabasePlayer[];
          if (updatedPlayer.is_online === false) {
            updated = prev.filter((p) => p.id !== updatedPlayer.id);
          } else {
            const idx = prev.findIndex((p) => p.id === updatedPlayer.id);
            if (idx >= 0) {
              updated = [...prev];
              updated[idx] = { ...updated[idx], ...updatedPlayer };
            } else {
              updated = [...prev, { ...updatedPlayer, color: getPlayerColor(prev.length) }];
            }
          }
          console.log("PLAYERS:", updated);
          return updated;
        });
      },
      onDelete: (deletedPlayerId) => {
        setPlayers((prev) => {
          const updated = prev.filter((p) => p.id !== deletedPlayerId);
          console.log("PLAYERS:", updated);
          return updated;
        });
      },
      onPlayersChange: () => {
        loadRoomData(room.id);
      },
      onRoomChange: (updatedRoom: SupabaseRoom) => {
        if (updatedRoom.status === "playing") {
          navigateToGame();
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [room?.id, loadRoomData, navigateToGame]);

  // Copiar código da sala
  const handleCopyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    showToast("Código copiado para a área de transferência! ✨");
    setTimeout(() => setCopied(false), 2500);
  };

  // Compartilhar link / código
  const handleShare = async () => {
    if (!room?.code) return;
    const shareText = `Vem jogar Merda Se Fudeu! 💩 Código da sala: ${room.code}`;
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Merda Se Fudeu! 💩",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // Usuário cancelou
      }
    } else {
      navigator.clipboard.writeText(`${shareText} - ${shareUrl}`);
      showToast("Link de convite copiado! 📋");
    }
  };

  // Exibir Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Ação Iniciar Partida (SOMENTE ADM)
  const handleStartGame = async () => {
    if (userRole !== "admin") {
      showToast("Apenas o Dono da Sala pode iniciar a partida! 👑");
      return;
    }

    if (!room?.id) return;

    setIsGameStarting(true);

    const firstQuestion = getRandomQuestion();
    const result = await startSupabaseGame(room.id, firstQuestion, userRole);

    if (!result.success) {
      setIsGameStarting(false);
      showToast(result.error || "Erro ao iniciar partida.");
      return;
    }

    setTimeout(() => {
      navigateToGame();
    }, 800);
  };

  // Sair da Sala (marca is_online = false no Supabase e limpa sessão)
  const handleExitRoom = async () => {
    await leaveSupabaseRoom(currentPlayerId);
    router.push("/");
  };

  // Jogadores online ativos
  const onlinePlayers = players.filter((p) => p.is_online !== false);
  const maxPlayers = room?.max_players || 8;
  const roomDisplayCode = room?.code || "...";

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col bg-surreal-grid overflow-x-hidden text-slate-100">
      {/* Camada de Decorações Sutis */}
      <SurrealDecorations />

      {/* Container Principal Mobile-First */}
      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-4 pt-4 pb-36 sm:pb-40">
        {/* TOPO: Botão Sair + Badge SALA CRIADA 💩 */}
        <header className="w-full mb-4">
          <div className="flex items-center justify-between">
            {/* Botão Sair da Sala */}
            <button
              type="button"
              id="btn-sair-sala"
              onClick={() => setShowExitConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-950/60 hover:bg-rose-950/80 border border-purple-500/30 hover:border-rose-500/50 text-purple-300 hover:text-rose-200 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 cursor-pointer"
              title="Sair da Sala"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sair</span>
            </button>

            {/* Badge de Título da Sala */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-900/80 to-purple-950/90 border border-purple-500/40 text-purple-200 text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
              <span>{userRole === "admin" ? "SALA CRIADA 💩" : "LOBBY DA SALA 💩"}</span>
            </div>

            {/* Contador Compacto no Topo */}
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-lime-400 font-mono text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>{onlinePlayers.length}/{maxPlayers}</span>
            </div>
          </div>
        </header>

        {/* ALERTA DE ERRO DE CONEXÃO (SE HOUVER) */}
        {errorMessage && (
          <div className="w-full mb-3 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-center justify-between text-xs font-semibold shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => sessionRoomId && loadRoomData(sessionRoomId)}
              className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-white cursor-pointer"
              title="Tentar novamente"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* CARD DO CÓDIGO DA SALA EM DESTAQUE (Vindo diretamente da consulta do UUID) */}
        <section className="w-full rounded-3xl bg-[#14082c]/90 border-2 border-purple-500/40 p-4 sm:p-5 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md">
          {/* Luz de fundo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-lime-400/10 blur-xl pointer-events-none" />

          <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">
            CÓDIGO DA SALA
          </span>

          {/* Código Grande em Destaque */}
          <div className="my-2 select-all">
            <span className="text-4xl sm:text-5xl font-black font-[family-name:var(--font-fredoka)] tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-yellow-300 to-emerald-400 drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]">
              {roomDisplayCode}
            </span>
          </div>

          {/* Botões de Ação do Código */}
          <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
            {/* Botão Copiar Código */}
            <button
              type="button"
              id="btn-copiar-codigo"
              onClick={handleCopyCode}
              disabled={!room?.code}
              className="py-2.5 px-3 rounded-xl bg-purple-900/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white font-[family-name:var(--font-fredoka)] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-lime-400" />
                  <span className="text-lime-400">COPIADO!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-lime-400" />
                  <span>COPIAR CÓDIGO</span>
                </>
              )}
            </button>

            {/* Botão Compartilhar */}
            <button
              type="button"
              id="btn-compartilhar-codigo"
              onClick={handleShare}
              disabled={!room?.code}
              className="py-2.5 px-3 rounded-xl bg-pink-950/50 hover:bg-pink-900/70 border border-pink-500/30 text-pink-200 hover:text-white font-[family-name:var(--font-fredoka)] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5 text-pink-400" />
              <span>COMPARTILHAR</span>
            </button>
          </div>
        </section>

        {/* SEÇÃO: LISTA REAL DE JOGADORES SINCRONIZADA */}
        <section className="w-full flex-1 flex flex-col my-4">
          {/* Cabeçalho da Lista com Contagem Real */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-lime-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                JOGADORES CONECTADOS
              </span>
            </div>

            <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/30 text-lime-400">
              {onlinePlayers.length}/{maxPlayers} jogadores
            </span>
          </div>

          {/* LISTAGEM DOS CARDS DE JOGADORES REAIS */}
          <div className="flex flex-col gap-2.5">
            {isLoadingInitial && onlinePlayers.length === 0 ? (
              <div className="w-full py-8 flex flex-col items-center justify-center gap-2 text-purple-300">
                <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
                <span className="text-xs font-semibold">Carregando sala...</span>
              </div>
            ) : (
              <AnimatePresence>
                {onlinePlayers.map((player, index) => {
                  const initial = (player.nickname || "P").charAt(0).toUpperCase();
                  const isCurrentUser =
                    player.id === currentPlayerId ||
                    (userRole === "admin" && player.role === "admin");

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`w-full p-3 sm:p-3.5 rounded-2xl border-2 flex items-center justify-between backdrop-blur-sm transition-all ${
                        player.role === "admin"
                          ? "bg-gradient-to-r from-purple-950/90 via-[#1e0a3d] to-purple-950/90 border-amber-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                          : isCurrentUser
                          ? "bg-gradient-to-r from-purple-950/90 via-[#1f0b3b] to-purple-950/90 border-lime-400/60 shadow-[0_0_15px_rgba(57,255,20,0.25)]"
                          : "bg-[#13082a]/80 border-purple-500/25 hover:border-purple-500/50"
                      }`}
                    >
                      {/* Avatar com Inicial + Nome */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${player.color || "from-pink-500 to-rose-600"} flex items-center justify-center text-slate-950 font-black text-base shadow-inner shrink-0`}
                        >
                          {initial}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-bold text-sm sm:text-base tracking-wide ${
                              isCurrentUser ? "text-white" : "text-purple-100"
                            }`}
                          >
                            {player.nickname}
                          </span>

                          {/* Coroa do ADM */}
                          {player.role === "admin" && (
                            <span
                              className="text-base filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                              title="Dono da Sala (ADM)"
                            >
                              👑
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges e Status de Conexão */}
                      <div className="flex items-center gap-2">
                        {/* Selo VOCÊ */}
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full bg-lime-400/20 border border-lime-400/50 text-lime-300 text-[10px] font-black uppercase tracking-wider">
                            VOCÊ
                          </span>
                        )}

                        {/* Selo ADM */}
                        {player.role === "admin" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                            <Crown className="w-2.5 h-2.5 text-amber-400" />
                            <span>ADM</span>
                          </span>
                        )}

                        {/* Bolinha Verde de Conexão Ativa */}
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-1" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {/* ESTADO VAZIO (quando há apenas 1 jogador conectado) */}
            {!isLoadingInitial && onlinePlayers.length === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-8 px-4 rounded-3xl bg-purple-950/30 border-2 border-dashed border-purple-500/30 flex flex-col items-center justify-center text-center gap-2 my-2"
              >
                <span className="text-3xl animate-bounce">🕳️</span>
                <p className="text-xs sm:text-sm font-semibold text-purple-200 italic">
                  “Esperando mais vítimas entrarem…”
                </p>
                <span className="text-[11px] text-purple-400/80">
                  Envie o código <strong className="text-lime-400 font-mono">{roomDisplayCode}</strong> para seus amigos!
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* TOAST FLUTUANTE */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#1e0738] border-2 border-lime-400/60 shadow-[0_0_25px_rgba(57,255,20,0.45)] backdrop-blur-md text-xs font-bold text-white flex items-center gap-2 whitespace-nowrap"
            >
              <Flame className="w-4 h-4 text-lime-400 shrink-0 animate-pulse" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ÁREA INFERIOR: CONDICIONAL ENTRE ADM E JOGADOR COMUM */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-[#07020d] via-[#07020d]/95 to-transparent backdrop-blur-md">
          <div className="w-full max-w-md mx-auto">
            {userRole === "admin" ? (
              /* CONTROLES DO ADM */
              <div className="flex flex-col gap-2.5">
                {/* Botão Principal: INICIAR PARTIDA COM LOADING "Abrindo o buraco..." */}
                <motion.button
                  type="button"
                  id="btn-iniciar-partida"
                  onClick={handleStartGame}
                  disabled={isGameStarting || onlinePlayers.length === 0}
                  whileTap={!isGameStarting ? { scale: 0.97 } : {}}
                  whileHover={!isGameStarting ? { scale: 1.01 } : {}}
                  className={`w-full relative group overflow-hidden rounded-2xl py-4 sm:py-4.5 px-6 font-[family-name:var(--font-fredoka)] text-lg sm:text-xl font-bold tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all ${
                    isGameStarting
                      ? "bg-purple-950 border-2 border-lime-400/60 text-lime-300 shadow-[0_0_25px_rgba(57,255,20,0.4)] cursor-wait"
                      : onlinePlayers.length === 0
                      ? "bg-purple-950/40 border border-purple-800/40 text-purple-400/50 cursor-not-allowed"
                      : "btn-3d-green text-slate-950 shadow-[0_10px_25px_rgba(34,197,94,0.45)] cursor-pointer"
                  }`}
                >
                  {isGameStarting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-lime-400" />
                      <span>Abrindo o buraco... 🕳️</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
                      <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
                      <span>INICIAR PARTIDA</span>
                    </>
                  )}
                </motion.button>

                {/* Botão Secundário: CONFIGURAÇÕES */}
                <button
                  type="button"
                  id="btn-configuracoes-lobby"
                  onClick={() => setIsSettingsOpen(true)}
                  disabled={isGameStarting}
                  className="w-full py-3 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white font-[family-name:var(--font-fredoka)] font-semibold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Sliders className="w-4 h-4 text-purple-300" />
                  <span>CONFIGURAÇÕES</span>
                </button>
              </div>
            ) : (
              /* VISÃO DO JOGADOR COMUM (AGUARDANDO O ADM) */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#180933] to-purple-950/80 border-2 border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.25)] flex flex-col items-center text-center gap-1.5 backdrop-blur-md"
              >
                <div className="flex items-center gap-2 text-lime-400 font-[family-name:var(--font-fredoka)] text-base sm:text-lg font-bold tracking-wider uppercase">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AGUARDANDO O ADM...</span>
                  <Hourglass className="w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
                <p className="text-xs text-purple-300/80 font-medium italic">
                  “Enquanto isso, pense em respostas ruins.”
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* MODAL DE CONFIRMAÇÃO DE SAÍDA */}
        <AnimatePresence>
          {showExitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExitConfirm(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xs bg-[#14082c] border-2 border-purple-500/50 rounded-3xl p-5 shadow-[0_0_30px_rgba(168,85,247,0.4)] text-center text-slate-100"
              >
                <span className="text-3xl">🚪</span>
                <h3 className="text-lg font-bold font-[family-name:var(--font-fredoka)] mt-2">
                  Deseja sair da sala?
                </h3>
                <p className="text-xs text-purple-300/80 my-3">
                  Você será desconectado e retornará à página inicial.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowExitConfirm(false)}
                    className="py-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Ficar
                  </button>
                  <button
                    type="button"
                    onClick={handleExitRoom}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase transition-colors cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                  >
                    Sair
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL DE CONFIGURAÇÕES */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={{
            code: roomDisplayCode,
            hostNickname: onlinePlayers.find((p) => p.role === "admin")?.nickname || "Pato",
            rounds: room?.total_rounds || 10,
            timeLimit: `${room?.answer_time || 45}s`,
            maxPlayers: maxPlayers,
          }}
        />
      </div>
    </main>
  );
}
