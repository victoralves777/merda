import { supabase, isSupabaseConfigured } from "./supabase";
import {
  createRoom as createLocalRoom,
  joinRoom as joinLocalRoom,
  getRoom as getLocalRoom,
  saveRoom as saveLocalRoom,
  startGame as startLocalGame,
  clearSession as clearLocalSession,
  type Player as LocalPlayer,
  type RoomData as LocalRoomData,
} from "./gameStore";

export interface SupabaseRoom {
  id: string;
  code: string;
  max_players: number;
  total_rounds: number;
  answer_time: number;
  status: "lobby" | "playing" | "finished" | string;
  current_round: number;
  current_question: string | null;
  game_state: "lobby" | "answering" | "voting" | "result" | "finished" | string;
  created_at: string;
}

export interface SupabasePlayer {
  id: string;
  room_id: string;
  nickname: string;
  role: "admin" | "player";
  is_online: boolean;
  joined_at: string;
  color?: string;
}

const AVATAR_COLORS = [
  "from-amber-400 to-yellow-600",
  "from-pink-500 to-rose-600",
  "from-emerald-400 to-teal-600",
  "from-cyan-400 to-blue-600",
  "from-fuchsia-400 to-purple-600",
  "from-lime-400 to-green-600",
  "from-violet-400 to-indigo-600",
  "from-rose-400 to-red-600",
  "from-sky-400 to-blue-500",
  "from-orange-400 to-amber-600",
];

export function getPlayerColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// 1. CRIAR SALA NO SUPABASE (ADM)
export async function createSupabaseRoom(
  code: string,
  hostNickname: string,
  rounds: number,
  timeLimit: string,
  maxPlayers: number,
  hostCoins: number = 0
): Promise<{ success: boolean; room?: SupabaseRoom; player?: SupabasePlayer; error?: string; requiredCoins?: number }> {
  // Validação de Caução de Segurança (5 moedas por rodada)
  const requiredCoins = rounds * 5;
  if (hostCoins < requiredCoins) {
    return {
      success: false,
      error: `Caução de segurança necessária: para uma sala de ${rounds} rodadas, você precisa ter pelo menos ${requiredCoins} moedas em conta (garantia caso perca rodadas). Suas moedas NÃO serão gastas na entrada! Você só perde se falar a pior merda da rodada. Seu saldo atual é ${hostCoins} moedas.`,
      requiredCoins,
    };
  }

  // Limpa preventivamente qualquer sessão anterior no localStorage
  clearLocalSession();

  let cleanCode = code.trim().toUpperCase();
  const cleanHost = hostNickname.trim();
  const answerTimeSec = parseInt(timeLimit.replace("s", ""), 10) || 45;

  if (isSupabaseConfigured()) {
    try {
      // Garante que o código é único no banco
      const { data: existingCodeRoom } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", cleanCode)
        .maybeSingle();

      if (existingCodeRoom) {
        // Se por acaso já existir, gera um sufixo ou novo código
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let newCode = "";
        for (let i = 0; i < 5; i++) {
          newCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        cleanCode = newCode;
      }

      // 1. Insere a sala no Supabase
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .insert({
          code: cleanCode,
          max_players: maxPlayers,
          total_rounds: rounds,
          answer_time: answerTimeSec,
          status: "lobby",
          current_round: 1,
          current_question: null,
          game_state: "lobby",
        })
        .select()
        .single();

      if (roomError || !roomData) {
        console.error("[createSupabaseRoom] Erro ao criar sala:", roomError);
        return { success: false, error: roomError?.message || "Erro ao criar sala" };
      }

      // 2. Insere o jogador ADM associado ao UUID da nova sala
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({
          room_id: roomData.id,
          nickname: cleanHost,
          role: "admin",
          is_online: true,
        })
        .select()
        .single();

      if (playerError || !playerData) {
        console.error("[createSupabaseRoom] Erro ao criar jogador ADM:", playerError);
        return { success: false, error: playerError?.message || "Erro ao criar jogador ADM" };
      }

      // 3. Salva a nova sessão limpa no localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("merdas_room_id", roomData.id);
        localStorage.setItem("merdas_room_code", roomData.code);
        localStorage.setItem("merdas_player_id", playerData.id);
        localStorage.setItem("merdas_player_name", playerData.nickname);
        localStorage.setItem("merdas_player_role", "admin");
        localStorage.setItem(
          "merdas_room_config",
          JSON.stringify({
            id: roomData.id,
            code: roomData.code,
            hostNickname: cleanHost,
            rounds: roomData.total_rounds,
            timeLimit: `${roomData.answer_time}s`,
            maxPlayers: roomData.max_players,
          })
        );
      }

      return {
        success: true,
        room: roomData as SupabaseRoom,
        player: { ...playerData, color: getPlayerColor(0) } as SupabasePlayer,
      };
    } catch (err: any) {
      console.error("[createSupabaseRoom] Exceção:", err);
      return { success: false, error: err.message || "Erro desconhecido ao criar sala" };
    }
  }

  // Fallback Local
  const { room, player } = createLocalRoom(cleanCode, cleanHost, rounds, timeLimit, maxPlayers);
  if (typeof window !== "undefined") {
    localStorage.setItem("merdas_room_id", `local_${cleanCode}`);
  }
  return {
    success: true,
    room: {
      id: `local_${room.code}`,
      code: room.code,
      max_players: room.maxPlayers,
      total_rounds: room.rounds,
      answer_time: parseInt(room.timeLimit.replace("s", ""), 10) || 45,
      status: "lobby",
      current_round: 1,
      current_question: null,
      game_state: "lobby",
      created_at: room.createdAt,
    },
    player: {
      id: player.id,
      room_id: `local_${room.code}`,
      nickname: player.nickname,
      role: player.role,
      is_online: true,
      joined_at: player.joinedAt,
      color: player.color,
    },
  };
}

// 2. ENTRAR NA SALA NO SUPABASE (JOGADOR)
export async function joinSupabaseRoom(
  code: string,
  nickname: string,
  playerCoins: number = 0
): Promise<{ success: boolean; room?: SupabaseRoom; player?: SupabasePlayer; error?: string; requiredCoins?: number }> {
  // Limpa preventivamente qualquer sessão anterior no localStorage
  clearLocalSession();

  const cleanCode = code.trim().toUpperCase();
  const cleanNick = nickname.trim();

  if (isSupabaseConfigured()) {
    try {
      // 1. Busca a sala pelo código exato no Supabase
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", cleanCode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roomError || !roomData) {
        console.warn("[joinSupabaseRoom] Sala não encontrada para o código:", cleanCode, roomError);
        return { success: false, error: "Essa sala caiu no buraco 🕳️" };
      }

      // 2. Verifica se a partida já começou
      if (roomData.status !== "lobby") {
        return { success: false, error: "A partida já começou nesta sala! 💩" };
      }

      // 3. Validação de Caução de Segurança (5 moedas por rodada)
      const rounds = roomData.total_rounds || 10;
      const requiredCoins = rounds * 5;
      if (playerCoins < requiredCoins) {
        return {
          success: false,
          error: `Caução de segurança necessária: esta sala tem ${rounds} rodadas e exige pelo menos ${requiredCoins} moedas em conta (garantia caso você perca rodadas). Suas moedas NÃO serão gastas para entrar! Você só perde se falar a pior merda. Seu saldo atual é ${playerCoins} moedas.`,
          requiredCoins,
        };
      }

      // 3. Verifica capacidade de jogadores online
      const { data: currentPlayers, error: countError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomData.id)
        .eq("is_online", true);

      if (!countError && currentPlayers && currentPlayers.length >= roomData.max_players) {
        return { success: false, error: "A sala está cheia! Máximo de vítimas atingido. 🚪" };
      }

      // 4. Insere o novo jogador real associado ao UUID da sala encontrada
      const { data: newPlayer, error: insertError } = await supabase
        .from("players")
        .insert({
          room_id: roomData.id,
          nickname: cleanNick,
          role: "player",
          is_online: true,
        })
        .select()
        .single();

      if (insertError || !newPlayer) {
        console.error("[joinSupabaseRoom] Erro ao inserir jogador:", insertError);
        return { success: false, error: insertError?.message || "Erro ao entrar na sala" };
      }

      // 5. Salva a sessão no localStorage com o UUID real da sala
      if (typeof window !== "undefined") {
        localStorage.setItem("merdas_room_id", roomData.id);
        localStorage.setItem("merdas_room_code", roomData.code);
        localStorage.setItem("merdas_player_id", newPlayer.id);
        localStorage.setItem("merdas_player_name", newPlayer.nickname);
        localStorage.setItem("merdas_player_role", newPlayer.role);
        localStorage.setItem(
          "merdas_room_config",
          JSON.stringify({
            id: roomData.id,
            code: roomData.code,
            rounds: roomData.total_rounds,
            timeLimit: `${roomData.answer_time}s`,
            maxPlayers: roomData.max_players,
          })
        );
      }

      return {
        success: true,
        room: roomData as SupabaseRoom,
        player: { ...newPlayer, color: getPlayerColor(currentPlayers?.length || 1) } as SupabasePlayer,
      };
    } catch (err: any) {
      console.error("[joinSupabaseRoom] Exceção:", err);
      return { success: false, error: "Essa sala caiu no buraco 🕳️" };
    }
  }

  // Fallback Local
  const localResult = joinLocalRoom(cleanCode, cleanNick);
  if (!localResult.success || !localResult.room) {
    return { success: false, error: localResult.error || "Essa sala caiu no buraco 🕳️" };
  }

  return {
    success: true,
    room: {
      id: `local_${localResult.room.code}`,
      code: localResult.room.code,
      max_players: localResult.room.maxPlayers,
      total_rounds: localResult.room.rounds,
      answer_time: parseInt(localResult.room.timeLimit.replace("s", ""), 10) || 45,
      status: "lobby",
      current_round: 1,
      current_question: null,
      game_state: "lobby",
      created_at: localResult.room.createdAt,
    },
    player: {
      id: localResult.player.id,
      room_id: `local_${localResult.room.code}`,
      nickname: localResult.player.nickname,
      role: localResult.player.role,
      is_online: true,
      joined_at: localResult.player.joinedAt,
      color: localResult.player.color,
    },
  };
}

// 3. BUSCAR SALA E JOGADORES BASEADO EXCLUSIVAMENTE NO UUID DA SALA
export async function fetchRoomAndPlayers(
  roomId?: string | null
): Promise<{ room?: SupabaseRoom; players: SupabasePlayer[]; error?: string }> {
  if (isSupabaseConfigured() && roomId && !roomId.startsWith("local_")) {
    try {
      // 1. Busca a sala pelo UUID
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (roomError || !roomData) {
        console.error("[fetchRoomAndPlayers] Sala não encontrada pelo UUID:", roomId, roomError);
        return { players: [], error: "Sala não encontrada no buraco 🕳️" };
      }

      // 2. Busca todos os jogadores online daquela room_id
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomData.id)
        .eq("is_online", true)
        .order("joined_at", { ascending: true });

      if (playersError) {
        console.error("[fetchRoomAndPlayers] Erro ao buscar jogadores:", playersError);
        return { room: roomData as SupabaseRoom, players: [], error: "Erro ao carregar jogadores." };
      }

      const enrichedPlayers: SupabasePlayer[] = (playersData || []).map((p, idx) => ({
        ...p,
        color: getPlayerColor(idx),
      }));

      return { room: roomData as SupabaseRoom, players: enrichedPlayers };
    } catch (e: any) {
      console.error("[fetchRoomAndPlayers] Exceção:", e);
      return { players: [], error: "Erro de conexão ao carregar a sala." };
    }
  }

  // Fallback Local
  const code = typeof window !== "undefined" ? localStorage.getItem("merdas_room_code") || "FDP69" : "FDP69";
  const localRoom = getLocalRoom(code);
  if (localRoom) {
    const enriched: SupabasePlayer[] = localRoom.players.map((p, idx) => ({
      id: p.id,
      room_id: `local_${localRoom.code}`,
      nickname: p.nickname,
      role: p.role,
      is_online: true,
      joined_at: p.joinedAt,
      color: p.color || getPlayerColor(idx),
    }));
    return {
      room: {
        id: `local_${localRoom.code}`,
        code: localRoom.code,
        max_players: localRoom.maxPlayers,
        total_rounds: localRoom.rounds,
        answer_time: parseInt(localRoom.timeLimit.replace("s", ""), 10) || 45,
        status: (localRoom.gameState === "answering" ? "playing" : "lobby") as any,
        current_round: localRoom.currentRound || 1,
        current_question: localRoom.currentQuestion || null,
        game_state: localRoom.gameState || "lobby",
        created_at: localRoom.createdAt,
      },
      players: enriched,
    };
  }

  return { players: [], error: "Sala não encontrada localmente." };
}

export const fetchRoomPlayers = fetchRoomAndPlayers;

// 4. BUSCAR APENAS A SALA PELO UUID
export async function fetchRoom(roomId?: string | null): Promise<SupabaseRoom | null> {
  if (isSupabaseConfigured() && roomId && !roomId.startsWith("local_")) {
    try {
      const { data: roomData, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (!error && roomData) {
        return roomData as SupabaseRoom;
      }
    } catch (e) {
      console.error("[fetchRoom] Erro ao buscar sala:", e);
    }
  }

  // Fallback Local
  const code = typeof window !== "undefined" ? localStorage.getItem("merdas_room_code") || "FDP69" : "FDP69";
  const localRoom = getLocalRoom(code);
  if (localRoom) {
    return {
      id: `local_${localRoom.code}`,
      code: localRoom.code,
      max_players: localRoom.maxPlayers,
      total_rounds: localRoom.rounds,
      answer_time: parseInt(localRoom.timeLimit.replace("s", ""), 10) || 45,
      status: (localRoom.gameState === "answering" ? "playing" : "lobby") as any,
      current_round: localRoom.currentRound || 1,
      current_question: localRoom.currentQuestion || null,
      game_state: localRoom.gameState || "lobby",
      created_at: localRoom.createdAt,
    };
  }

  return null;
}

// 5. INICIAR A PARTIDA NO SUPABASE (SOMENTE ADM)
export async function startSupabaseGame(
  roomId: string,
  question: string,
  role?: string
): Promise<{ success: boolean; room?: SupabaseRoom; error?: string }> {
  const activeRole = role || (typeof window !== "undefined" ? localStorage.getItem("merdas_player_role") : "admin");

  if (activeRole !== "admin") {
    return { success: false, error: "Apenas o Dono da Sala (ADM) pode iniciar a partida! 👑" };
  }

  if (isSupabaseConfigured() && roomId && !roomId.startsWith("local_")) {
    try {
      const { data: updatedRoom, error } = await supabase
        .from("rooms")
        .update({
          status: "playing",
          game_state: "answering",
          current_round: 1,
          current_question: question,
        })
        .eq("id", roomId)
        .select()
        .single();

      if (error || !updatedRoom) {
        console.error("[startSupabaseGame] Erro:", error);
        return { success: false, error: error?.message || "Erro ao iniciar partida" };
      }

      return { success: true, room: updatedRoom as SupabaseRoom };
    } catch (e: any) {
      console.error("[startSupabaseGame] Exceção:", e);
      return { success: false, error: e.message || "Erro ao iniciar partida" };
    }
  }

  // Fallback Local
  const code = typeof window !== "undefined" ? localStorage.getItem("merdas_room_code") || "FDP69" : "FDP69";
  startLocalGame(code, question);
  return {
    success: true,
    room: {
      id: `local_${code}`,
      code,
      max_players: 8,
      total_rounds: 10,
      answer_time: 45,
      status: "playing",
      current_round: 1,
      current_question: question,
      game_state: "answering",
      created_at: new Date().toISOString(),
    },
  };
}

// 6. SAIR DA SALA NO SUPABASE
export async function leaveSupabaseRoom(playerId?: string | null): Promise<void> {
  const activePlayerId =
    playerId || (typeof window !== "undefined" ? localStorage.getItem("merdas_player_id") : null);

  if (isSupabaseConfigured() && activePlayerId && !activePlayerId.startsWith("host_") && !activePlayerId.startsWith("player_")) {
    try {
      await supabase
        .from("players")
        .update({ is_online: false })
        .eq("id", activePlayerId);
    } catch (e) {
      console.warn("[leaveSupabaseRoom] Erro ao marcar saída:", e);
    }
  }

  clearLocalSession();
}

// 7. INSCREVER NO REALTIME DO SUPABASE EXCLUSIVAMENTE POR ROOM_ID (UUID)
export function subscribeToRoom(
  roomId: string,
  callbacks: {
    onInsert?: (player: SupabasePlayer) => void;
    onUpdate?: (player: SupabasePlayer) => void;
    onDelete?: (playerId: string) => void;
    onPlayersChange?: () => void;
    onRoomChange?: (room: SupabaseRoom) => void;
  }
): () => void {
  if (!isSupabaseConfigured() || !roomId || roomId.startsWith("local_")) {
    return () => {};
  }

  const channelName = `players-room-${roomId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log("Player realtime event:", payload);

        if (payload.eventType === "INSERT" && payload.new) {
          callbacks.onInsert?.(payload.new as SupabasePlayer);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          callbacks.onUpdate?.(payload.new as SupabasePlayer);
        } else if (payload.eventType === "DELETE" && payload.old) {
          callbacks.onDelete?.(payload.old.id);
        }

        callbacks.onPlayersChange?.();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new) {
          callbacks.onRoomChange?.(payload.new as SupabaseRoom);
        }
      }
    )
    .subscribe((status) => {
      console.log("Players realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export interface SupabaseAnswer {
  id: string;
  room_id: string;
  player_id: string;
  round: number;
  answer_text: string;
  player_nickname?: string;
  votes_count?: number;
  created_at?: string;
}

export interface SupabaseVote {
  id: string;
  room_id: string;
  voter_player_id: string;
  answer_id: string;
  round: number;
  created_at?: string;
}

// 8. ENVIAR RESPOSTA DA RODADA
export async function submitRoundAnswer(
  roomId: string,
  playerId: string,
  round: number,
  answerText: string
): Promise<{ success: boolean; answer?: SupabaseAnswer; error?: string }> {
  if (isSupabaseConfigured() && roomId && !roomId.startsWith("local_")) {
    try {
      const { data, error } = await supabase
        .from("answers")
        .upsert(
          {
            room_id: roomId,
            player_id: playerId,
            round,
            answer_text: answerText.trim(),
          },
          { onConflict: "room_id,player_id,round" }
        )
        .select()
        .single();

      if (error) {
        console.warn("[submitRoundAnswer] Erro ao gravar resposta no Supabase:", error);
      } else if (data) {
        return { success: true, answer: data };
      }
    } catch (e: any) {
      console.error("[submitRoundAnswer] Exceção:", e);
    }
  }

  // Armazenamento local
  const mockAnswer: SupabaseAnswer = {
    id: `ans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    room_id: roomId,
    player_id: playerId,
    round,
    answer_text: answerText.trim(),
  };

  try {
    const key = `merdas_answers_${roomId}_r${round}`;
    const raw = localStorage.getItem(key);
    const list: SupabaseAnswer[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((a) => a.player_id !== playerId);
    filtered.push(mockAnswer);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {}

  return { success: true, answer: mockAnswer };
}

// 9. BUSCAR RESPOSTAS DA RODADA (COM NOMES DOS JOGADORES)
export async function fetchRoundAnswers(
  roomId: string,
  round: number
): Promise<SupabaseAnswer[]> {
  if (isSupabaseConfigured() && roomId && !roomId.startsWith("local_")) {
    try {
      const { data, error } = await supabase
        .from("answers")
        .select("*, players(nickname)")
        .eq("room_id", roomId)
        .eq("round", round);

      if (!error && data) {
        return data.map((a: any) => ({
          id: a.id,
          room_id: a.room_id,
          player_id: a.player_id,
          round: a.round,
          answer_text: a.answer_text,
          player_nickname: a.players?.nickname || "Anônimo",
          created_at: a.created_at,
        }));
      }
    } catch (e) {
      console.warn("[fetchRoundAnswers] Exceção:", e);
    }
  }

  // Fallback local
  try {
    const key = `merdas_answers_${roomId}_r${round}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 10. ENVIAR VOTO NA RESPOSTA
export async function submitRoundVote(
  roomId: string,
  voterPlayerId: string,
  answerId: string,
  round: number
): Promise<{ success: boolean; vote?: SupabaseVote; error?: string }> {
  if (isSupabaseConfigured() && roomId && !roomId.startsWith("local_")) {
    try {
      const { data, error } = await supabase
        .from("votes")
        .upsert(
          {
            room_id: roomId,
            voter_player_id: voterPlayerId,
            answer_id: answerId,
            round,
          },
          { onConflict: "room_id,voter_player_id,round" }
        )
        .select()
        .single();

      if (error) {
        console.warn("[submitRoundVote] Erro ao registrar voto no Supabase:", error);
      } else if (data) {
        return { success: true, vote: data };
      }
    } catch (e: any) {
      console.error("[submitRoundVote] Exceção:", e);
    }
  }

  // Fallback local
  const mockVote: SupabaseVote = {
    id: `vote_${Date.now()}`,
    room_id: roomId,
    voter_player_id: voterPlayerId,
    answer_id: answerId,
    round,
  };

  try {
    const key = `merdas_votes_${roomId}_r${round}`;
    const raw = localStorage.getItem(key);
    const list: SupabaseVote[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((v) => v.voter_player_id !== voterPlayerId);
    filtered.push(mockVote);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {}

  return { success: true, vote: mockVote };
}

// 11. BUSCAR VOTOS DA RODADA
export async function fetchRoundVotes(
  roomId: string,
  round: number
): Promise<SupabaseVote[]> {
  if (isSupabaseConfigured() && roomId && !roomId.startsWith("local_")) {
    try {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .eq("room_id", roomId)
        .eq("round", round);

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn("[fetchRoundVotes] Exceção:", e);
    }
  }

  // Fallback local
  try {
    const key = `merdas_votes_${roomId}_r${round}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 12. ATUALIZAR ESTADO DO JOGO NA SALA (answering -> voting -> result -> finished)
export async function updateRoomGameState(
  roomId: string,
  gameState: "answering" | "voting" | "result" | "finished",
  extraUpdates?: Partial<SupabaseRoom>
): Promise<boolean> {
  if (isSupabaseConfigured() && roomId && !roomId.startsWith("local_")) {
    try {
      const payload: any = { game_state: gameState, ...extraUpdates };
      const { error } = await supabase.from("rooms").update(payload).eq("id", roomId);
      if (!error) return true;
      console.warn("[updateRoomGameState] Erro ao atualizar game_state no Supabase:", error);
    } catch (e) {
      console.error("[updateRoomGameState] Exceção:", e);
    }
  }

  return false;
}

// 13. INSCREVER NO REALTIME COMPLETO DO JOGO (ROOMS, PLAYERS, ANSWERS, VOTES)
export function subscribeToGame(
  roomId: string,
  callbacks: {
    onRoomChange?: (room: SupabaseRoom) => void;
    onPlayersChange?: (players: SupabasePlayer[]) => void;
    onAnswersChange?: () => void;
    onVotesChange?: () => void;
  }
): () => void {
  if (!isSupabaseConfigured() || !roomId || roomId.startsWith("local_")) {
    return () => {};
  }

  const channelName = `game-room-${roomId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new) {
          callbacks.onRoomChange?.(payload.new as SupabaseRoom);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "answers",
        filter: `room_id=eq.${roomId}`,
      },
      () => {
        callbacks.onAnswersChange?.();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `room_id=eq.${roomId}`,
      },
      () => {
        callbacks.onVotesChange?.();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
