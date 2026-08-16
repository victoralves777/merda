-- =========================================================================
-- MERDA SE FUDEU! 💩 - CRIAÇÃO DE 10 CONTAS DE TESTE COM 1000 MOEDAS
-- Senha de todas as contas: free123 (ou free)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_users TEXT[][] := ARRAY[
    ['free01@pato.com', 'pato01', 'Pato 01'],
    ['free02@pato.com', 'pato02', 'Pato 02'],
    ['free03@pato.com', 'pato03', 'Pato 03'],
    ['free04@pato.com', 'pato04', 'Pato 04'],
    ['free05@pato.com', 'pato05', 'Pato 05'],
    ['free06@pato.com', 'pato06', 'Pato 06'],
    ['free07@pato.com', 'pato07', 'Pato 07'],
    ['free08@pato.com', 'pato08', 'Pato 08'],
    ['free09@pato.com', 'pato09', 'Pato 09'],
    ['free10@pato.com', 'pato10', 'Pato 10']
  ];
  v_user TEXT[];
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Criptografa a senha 'free123'
  v_encrypted_pw := crypt('free123', gen_salt('bf'));

  FOREACH v_user SLICE 1 IN ARRAY v_users
  LOOP
    -- 1. Verifica se o usuário já existe no auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user[1];

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      
      -- Insere no auth.users com email já confirmado
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_user[1],
        v_encrypted_pw,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('username', v_user[2], 'display_name', v_user[3]),
        now(),
        now(),
        encode(gen_random_bytes(32), 'hex')
      );
    ELSE
      -- Atualiza a senha e confirma o email se já existia
      UPDATE auth.users
      SET encrypted_password = v_encrypted_pw,
          email_confirmed_at = now()
      WHERE id = v_user_id;
    END IF;

    -- 2. Insere/Atualiza o perfil na tabela public.profiles com 1000 MOEDAS
    INSERT INTO public.profiles (
      id,
      username,
      display_name,
      bio,
      coins_balance,
      games_played,
      victories,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user[2],
      v_user[3],
      'Mais um pronto pra se foder 💩',
      1000, -- 1000 Moedas de Saldo
      0,
      0,
      'Pronto pra falar merda',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET coins_balance = 1000,
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        updated_at = now();

  END LOOP;
END $$;
