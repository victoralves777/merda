-- =========================================================================
-- MERDA SE FUDEU! 💩 - SCHEMA DE MONETIZAÇÃO, USUÁRIOS E PAGAMENTOS PIX
-- =========================================================================

-- 1. TABELA DE PERFIS DOS JOGADORES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT DEFAULT 'Mais um pronto pra se foder 💩',
  avatar_url TEXT,
  coins_balance INTEGER NOT NULL DEFAULT 0, -- Começa zerado (0 moedas)
  games_played INTEGER NOT NULL DEFAULT 0,
  victories INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Pronto pra falar merda',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE TRANSAÇÕES E RECARGAS PIX (MERCADO PAGO)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL, -- Valor em centavos (Ex: 1490 = R$ 14,90)
  coins_amount INTEGER NOT NULL, -- Quantidade de moedas a creditar (Ex: 350)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  payment_method TEXT NOT NULL DEFAULT 'pix',
  external_payment_id TEXT UNIQUE, -- ID do pagamento no Mercado Pago
  qr_code TEXT, -- Código PIX Copia e Cola
  qr_code_base64 TEXT, -- Imagem do QR Code em Base64
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. HABILITAÇÃO DO SUPABASE REALTIME PARA TRANSAÇÕES E PERFIS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- 4. FUNÇÃO ATÔMICA ANTI-FRAUDE PARA PROCESSAR PAGAMENTO APROVADO
-- Utiliza locking (FOR UPDATE) e idempotência para garantir que moedas nunca sejam creditadas 2 vezes
CREATE OR REPLACE FUNCTION public.process_approved_transaction(
  p_external_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
  v_new_balance INTEGER;
BEGIN
  -- Busca a transação com trava de concorrência
  SELECT * INTO v_tx 
  FROM public.transactions 
  WHERE external_payment_id = p_external_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transação não encontrada');
  END IF;

  -- Se já foi aprovada anteriormente, retorna sucesso sem creditar novamente (idempotência)
  IF v_tx.status = 'approved' THEN
    SELECT coins_balance INTO v_new_balance FROM public.profiles WHERE id = v_tx.user_id;
    RETURN jsonb_build_object('success', true, 'message', 'Transação já havia sido aprovada', 'balance', v_new_balance);
  END IF;

  -- 1. Atualiza status da transação para approved
  UPDATE public.transactions
  SET status = 'approved',
      updated_at = now(),
      metadata = v_tx.metadata || p_metadata
  WHERE id = v_tx.id;

  -- 2. Credita atomicamente o saldo do usuário
  UPDATE public.profiles
  SET coins_balance = coins_balance + v_tx.coins_amount,
      updated_at = now()
  WHERE id = v_tx.user_id
  RETURNING coins_balance INTO v_new_balance;

  RETURN jsonb_build_object('success', true, 'message', 'Pagamento aprovado e moedas creditadas!', 'coins_added', v_tx.coins_amount, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE APÓS CADASTRO NO SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name, 
    avatar_url, 
    coins_balance
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', null),
    0 -- Começa com 0 moedas
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. POLÍTICAS DE ACESSO (Permissivas / Desabilitando RLS para facilidade de desenvolvimento)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
