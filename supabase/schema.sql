-- =========================================================
-- MERDA SE FUDEU! 💩 - SUPABASE DATABASE SCHEMA
-- =========================================================

-- Habilita extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA rooms (com code UNIQUE NOT NULL obrigatório)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 8,
  total_rounds INTEGER NOT NULL DEFAULT 10,
  answer_time INTEGER NOT NULL DEFAULT 45,
  status TEXT NOT NULL DEFAULT 'lobby', -- 'lobby', 'playing', 'finished'
  current_round INTEGER NOT NULL DEFAULT 1,
  current_question TEXT,
  game_state TEXT NOT NULL DEFAULT 'lobby', -- 'lobby', 'answering', 'voting', 'result', 'finished'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player', -- 'admin' ou 'player'
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HABILITAÇÃO DO REALTIME NO SUPABASE (IDEMPOTENTE)
DO $$
BEGIN
  -- Adiciona rooms se não estiver na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;

  -- Adiciona players se não estiver na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  END IF;
END $$;

-- Configura replica identity para que eventos de UPDATE e DELETE enviem todas as colunas
ALTER TABLE rooms REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso anônimo/público para o Party Game
DROP POLICY IF EXISTS "Public select rooms" ON rooms;
CREATE POLICY "Public select rooms" ON rooms FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public insert rooms" ON rooms;
CREATE POLICY "Public insert rooms" ON rooms FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public update rooms" ON rooms;
CREATE POLICY "Public update rooms" ON rooms FOR UPDATE USING (TRUE);

DROP POLICY IF EXISTS "Public select players" ON players;
CREATE POLICY "Public select players" ON players FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public insert players" ON players;
CREATE POLICY "Public insert players" ON players FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public update players" ON players;
CREATE POLICY "Public update players" ON players FOR UPDATE USING (TRUE);

DROP POLICY IF EXISTS "Public delete players" ON players;
CREATE POLICY "Public delete players" ON players FOR DELETE USING (TRUE);
