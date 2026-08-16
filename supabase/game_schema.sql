-- =========================================================================
-- MERDA SE FUDEU! 💩 - SCHEMA DE RESPOSTAS, VOTOS E ESTADOS DE JOGO
-- =========================================================================

-- 1. TABELA DE RESPOSTAS DAS RODADAS
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, player_id, round)
);

-- 2. TABELA DE VOTOS DAS RODADAS
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  voter_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, voter_player_id, round)
);

-- 3. HABILITAÇÃO DO REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
  END IF;
END $$;

ALTER TABLE public.answers REPLICA IDENTITY FULL;
ALTER TABLE public.votes REPLICA IDENTITY FULL;

-- 4. DESABILITA RLS PARA ACESSO PÚBLICO LIVRE DO PARTY GAME
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;
