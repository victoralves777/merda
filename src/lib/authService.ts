import { supabase, isSupabaseConfigured } from "./supabase";

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
  coins_balance: number;
  games_played: number;
  victories: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface UserTransaction {
  id: string;
  user_id: string;
  package_id: string;
  amount_cents: number;
  coins_amount: number;
  status: "pending" | "approved" | "rejected" | "cancelled" | string;
  payment_method: string;
  external_payment_id?: string;
  qr_code?: string;
  created_at: string;
}

// 1. REGISTRO DE USUÁRIO (SIGN UP)
export async function signUpUser(
  email: string,
  password: string,
  username: string,
  displayName?: string
): Promise<{ success: boolean; user?: any; profile?: UserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const cleanDisplayName = (displayName || username).trim();

  if (cleanUsername.length < 3) {
    return { success: false, error: "O nome de usuário deve ter pelo menos 3 caracteres." };
  }

  if (password.length < 6) {
    return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
  }

  if (isSupabaseConfigured()) {
    try {
      // 1. Cria a conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
          },
        },
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || "Erro ao registrar usuário." };
      }

      const userId = authData.user.id;

      // 2. Garante a criação do perfil na tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            username: cleanUsername,
            display_name: cleanDisplayName,
            bio: "Mais um pronto pra se foder 💩",
            coins_balance: 0, // Saldo inicial zerado
            games_played: 0,
            victories: 0,
            status: "Pronto pra falar merda",
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      const profile: UserProfile = profileData || {
        id: userId,
        username: cleanUsername,
        display_name: cleanDisplayName,
        bio: "Mais um pronto pra se foder 💩",
        coins_balance: 0,
        games_played: 0,
        victories: 0,
        status: "Pronto pra falar merda",
        created_at: new Date().toISOString(),
      };

      // Salva sessão no localStorage
      saveLocalAuthSession(profile);

      return { success: true, user: authData.user, profile };
    } catch (e: any) {
      console.error("[signUpUser] Exceção:", e);
      return { success: false, error: e.message || "Erro inesperado ao criar conta." };
    }
  }

  // Fallback Local Storage
  const mockId = `user_${Date.now()}`;
  const mockProfile: UserProfile = {
    id: mockId,
    username: cleanUsername,
    display_name: cleanDisplayName,
    bio: "Mais um pronto pra se foder 💩",
    coins_balance: 0,
    games_played: 0,
    victories: 0,
    status: "Pronto pra falar merda",
    created_at: new Date().toISOString(),
  };

  saveLocalAuthSession(mockProfile);
  return { success: true, profile: mockProfile };
}

// 2. LOGIN DE USUÁRIO (SIGN IN)
export async function signInUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; profile?: UserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError || !authData.user) {
        let msg = authError?.message || "Email ou senha incorretos.";
        if (msg.includes("Email not confirmed")) {
          msg = "Email ainda não confirmado! Desative a confirmação de email no Supabase ou confirme seu email.";
        } else if (msg.includes("Invalid login credentials")) {
          msg = "Email ou senha incorretos. Verifique seus dados ou se o email foi confirmado no Supabase.";
        }
        return {
          success: false,
          error: msg,
        };
      }

      // Busca o perfil do usuário
      const profile = await getUserProfile(authData.user.id);
      if (profile) {
        saveLocalAuthSession(profile);
      }

      return { success: true, user: authData.user, profile: profile || undefined };
    } catch (e: any) {
      console.error("[signInUser] Exceção:", e);
      return { success: false, error: e.message || "Erro ao conectar." };
    }
  }

  // Fallback Local
  const localProfile = getLocalAuthSession();
  if (localProfile) {
    return { success: true, profile: localProfile };
  }

  return { success: false, error: "Nenhum usuário cadastrado no modo offline." };
}

// 3. LOGOUT (SIGN OUT)
export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("[signOutUser] Erro ao deslogar:", e);
    }
  }
  clearLocalAuthSession();
}

// 4. BUSCAR PERFIL
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        return data as UserProfile;
      }
    } catch (e) {
      console.error("[getUserProfile] Erro:", e);
    }
  }

  return getLocalAuthSession();
}

// 5. ATUALIZAR PERFIL
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message || "Erro ao atualizar perfil." };
      }

      saveLocalAuthSession(data as UserProfile);
      return { success: true, profile: data as UserProfile };
    } catch (e: any) {
      return { success: false, error: e.message || "Erro inesperado ao salvar." };
    }
  }

  const current = getLocalAuthSession();
  if (current) {
    const updated = { ...current, ...updates };
    saveLocalAuthSession(updated);
    return { success: true, profile: updated };
  }

  return { success: false, error: "Usuário não encontrado." };
}

// 6. BUSCAR TRANSAÇÕES DO USUÁRIO
export async function getUserTransactions(userId: string): Promise<UserTransaction[]> {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        return data as UserTransaction[];
      }
    } catch (e) {
      console.error("[getUserTransactions] Erro:", e);
    }
  }

  return [];
}

// 7. COMPRIMIR E PREPARAR AVATAR NO CLIENT (CANVAS 256x256 WebP/JPEG)
export function processAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validação de tipo MIME
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return reject(new Error("Formato inválido! Envie uma imagem PNG, JPG ou WEBP."));
    }

    // Validação de tamanho (máximo 5MB original)
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error("A imagem deve ter no máximo 5MB."));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Erro ao processar imagem"));

        // Redimensiona para avatar quadrado otimizado 256x256
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        // Centraliza e corta proporcionalmente
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        // Gera WebP ou JPEG comprimido de altíssima qualidade e leve (<50KB)
        const base64Url = canvas.toDataURL("image/webp", 0.85);
        resolve(base64Url);
      };
      img.onerror = () => reject(new Error("Falha ao carregar imagem."));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
    reader.readAsDataURL(file);
  });
}

// Helpers de Sessão Local
function saveLocalAuthSession(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("merdas_user_profile", JSON.stringify(profile));
    localStorage.setItem("merdas_player_name", profile.display_name || profile.username);
  } catch {}
}

export function getLocalAuthSession(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("merdas_user_profile");
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function clearLocalAuthSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("merdas_user_profile");
  } catch {}
}
