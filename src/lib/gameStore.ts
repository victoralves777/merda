export interface Player {
  id: string;
  nickname: string;
  role: "admin" | "player";
  roomCode: string;
  color: string;
  joinedAt: string;
  hasAnswered?: boolean;
}

export interface RoomData {
  code: string;
  hostNickname: string;
  rounds: number;
  timeLimit: string;
  maxPlayers: number;
  createdAt: string;
  players: Player[];
  gameState?: "lobby" | "answering" | "answered";
  currentRound?: number;
  currentQuestion?: string;
}

export interface SessionData {
  roomCode: string | null;
  playerId: string | null;
  nickname: string | null;
  role: "admin" | "player" | null;
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

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// Salva e recupera salas do localStorage
export function getRoom(code: string): RoomData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`merdas_room_${code.toUpperCase()}`);
    if (!raw) return null;
    return JSON.parse(raw) as RoomData;
  } catch (e) {
    console.warn("Erro ao ler sala do localStorage:", e);
    return null;
  }
}

export function saveRoom(room: RoomData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`merdas_room_${room.code.toUpperCase()}`, JSON.stringify(room));
    // Mantém compatibilidade com a chave de room_config usada anteriormente
    localStorage.setItem("merdas_room_config", JSON.stringify(room));
    localStorage.setItem("merdas_room_code", room.code);
  } catch (e) {
    console.warn("Erro ao salvar sala no localStorage:", e);
  }
}

// Cria uma nova sala com APENAS o ADM na lista
export function createRoom(
  code: string,
  hostNickname: string,
  rounds: number,
  timeLimit: string,
  maxPlayers: number
): { room: RoomData; player: Player } {
  const playerId = `host_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanCode = code.trim().toUpperCase();
  const cleanName = hostNickname.trim();

  const hostPlayer: Player = {
    id: playerId,
    nickname: cleanName,
    role: "admin",
    roomCode: cleanCode,
    color: getAvatarColor(0),
    joinedAt: new Date().toISOString(),
    hasAnswered: false,
  };

  const newRoom: RoomData = {
    code: cleanCode,
    hostNickname: cleanName,
    rounds,
    timeLimit,
    maxPlayers,
    createdAt: new Date().toISOString(),
    players: [hostPlayer], // Contém SOMENTE o ADM
    gameState: "lobby",
    currentRound: 1,
  };

  saveRoom(newRoom);

  // Define a sessão atual do navegador
  try {
    localStorage.setItem("merdas_room_id", `local_${cleanCode}`);
    localStorage.setItem("merdas_room_code", cleanCode);
    localStorage.setItem("merdas_player_id", playerId);
    localStorage.setItem("merdas_player_name", cleanName);
    localStorage.setItem("merdas_player_role", "admin");
  } catch (e) {
    console.warn("Erro ao salvar sessão:", e);
  }

  return { room: newRoom, player: hostPlayer };
}

// Entra em uma sala existente registrando SOMENTE o novo jogador real
export function joinRoom(
  code: string,
  nickname: string
): { success: boolean; room: RoomData; player: Player; error?: string } {
  const cleanCode = code.trim().toUpperCase();
  const cleanName = nickname.trim();
  let room = getRoom(cleanCode);

  // Se a sala não existir, retorna erro sem criar nenhum host fictício
  if (!room) {
    return {
      success: false,
      error: "Essa sala caiu no buraco 🕳️",
      room: null as any,
      player: null as any,
    };
  }

  // Verifica se o jogador atual já existe na lista para evitar duplicação em refresh
  let currentSessionPlayerId: string | null = null;
  try {
    currentSessionPlayerId = localStorage.getItem("merdas_player_id");
  } catch {}

  let existingPlayerIndex = -1;
  if (currentSessionPlayerId) {
    existingPlayerIndex = room.players.findIndex((p) => p.id === currentSessionPlayerId);
  }

  let player: Player;

  if (existingPlayerIndex >= 0) {
    // Atualiza o apelido se mudou, sem duplicar
    room.players[existingPlayerIndex].nickname = cleanName;
    player = room.players[existingPlayerIndex];
  } else {
    // Cria novo jogador e adiciona à sala
    const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    player = {
      id: newPlayerId,
      nickname: cleanName,
      role: "player",
      roomCode: cleanCode,
      color: getAvatarColor(room.players.length),
      joinedAt: new Date().toISOString(),
      hasAnswered: false,
    };
    room.players.push(player);
  }

  saveRoom(room);

  // Salva sessão local
  try {
    localStorage.setItem("merdas_room_id", `local_${cleanCode}`);
    localStorage.setItem("merdas_room_code", cleanCode);
    localStorage.setItem("merdas_player_id", player.id);
    localStorage.setItem("merdas_player_name", cleanName);
    localStorage.setItem("merdas_player_role", player.role);
  } catch (e) {
    console.warn("Erro ao salvar sessão:", e);
  }

  return { success: true, room, player };
}

// Obtém a sessão atual do usuário
export function getCurrentSession(): SessionData {
  if (typeof window === "undefined") {
    return { roomCode: null, playerId: null, nickname: null, role: null };
  }
  try {
    return {
      roomCode: localStorage.getItem("merdas_room_code"),
      playerId: localStorage.getItem("merdas_player_id"),
      nickname: localStorage.getItem("merdas_player_name"),
      role: (localStorage.getItem("merdas_player_role") as "admin" | "player") || null,
    };
  } catch {
    return { roomCode: null, playerId: null, nickname: null, role: null };
  }
}

// Registra a resposta de um jogador na sala
export function recordPlayerAnswer(roomCode: string, playerId: string, answer: string): RoomData | null {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.hasAnswered = true;
  }

  saveRoom(room);

  try {
    localStorage.setItem("merdas_my_answer", answer);
    localStorage.setItem("merdas_game_state", "answered");
  } catch {}

  return room;
}

// Inicia a partida para a sala
export function startGame(roomCode: string, firstQuestion: string): RoomData | null {
  const room = getRoom(roomCode);
  if (!room) return null;

  room.gameState = "answering";
  room.currentRound = 1;
  room.currentQuestion = firstQuestion;
  // Reseta estado de resposta de todos os jogadores para a rodada
  room.players.forEach((p) => {
    p.hasAnswered = false;
  });

  saveRoom(room);

  try {
    localStorage.setItem("merdas_game_started", "true");
    localStorage.setItem("merdas_current_round", "1");
    localStorage.setItem("merdas_total_rounds", room.rounds.toString());
    localStorage.setItem("merdas_time_limit", room.timeLimit);
    localStorage.setItem("merdas_current_question", firstQuestion);
    localStorage.setItem("merdas_game_state", "answering");
    localStorage.removeItem("merdas_my_answer");
  } catch {}

  return room;
}

// Limpa a sessão ao sair
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("merdas_room_code");
    localStorage.removeItem("merdas_player_name");
    localStorage.removeItem("merdas_player_id");
    localStorage.removeItem("merdas_player_role");
    localStorage.removeItem("merdas_my_answer");
    localStorage.removeItem("merdas_game_started");
    localStorage.removeItem("merdas_game_state");
  } catch (e) {
    console.warn("Erro ao limpar sessão:", e);
  }
}
