-- =========================================================================
-- CORREÇÃO DEFINITIVA DAS CONTAS DE TESTE (SEM CONFLITO DE CHAVES)
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
  -- Senha padrão: free123
  v_encrypted_pw := crypt('free123', gen_salt('bf'));

  FOREACH v_user SLICE 1 IN ARRAY v_users
  LOOP
    -- 1. Remove qualquer registro existente por email ou username para evitar duplicação
    DELETE FROM public.profiles WHERE username = v_user[2];
    
    FOR v_user_id IN (SELECT id FROM auth.users WHERE email = v_user[1])
    LOOP
      DELETE FROM auth.identities WHERE user_id = v_user_id;
      DELETE FROM public.profiles WHERE id = v_user_id;
      DELETE FROM auth.users WHERE id = v_user_id;
    END LOOP;

    v_user_id := gen_random_uuid();

    -- 2. Insere no auth.users
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
      is_super_admin,
      created_at,
      updated_at,
      email_change_confirm_status,
      is_sso_user
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
      FALSE,
      now(),
      now(),
      0,
      FALSE
    );

    -- 3. Insere no auth.identities (vital para o GoTrue autenticar)
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

    -- 4. Insere no public.profiles com 1000 moedas de saldo
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
    )
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        coins_balance = 1000,
        updated_at = now();

  END LOOP;
END $$;
