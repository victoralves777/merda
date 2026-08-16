"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Send,
  CheckCircle2,
  Flame,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Clock,
  Vote,
  Trophy,
  Crown,
  Medal,
  Users,
  ChevronRight,
  RotateCcw,
  Star,
} from "lucide-react";
import { SurrealDecorations } from "@/components/SurrealDecorations";
import { getRandomQuestion } from "@/lib/questions";
import {
  fetchRoom,
  fetchRoomPlayers,
  submitRoundAnswer,
  fetchRoundAnswers,
  submitRoundVote,
  fetchRoundVotes,
  updateRoomGameState,
  subscribeToGame,
  type SupabaseRoom,
  type SupabasePlayer,
  type SupabaseAnswer,
  type SupabaseVote,
  getPlayerColor,
} from "@/lib/supabaseGame";
import { useAuth } from "@/contexts/AuthContext";

export default function JogoPage() {
  const router = useRouter();
  const { profile, addCoinsToBalance, showSuccessToast } = useAuth();

  // Rastreio de rodadas onde a dedução já ocorreu para evitar descontar duas vezes
  const deductedRoundsRef = useRef<Set<number>>(new Set());

  // Dados da sala e jogador local
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState<string>("Jogador");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Estados da Sala
  const [room, setRoom] = useState<SupabaseRoom | null>(null);
  const [players, setPlayers] = useState<SupabasePlayer[]>([]);
  const [gameState, setGameState] = useState<"answering" | "voting" | "result" | "finished">("answering");
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(10);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Timers
  const [answerTime, setAnswerTime] = useState<number>(45);
  const [timeLeft, setTimeLeft] = useState<number>(45);

  // Estados da Fase de Respostas (Answering)
  const [myAnswer, setMyAnswer] = useState<string>("");
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState<boolean>(false);
  const [answersList, setAnswersList] = useState<SupabaseAnswer[]>([]);

  // Estados da Fase de Votação (Voting)
  const [myVotedAnswerId, setMyVotedAnswerId] = useState<string | null>(null);
  const [hasSubmittedVote, setHasSubmittedVote] = useState<boolean>(false);
  const [votesList, setVotesList] = useState<SupabaseVote[]>([]);

  // Pontuação acumulada local
  const [scores, setScores] = useState<Record<string, number>>({});

  // 1. CARREGAMENTO INICIAL DO JOGO E JOGADOR
  useEffect(() => {
    let isMounted = true;

    async function initGame() {
      try {
        const storedRoomId = localStorage.getItem("merdas_room_id");
        const storedPlayerId = localStorage.getItem("merdas_player_id");
        const storedNick = localStorage.getItem("merdas_player_nickname") || "Jogador";
        const storedRole = localStorage.getItem("merdas_player_role");

        if (!storedRoomId) {
          router.replace("/entrar-sala");
          return;
        }

        setRoomId(storedRoomId);
        setMyPlayerId(storedPlayerId);
        setMyNickname(storedNick);
        setIsAdmin(storedRole === "admin");

        const roomData = await fetchRoom(storedRoomId);
        if (!roomData) {
          router.replace("/lobby");
          return;
        }

        if (roomData.status !== "playing" && roomData.status !== "finished") {
          router.replace("/lobby");
          return;
        }

        setRoom(roomData);
        setCurrentRound(roomData.current_round || 1);
        setTotalRounds(roomData.total_rounds || 10);
        setAnswerTime(roomData.answer_time || 45);
        setTimeLeft(roomData.answer_time || 45);
        setGameState((roomData.game_state as any) || "answering");

        if (roomData.current_question) {
          setQuestion(roomData.current_question);
        } else {
          const q = getRandomQuestion();
          setQuestion(q);
        }

        // Busca jogadores da sala
        const playerList = await fetchRoomPlayers(storedRoomId);
        setPlayers(playerList);

        // Busca respostas e votos existentes da rodada
        const currentAns = await fetchRoundAnswers(storedRoomId, roomData.current_round || 1);
        setAnswersList(currentAns);

        const myExistingAns = currentAns.find((a) => a.player_id === storedPlayerId);
        if (myExistingAns) {
          setMyAnswer(myExistingAns.answer_text);
          setHasSubmittedAnswer(true);
        }

        const currentV = await fetchRoundVotes(storedRoomId, roomData.current_round || 1);
        setVotesList(currentV);

        const myExistingVote = currentV.find((v) => v.voter_player_id === storedPlayerId);
        if (myExistingVote) {
          setMyVotedAnswerId(myExistingVote.answer_id);
          setHasSubmittedVote(true);
        }

        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("Erro ao inicializar jogo:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    initGame();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. SINCRONIZAÇÃO EM REALTIME
  useEffect(() => {
    if (!roomId) return;

    const reloadData = async () => {
      const updatedRoom = await fetchRoom(roomId);
      if (updatedRoom) {
        setRoom(updatedRoom);
        if (updatedRoom.game_state && updatedRoom.game_state !== gameState) {
          handleGameStateTransition(updatedRoom.game_state as any, updatedRoom);
        }
        if (updatedRoom.current_round !== currentRound) {
          setCurrentRound(updatedRoom.current_round);
          setQuestion(updatedRoom.current_question || getRandomQuestion());
          setHasSubmittedAnswer(false);
          setMyAnswer("");
          setHasSubmittedVote(false);
          setMyVotedAnswerId(null);
          setTimeLeft(updatedRoom.answer_time || 45);
        }
      }

      const pList = await fetchRoomPlayers(roomId);
      setPlayers(pList);

      const aList = await fetchRoundAnswers(roomId, currentRound);
      setAnswersList(aList);

      const vList = await fetchRoundVotes(roomId, currentRound);
      setVotesList(vList);
    };

    const unsubscribe = subscribeToGame(roomId, {
      onRoomChange: (updatedRoom) => {
        setRoom(updatedRoom);
        if (updatedRoom.game_state && updatedRoom.game_state !== gameState) {
          handleGameStateTransition(updatedRoom.game_state as any, updatedRoom);
        }
        if (updatedRoom.current_round !== currentRound) {
          setCurrentRound(updatedRoom.current_round);
          setQuestion(updatedRoom.current_question || getRandomQuestion());
          setHasSubmittedAnswer(false);
          setMyAnswer("");
          setHasSubmittedVote(false);
          setMyVotedAnswerId(null);
          setTimeLeft(updatedRoom.answer_time || 45);
        }
      },
      onAnswersChange: async () => {
        const aList = await fetchRoundAnswers(roomId, currentRound);
        setAnswersList(aList);
      },
      onVotesChange: async () => {
        const vList = await fetchRoundVotes(roomId, currentRound);
        setVotesList(vList);
      },
    });

    // Polling redundante a cada 2.5s
    const pollInterval = setInterval(reloadData, 2500);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [roomId, gameState, currentRound]);

  // Transição de estado de jogo sincronizada
  const handleGameStateTransition = useCallback(
    (newState: "answering" | "voting" | "result" | "finished", updatedRoom?: SupabaseRoom) => {
      setGameState(newState);

      if (newState === "answering") {
        setTimeLeft(updatedRoom?.answer_time || answerTime || 45);
        setHasSubmittedAnswer(false);
        setMyAnswer("");
        setHasSubmittedVote(false);
        setMyVotedAnswerId(null);
      } else if (newState === "voting") {
        setTimeLeft(25); // 25s para votação
      } else if (newState === "result") {
        setTimeLeft(10); // 10s para exibir resultado da rodada
      }
    },
    [answerTime]
  );

  // 3. COUNTDOWN TIMER
  useEffect(() => {
    if (isLoading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer zerou! Auto-avanço da fase
          handleTimerExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, gameState, roomId, currentRound, answersList.length, votesList.length, isAdmin]);

  // Ação quando o timer chega a 0s
  const handleTimerExpired = useCallback(async () => {
    if (!roomId) return;

    if (gameState === "answering") {
      // Avança para a Votação
      if (isAdmin) {
        await updateRoomGameState(roomId, "voting");
      }
      setGameState("voting");
      setTimeLeft(25);
    } else if (gameState === "voting") {
      // Avança para o Resultado da Rodada
      if (isAdmin) {
        await updateRoomGameState(roomId, "result");
      }
      setGameState("result");
      setTimeLeft(10);
    } else if (gameState === "result") {
      // Próxima rodada ou Finalização
      if (isAdmin) {
        if (currentRound >= totalRounds) {
          await updateRoomGameState(roomId, "finished", { status: "finished" });
          setGameState("finished");
        } else {
          const nextR = currentRound + 1;
          const nextQ = getRandomQuestion();
          await updateRoomGameState(roomId, "answering", {
            current_round: nextR,
            current_question: nextQ,
          });
          setCurrentRound(nextR);
          setQuestion(nextQ);
          setGameState("answering");
          setTimeLeft(answerTime);
        }
      }
    }
  }, [roomId, gameState, isAdmin, currentRound, totalRounds, answerTime]);

  // Se todos os jogadores responderam, avança imediatamente para a votação
  useEffect(() => {
    if (gameState === "answering" && players.length > 0 && answersList.length >= players.length) {
      if (isAdmin && roomId) {
        updateRoomGameState(roomId, "voting");
      }
      setGameState("voting");
      setTimeLeft(25);
    }
  }, [gameState, answersList.length, players.length, isAdmin, roomId]);

  // Se todos os jogadores votaram, avança imediatamente para o resultado
  useEffect(() => {
    if (gameState === "voting" && players.length > 0 && votesList.length >= players.length) {
      if (isAdmin && roomId) {
        updateRoomGameState(roomId, "result");
      }
      setGameState("result");
      setTimeLeft(10);
    }
  }, [gameState, votesList.length, players.length, isAdmin, roomId]);

  // 4. SUBMETER RESPOSTA
  const handleSendAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!myAnswer.trim() || !roomId || !myPlayerId) return;

    setHasSubmittedAnswer(true);
    await submitRoundAnswer(roomId, myPlayerId, currentRound, myAnswer);
    const updated = await fetchRoundAnswers(roomId, currentRound);
    setAnswersList(updated);
  };

  // 5. SUBMETER VOTO
  const handleVote = async (answerId: string, answerPlayerId: string) => {
    if (hasSubmittedVote || !roomId || !myPlayerId) return;
    if (answerPlayerId === myPlayerId) return; // Não pode votar na própria resposta

    setMyVotedAnswerId(answerId);
    setHasSubmittedVote(true);

    await submitRoundVote(roomId, myPlayerId, answerId, currentRound);
    const updated = await fetchRoundVotes(roomId, currentRound);
    setVotesList(updated);
  };

  // 6. AVANÇAR MANUALMENTE PELO ADM
  const handleAdminNextStep = async () => {
    if (!isAdmin || !roomId) return;

    if (gameState === "answering") {
      await updateRoomGameState(roomId, "voting");
      setGameState("voting");
      setTimeLeft(25);
    } else if (gameState === "voting") {
      await updateRoomGameState(roomId, "result");
      setGameState("result");
      setTimeLeft(10);
    } else if (gameState === "result") {
      if (currentRound >= totalRounds) {
        await updateRoomGameState(roomId, "finished", { status: "finished" });
        setGameState("finished");
      } else {
        const nextR = currentRound + 1;
        const nextQ = getRandomQuestion();
        await updateRoomGameState(roomId, "answering", {
          current_round: nextR,
          current_question: nextQ,
        });
        setCurrentRound(nextR);
        setQuestion(nextQ);
        setGameState("answering");
        setTimeLeft(answerTime);
      }
    }
  };

  // Cálculo de votos por resposta na fase de resultado
  const voteCounts: Record<string, number> = {};
  votesList.forEach((v) => {
    voteCounts[v.answer_id] = (voteCounts[v.answer_id] || 0) + 1;
  });

  // Atualização dos placares
  useEffect(() => {
    if (gameState === "result" || gameState === "finished") {
      const newScores = { ...scores };
      answersList.forEach((a) => {
        const vCount = voteCounts[a.id] || 0;
        const pts = vCount * 100;
        newScores[a.player_id] = (newScores[a.player_id] || 0) + pts;
      });
      setScores(newScores);
    }
  }, [gameState, answersList.length, votesList.length]);

  // Vencedor (mais votado / falou a pior merda) da rodada
  let maxVotes = 0;
  let winningAnswerId: string | null = null;
  let worstPlayerId: string | null = null;

  answersList.forEach((a) => {
    const c = voteCounts[a.id] || 0;
    if (c > maxVotes) {
      maxVotes = c;
      winningAnswerId = a.id;
      worstPlayerId = a.player_id;
    }
  });

  // Punição de -5 moedas para quem foi o mais votado da rodada
  useEffect(() => {
    if (
      gameState === "result" &&
      !deductedRoundsRef.current.has(currentRound) &&
      answersList.length > 0
    ) {
      if (maxVotes > 0 && worstPlayerId) {
        deductedRoundsRef.current.add(currentRound);
        if (worstPlayerId === myPlayerId) {
          addCoinsToBalance(-5);
          showSuccessToast("💩💸 Você falou a pior merda e perdeu 5 moedas!");
        }
      }
    }
  }, [
    gameState,
    currentRound,
    answersList.length,
    maxVotes,
    worstPlayerId,
    myPlayerId,
    addCoinsToBalance,
    showSuccessToast,
  ]);

  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / (gameState === "voting" ? 25 : answerTime)) * 100));
  const isTimeCritical = timeLeft <= 5;

  if (isLoading) {
    return (
      <main className="min-h-[100dvh] w-full flex items-center justify-center bg-surreal-grid text-slate-100">
        <SurrealDecorations />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-lime-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(57,255,20,0.5)]" />
          <p className="font-[family-name:var(--font-fredoka)] font-bold text-sm text-purple-200 tracking-wider uppercase">
            Carregando a rodada... 💩
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col bg-surreal-grid overflow-x-hidden text-slate-100">
      <SurrealDecorations />

      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-4 pt-4 pb-28 sm:pb-32">
        {/* CABEÇALHO SUPERIOR */}
        <header className="w-full mb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Link
              href="/lobby"
              className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-300 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 cursor-pointer"
              title="Voltar ao Lobby"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* BADGE DE FASE / RODADA */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              {gameState === "answering" ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-pink-400" />
                  <span className="font-[family-name:var(--font-fredoka)] font-bold text-xs sm:text-sm tracking-wider uppercase text-white">
                    RODADA {currentRound}/{totalRounds}
                  </span>
                </>
              ) : gameState === "voting" ? (
                <>
                  <Vote className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="font-[family-name:var(--font-fredoka)] font-bold text-xs sm:text-sm tracking-wider uppercase text-yellow-300">
                    VOTAÇÃO 🗳️
                  </span>
                </>
              ) : gameState === "result" ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-lime-400" />
                  <span className="font-[family-name:var(--font-fredoka)] font-bold text-xs sm:text-sm tracking-wider uppercase text-lime-300">
                    RESULTADO 🏆
                  </span>
                </>
              ) : (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-[family-name:var(--font-fredoka)] font-bold text-xs sm:text-sm tracking-wider uppercase text-amber-300">
                    PÓDIO FINAL 👑
                  </span>
                </>
              )}
            </div>

            {/* TIMER REGRESSIVO */}
            <div
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all duration-300 ${
                isTimeCritical
                  ? "bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                  : "bg-purple-950/80 border-lime-400/50 text-lime-400 shadow-[0_0_15px_rgba(57,255,20,0.25)]"
              }`}
            >
              <Timer className={`w-3.5 h-3.5 ${isTimeCritical ? "text-rose-400 animate-spin" : "text-lime-400"}`} />
              <span className="font-mono font-black text-sm tracking-wider">{timeLeft}s</span>
            </div>
          </div>

          {/* BARRA DE PROGRESSO DO TIMER */}
          {gameState !== "finished" && (
            <div className="w-full h-1.5 rounded-full bg-purple-950/60 overflow-hidden border border-purple-500/20">
              <motion.div
                className={`h-full transition-all duration-1000 ${
                  isTimeCritical
                    ? "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                    : "bg-gradient-to-r from-lime-400 via-emerald-400 to-green-500"
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          )}
        </header>

        {/* ============================================================ */}
        {/* FASE 1: RESPONDENDO (ANSWERING) */}
        {/* ============================================================ */}
        {gameState === "answering" && (
          <section className="w-full my-auto flex flex-col gap-4">
            {/* CARD DA PERGUNTA */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#180933]/95 via-[#130728]/95 to-[#0e041e]/95 border-2 border-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.3)] relative overflow-hidden backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-[11px] font-bold uppercase tracking-wider">
                  <HelpCircle className="w-3 h-3 text-lime-400" />
                  Pergunta da Rodada
                </span>
                <span className="text-xl">👑</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-fredoka)] leading-snug tracking-wide text-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                “{question}”
              </h2>
            </motion.div>

            {/* FORMULÁRIO OU STATUS ENVIADO */}
            <AnimatePresence mode="wait">
              {!hasSubmittedAnswer ? (
                <motion.form
                  key="form-answering"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSendAnswer}
                  className="flex flex-col gap-2 w-full"
                >
                  <div className="flex items-center justify-between px-1">
                    <label
                      htmlFor="input-answer"
                      className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                      Sua Resposta
                    </label>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        myAnswer.length >= 180 ? "text-pink-400" : "text-purple-400"
                      }`}
                    >
                      {myAnswer.length}/200
                    </span>
                  </div>

                  <textarea
                    id="input-answer"
                    rows={3}
                    maxLength={200}
                    value={myAnswer}
                    onChange={(e) => setMyAnswer(e.target.value)}
                    placeholder="Digite sua resposta merda..."
                    className="w-full p-4 rounded-2xl bg-[#14082c]/95 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-sm sm:text-base font-semibold tracking-wide resize-none focus:outline-none focus:border-lime-400 focus:shadow-[0_0_25px_rgba(57,255,20,0.35)] transition-all shadow-inner"
                  />
                </motion.form>
              ) : (
                <motion.div
                  key="state-submitted"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-full p-5 rounded-3xl bg-gradient-to-b from-[#180833]/90 to-[#100424]/90 border-2 border-lime-400/60 shadow-[0_0_30px_rgba(57,255,20,0.3)] flex flex-col items-center text-center gap-3 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 text-lime-400">
                    <CheckCircle2 className="w-6 h-6 animate-pulse" />
                    <h3 className="text-xl font-black uppercase font-[family-name:var(--font-fredoka)] tracking-wide">
                      RESPOSTA ENVIADA 💩
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-purple-200 italic">
                    “Agora aguente a vergonha.”
                  </p>

                  <div className="w-full p-3 rounded-xl bg-purple-950/50 border border-purple-500/20 text-left">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block mb-0.5">
                      Você respondeu:
                    </span>
                    <p className="text-xs text-purple-100 font-medium italic break-words">
                      “{myAnswer}”
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-purple-300 font-medium mt-1">
                    <Clock className="w-3.5 h-3.5 animate-spin text-lime-400" />
                    <span>
                      {answersList.length} de {players.length || 2} responderam...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* ============================================================ */}
        {/* FASE 2: VOTAÇÃO (VOTING) */}
        {/* ============================================================ */}
        {gameState === "voting" && (
          <section className="w-full my-auto flex flex-col gap-3">
            <div className="text-center mb-1">
              <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-fredoka)] uppercase tracking-tight text-white flex items-center justify-center gap-2">
                <span>VOTE NA PIOR MERDA!</span>
                <span>💩</span>
              </h2>
              <p className="text-xs text-purple-300 font-medium">
                Escolha a resposta mais zoeira ou engraçada da rodada.
              </p>
            </div>

            {/* RESUMO DA PERGUNTA */}
            <div className="p-3 rounded-2xl bg-[#14082c]/80 border border-purple-500/30 text-purple-200 text-xs text-center italic">
              “{question}”
            </div>

            {/* LISTA DE RESPOSTAS PARA VOTAR */}
            <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {answersList.length === 0 ? (
                <div className="p-4 rounded-2xl bg-purple-950/40 text-center text-xs text-purple-300">
                  Ninguém respondeu a tempo! 🤡
                </div>
              ) : (
                answersList.map((item, idx) => {
                  const isMyOwn = item.player_id === myPlayerId;
                  const isSelected = myVotedAnswerId === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      disabled={hasSubmittedVote || isMyOwn}
                      onClick={() => handleVote(item.id, item.player_id)}
                      whileHover={!hasSubmittedVote && !isMyOwn ? { scale: 1.02 } : {}}
                      whileTap={!hasSubmittedVote && !isMyOwn ? { scale: 0.98 } : {}}
                      className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between gap-3 shadow-md ${
                        isSelected
                          ? "bg-gradient-to-r from-lime-950 via-purple-950 to-lime-950 border-lime-400 shadow-[0_0_25px_rgba(57,255,20,0.4)]"
                          : isMyOwn
                          ? "bg-purple-950/40 border-purple-800/40 opacity-60 cursor-not-allowed"
                          : "bg-[#14082c] hover:bg-[#1a0b38] border-purple-500/40 hover:border-pink-500 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-purple-900 border border-purple-500/40 text-yellow-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm sm:text-base font-bold text-white leading-snug">
                            “{item.answer_text}”
                          </p>
                          {isMyOwn && (
                            <span className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider block mt-0.5">
                              (Sua resposta - não pode votar em si mesmo)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-8 h-8 rounded-full bg-lime-400 text-slate-950 flex items-center justify-center font-black">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        ) : !isMyOwn ? (
                          <div className="px-3 py-1 rounded-xl bg-purple-900/60 border border-purple-500/40 text-xs font-bold text-purple-200">
                            Votar 💩
                          </div>
                        ) : null}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {hasSubmittedVote && (
              <div className="p-3 rounded-2xl bg-lime-950/70 border border-lime-500/40 text-center text-xs text-lime-300 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Voto registrado! Aguardando o encerramento da votação...</span>
              </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* FASE 3: RESULTADO DA RODADA (RESULT) */}
        {/* ============================================================ */}
        {gameState === "result" && (
          <section className="w-full my-auto flex flex-col gap-3">
            <div className="text-center mb-1">
              <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-fredoka)] uppercase tracking-tight text-white flex items-center justify-center gap-2">
                <span>A PIOR MERDA DA RODADA!</span>
                <span>💩💸</span>
              </h2>
              <p className="text-xs text-purple-300 font-medium">
                O mais votado foi punido e perdeu <strong className="text-rose-400 font-mono">-5 Moedas</strong>!
              </p>
            </div>

            {/* LISTA REVELANDO AUTORES E VOTOS */}
            <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {answersList.map((item) => {
                const votes = voteCounts[item.id] || 0;
                const isWorst = item.id === winningAnswerId && votes > 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                      isWorst
                        ? "bg-gradient-to-r from-rose-950/90 via-[#260a33] to-rose-950/90 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.45)]"
                        : "bg-[#14082c] border-purple-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-lg shrink-0 ${
                          isWorst
                            ? "bg-rose-900/80 border-rose-400 text-xl animate-bounce"
                            : "bg-purple-900 border-purple-400/40"
                        }`}
                      >
                        {isWorst ? "💩" : "🤡"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">“{item.answer_text}”</p>
                        <span className="text-xs text-purple-300 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>Por:</span>
                          <strong className={isWorst ? "text-rose-300 font-bold" : "text-purple-200"}>
                            {item.player_nickname || "Jogador"}
                          </strong>
                          {isWorst && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase border border-rose-500/40">
                              Mais Votado
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isWorst ? (
                        <span className="font-mono font-black text-sm text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] block">
                          -5 Moedas 💩💸
                        </span>
                      ) : null}
                      <span className="font-mono font-black text-xs text-lime-300 block">
                        +{votes * 100} pts
                      </span>
                      <span className="text-[10px] text-purple-400 font-bold uppercase">
                        {votes} {votes === 1 ? "voto" : "votos"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleAdminNextStep}
                className="w-full mt-2 py-3 rounded-2xl font-[family-name:var(--font-fredoka)] font-bold text-base uppercase tracking-wider text-slate-950 btn-3d-green shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{currentRound >= totalRounds ? "VER PÓDIO FINAL 🏆" : "PRÓXIMA RODADA ⚡"}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* FASE 4: PÓDIO FINAL (FINISHED) */}
        {/* ============================================================ */}
        {gameState === "finished" && (
          <section className="w-full my-auto flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-yellow-400 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(250,204,21,0.6)] animate-bounce">
              👑
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-fredoka)] uppercase tracking-tight text-yellow-300">
                PÓDIO MERDA SE FUDEU! 💩
              </h2>
              <p className="text-xs sm:text-sm text-purple-200 font-medium mt-1">
                Fim de jogo! Parabéns aos maiores faladores de merda!
              </p>
            </div>

            {/* RANKING FINAL */}
            <div className="w-full flex flex-col gap-2 my-2">
              {players
                .map((p) => ({
                  ...p,
                  totalScore: scores[p.id] || 0,
                }))
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between ${
                      idx === 0
                        ? "bg-amber-950/80 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                        : idx === 1
                        ? "bg-slate-900/80 border-slate-400"
                        : idx === 2
                        ? "bg-orange-950/80 border-amber-600"
                        : "bg-purple-950/50 border-purple-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-lg">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <span className="font-bold text-white text-sm">{p.nickname}</span>
                    </div>

                    <span className="font-mono font-black text-base text-lime-300">
                      {p.totalScore} pts
                    </span>
                  </div>
                ))}
            </div>

            <Link
              href="/lobby"
              className="w-full py-3.5 rounded-2xl font-[family-name:var(--font-fredoka)] font-bold text-base uppercase tracking-wider text-slate-950 btn-3d-green shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>JOGAR NOVAMENTE</span>
            </Link>
          </section>
        )}

        {/* BOTÃO FIXO NO RODAPÉ DA FASE DE RESPOSTA */}
        {gameState === "answering" && !hasSubmittedAnswer && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-[#07020d] via-[#07020d]/95 to-transparent backdrop-blur-md">
            <div className="w-full max-w-md mx-auto">
              <motion.button
                type="button"
                id="btn-enviar-merda"
                onClick={() => handleSendAnswer()}
                disabled={!myAnswer.trim()}
                whileTap={myAnswer.trim() ? { scale: 0.97 } : {}}
                whileHover={myAnswer.trim() ? { scale: 1.01 } : {}}
                className={`w-full relative group overflow-hidden rounded-2xl py-4 sm:py-4.5 px-6 font-[family-name:var(--font-fredoka)] text-lg sm:text-xl font-bold tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all duration-200 ${
                  myAnswer.trim()
                    ? "btn-3d-green text-slate-950 shadow-[0_10px_25px_rgba(34,197,94,0.45)] cursor-pointer"
                    : "bg-purple-950/40 border-2 border-purple-800/30 text-purple-400/50 cursor-not-allowed opacity-60"
                }`}
              >
                <span>ENVIAR MERDA 💩</span>
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
