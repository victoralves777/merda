-- =========================================================================
-- CORREÇÃO DEFINITIVA DAS CONTAS DE TESTE NO SUPABASE (AUTH + IDENTITIES)
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
  -- Senha 'free123'
  v_encrypted_pw := crypt('free123', gen_salt('bf'));

  FOREACH v_user SLICE 1 IN ARRAY v_users
  LOOP
    -- 1. Limpa registros anteriores corrompidos
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user[1];
    
    IF v_user_id IS NOT NULL THEN
      DELETE FROM auth.identities WHERE user_id = v_user_id;
      DELETE FROM public.profiles WHERE id = v_user_id;
      DELETE FROM auth.users WHERE id = v_user_id;
    END IF;

    v_user_id := gen_random_uuid();

    -- 2. Insere no auth.users completo
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_user[1],
      v_encrypted_pw,
      now(),
      NULL,
      encode(gen_random_bytes(32), 'hex'),
      now(),
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', v_user[2], 'display_name', v_user[3]),
      FALSE,
      now(),
      now(),
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      0,
      NULL,
      NULL,
      NULL,
      FALSE,
      NULL
    );

    -- 3. Insere obrigatoriamente no auth.identities (necessário para o Supabase GoTrue encontrar o usuário)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_user[1]),
      'email',
      v_user[1],
      now(),
      now(),
      now()
    );

    -- 4. Insere o perfil com 1000 moedas de saldo
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
      1000,
      0,
      0,
      'Pronto pra falar merda',
      now(),
      now()
    );

  END LOOP;
END $$;
