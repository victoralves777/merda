"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  UserProfile,
  getUserProfile,
  signInUser,
  signUpUser,
  signOutUser,
  getLocalAuthSession,
} from "@/lib/authService";
import { PixPaymentResponse } from "@/lib/mercadopago";

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  coinsBalance: number;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
  selectedPixPayment: PixPaymentResponse | null;
  setSelectedPixPayment: (payment: PixPaymentResponse | null) => void;
  refreshProfile: () => Promise<void>;
  addCoinsToBalance: (amount: number, newExactBalance?: number) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    pass: string,
    username: string,
    displayName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  showSuccessToast: (msg: string) => void;
  toastMessage: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [selectedPixPayment, setSelectedPixPayment] = useState<PixPaymentResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showSuccessToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const p = await getUserProfile(user.id);
      if (p) setProfile(p);
    } else {
      const local = getLocalAuthSession();
      if (local) setProfile(local);
    }
  }, [user?.id]);

  const addCoinsToBalance = useCallback(
    (amount: number, newExactBalance?: number) => {
      setProfile((prev) => {
        const currentCoins = prev?.coins_balance ?? 0;
        const finalCoins = Math.max(
          0,
          typeof newExactBalance === "number" ? newExactBalance : currentCoins + amount
        );

        const updated: UserProfile = prev
          ? { ...prev, coins_balance: finalCoins }
          : {
              id: user?.id || `local_user_${Date.now()}`,
              username: "jogador",
              display_name: "Jogador",
              coins_balance: finalCoins,
              games_played: 0,
              victories: 0,
              status: "Pronto pra falar merda",
              created_at: new Date().toISOString(),
            };

        if (typeof window !== "undefined") {
          localStorage.setItem("merdas_user_profile", JSON.stringify(updated));
        }

        // Sincroniza com Supabase se estiver conectado
        if (user?.id && isSupabaseConfigured()) {
          supabase
            .from("profiles")
            .update({ coins_balance: finalCoins })
            .eq("id", user.id)
            .then(({ error }) => {
              if (error) console.warn("[Auth] Erro ao sincronizar saldo de moedas no Supabase:", error);
            });
        }

        return updated;
      });
    },
    [user?.id]
  );

  // Carregamento inicial de sessão
  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            setUser(data.session.user);
            const p = await getUserProfile(data.session.user.id);
            setProfile(p);
          } else {
            // Fallback para sessão local se houver
            const local = getLocalAuthSession();
            if (local) setProfile(local);
          }
        } catch (e) {
          console.warn("[Auth] Erro ao recuperar sessão:", e);
        }
      } else {
        const local = getLocalAuthSession();
        if (local) setProfile(local);
      }
      setIsLoading(false);
    }

    initAuth();

    // Listener de Auth State Change do Supabase
    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const p = await getUserProfile(session.user.id);
          setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Escuta em tempo real (Realtime) atualizações do perfil e moedas
  useEffect(() => {
    if (!profile?.id || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`profile-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as UserProfile;
            setProfile((prev) => {
              if (prev && updated.coins_balance > prev.coins_balance) {
                const added = updated.coins_balance - prev.coins_balance;
                showSuccessToast(`🎉 +${added} MerdaCoins creditadas com sucesso!`);
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, showSuccessToast]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const res = await signInUser(email, pass);
    setIsLoading(false);
    if (res.success && res.profile) {
      setUser(res.user || { id: res.profile.id, email });
      setProfile(res.profile);
      showSuccessToast(`Bem-vindo de volta, ${res.profile.display_name || res.profile.username}! 💩`);
    }
    return res;
  };

  const register = async (
    email: string,
    pass: string,
    username: string,
    displayName?: string
  ) => {
    setIsLoading(true);
    const res = await signUpUser(email, pass, username, displayName);
    setIsLoading(false);
    if (res.success && res.profile) {
      setUser(res.user || { id: res.profile.id, email });
      setProfile(res.profile);
      showSuccessToast(`Conta criada com sucesso! Bem-vindo ao jogo! 💩`);
    }
    return res;
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
    showSuccessToast("Você saiu da sua conta. 👋");
  };

  const coinsBalance = profile?.coins_balance ?? 0;
  const isAuthenticated = Boolean(profile || user);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoading,
        coinsBalance,
        isShopOpen,
        setIsShopOpen,
        selectedPixPayment,
        setSelectedPixPayment,
        refreshProfile,
        addCoinsToBalance,
        login,
        register,
        logout,
        showSuccessToast,
        toastMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
