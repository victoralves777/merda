"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Camera,
  Coins,
  Plus,
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  Loader2,
  Sparkles,
  Shield,
  QrCode,
} from "lucide-react";
import { SurrealDecorations } from "@/components/SurrealDecorations";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateUserProfile,
  processAvatarImage,
  getUserTransactions,
  UserTransaction,
} from "@/lib/authService";

export default function PerfilPage() {
  const router = useRouter();
  const { profile, user, isAuthenticated, isLoading, refreshProfile, logout, setIsShopOpen, showSuccessToast } =
    useAuth();

  // Estados de edição do perfil
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [statusText, setStatusText] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "historico">("perfil");
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sincroniza dados do perfil
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || profile.username || "");
      setBio(profile.bio || "");
      setStatusText(profile.status || "Pronto pra falar merda");
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  // Carrega histórico de transações
  useEffect(() => {
    async function loadTx() {
      if (profile?.id) {
        setIsLoadingTx(true);
        const txs = await getUserTransactions(profile.id);
        setTransactions(txs);
        setIsLoadingTx(false);
      }
    }
    if (activeTab === "historico") {
      loadTx();
    }
  }, [activeTab, profile?.id]);

  // Salvar alterações
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSaving(true);
    const res = await updateUserProfile(profile.id, {
      display_name: displayName.trim(),
      bio: bio.trim(),
      status: statusText.trim(),
      avatar_url: avatarPreview,
    });

    setIsSaving(false);
    if (res.success) {
      await refreshProfile();
      showSuccessToast("Perfil atualizado com sucesso! ✨");
    }
  };

  // Upload e corte automático de foto de perfil
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setIsUploadingAvatar(true);
    try {
      // Processa e redimensiona a imagem para avatar 256x256 otimizado
      const optimizedBase64 = await processAvatarImage(file);
      setAvatarPreview(optimizedBase64);

      // Salva imediatamente no perfil
      await updateUserProfile(profile.id, { avatar_url: optimizedBase64 });
      await refreshProfile();
      showSuccessToast("Foto de perfil atualizada! 📸");
    } catch (err: any) {
      alert(err.message || "Erro ao processar imagem.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-surreal-grid text-purple-300">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col bg-surreal-grid overflow-x-hidden text-slate-100 pb-16">
      <SurrealDecorations />

      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col px-4 pt-4">
        {/* TOPO: VOLTAR + TÍTULO + LOGOUT */}
        <header className="w-full mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            aria-label="Voltar para a página inicial"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-fredoka)] flex items-center gap-2">
            <span>PERFIL DO JOGADOR</span>
            <span className="text-lg">💩</span>
          </h1>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Sair da Conta"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* CARD DO AVATAR & IDENTIDADE */}
        <section className="w-full rounded-3xl bg-[#14082c]/90 border-2 border-purple-500/40 p-4 sm:p-5 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md mb-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-pink-500/15 blur-xl pointer-events-none" />

          {/* AVATAR COM BOTÃO DE UPLOAD */}
          <div className="relative group my-2">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-600 to-lime-400 p-1 shadow-[0_0_25px_rgba(236,72,153,0.4)]">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={displayName || "Avatar"}
                  className="w-full h-full object-cover rounded-[22px]"
                />
              ) : (
                <div className="w-full h-full rounded-[22px] bg-[#1a0b36] flex items-center justify-center text-3xl font-black font-[family-name:var(--font-fredoka)] text-white">
                  {(displayName || profile?.username || "A").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* BOTÃO DA CÂMERA */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-[0_0_15px_rgba(57,255,20,0.6)] cursor-pointer transition-transform active:scale-90"
              title="Trocar Foto de Perfil"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Camera className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>

            {/* Input escondido */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
          </div>

          <h2 className="text-xl font-black font-[family-name:var(--font-fredoka)] text-white mt-1">
            {displayName || profile?.username || "Jogador Misterioso"}
          </h2>
          <span className="text-xs font-mono text-pink-400 font-bold -mt-0.5">
            @{profile?.username || "anonimo"}
          </span>

          <p className="text-xs text-purple-300/80 italic mt-2 max-w-xs line-clamp-2">
            “{bio || "Mais um pronto pra se foder 💩"}”
          </p>

          {/* BADGE DE CARTEIRA COM BOTÃO DE RECARGA */}
          <div className="w-full mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 via-purple-950 to-amber-950/80 border border-amber-400/50 flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
                💩
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">
                  SALDO EM CARTEIRA
                </span>
                <span className="text-lg font-mono font-black text-yellow-300 flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  {profile?.coins_balance ?? 0} Moedas
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsShopOpen(true)}
              className="py-2 px-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-[family-name:var(--font-fredoka)] font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(57,255,20,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Recarregar</span>
            </button>
          </div>
        </section>

        {/* ESTATÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="p-3 rounded-2xl bg-[#14082c]/80 border border-purple-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 flex items-center justify-center text-purple-300">
              <Flame className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <span className="text-[10px] text-purple-300 uppercase font-bold block">Partidas</span>
              <span className="text-lg font-mono font-black text-white">
                {profile?.games_played ?? 0}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#14082c]/80 border border-purple-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 flex items-center justify-center text-purple-300">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <span className="text-[10px] text-purple-300 uppercase font-bold block">Vitórias</span>
              <span className="text-lg font-mono font-black text-lime-300">
                {profile?.victories ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS: EDITAR PERFIL vs HISTÓRICO DE RECARGAS */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-purple-950/60 border border-purple-500/30 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("perfil")}
            className={`py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === "perfil"
                ? "bg-purple-800 text-white shadow-sm"
                : "text-purple-300 hover:text-white"
            }`}
          >
            Editar Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("historico")}
            className={`py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === "historico"
                ? "bg-purple-800 text-white shadow-sm"
                : "text-purple-300 hover:text-white"
            }`}
          >
            Histórico PIX
          </button>
        </div>

        {/* CONTEÚDO DA ABA SELECIONADA */}
        {activeTab === "perfil" ? (
          /* ABA: FORMULÁRIO DE EDIÇÃO */
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
            {/* APELIDO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Apelido de Exibição
              </label>
              <input
                type="text"
                maxLength={20}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white text-sm font-semibold focus:outline-none focus:border-lime-400 transition-all"
              />
            </div>

            {/* BIO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Biografia / Frase de Efeito
              </label>
              <textarea
                rows={2}
                maxLength={100}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white text-xs font-medium focus:outline-none focus:border-pink-500 transition-all resize-none"
              />
            </div>

            {/* STATUS */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Status no Jogo
              </label>
              <input
                type="text"
                maxLength={30}
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="Ex: Pronto pra falar merda"
                className="w-full px-4 py-3 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white text-sm font-semibold focus:outline-none focus:border-yellow-400 transition-all"
              />
            </div>

            {/* BOTÃO SALVAR */}
            <motion.button
              type="submit"
              disabled={isSaving}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              className="w-full mt-2 py-4 rounded-2xl font-[family-name:var(--font-fredoka)] font-bold text-base uppercase tracking-wider text-slate-950 btn-3d-green flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(34,197,94,0.45)] cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SALVANDO...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>SALVAR ALTERAÇÕES</span>
                </>
              )}
            </motion.button>
          </form>
        ) : (
          /* ABA: HISTÓRICO DE TRANSAÇÕES */
          <div className="flex flex-col gap-2.5">
            {isLoadingTx ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-purple-300">
                <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
                <span className="text-xs font-semibold">Carregando histórico...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 px-4 rounded-3xl bg-purple-950/30 border-2 border-dashed border-purple-500/30 flex flex-col items-center justify-center text-center gap-2 text-purple-300">
                <QrCode className="w-8 h-8 text-pink-400" />
                <span className="text-xs font-semibold">Nenhuma recarga efetuada ainda.</span>
                <button
                  type="button"
                  onClick={() => setIsShopOpen(true)}
                  className="mt-1 text-xs font-bold text-lime-400 underline underline-offset-4 cursor-pointer"
                >
                  Fazer primeira recarga via PIX ⚡
                </button>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-[#14082c]/90 border border-purple-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-base">
                      🪙
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white block">
                        +{tx.coins_amount} MerdaCoins
                      </span>
                      <span className="text-[10px] text-purple-400/80 font-mono">
                        {new Date(tx.created_at).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(tx.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-white block">
                      R$ {(tx.amount_cents / 100).toFixed(2).replace(".", ",")}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        tx.status === "approved"
                          ? "bg-emerald-950 border border-emerald-500/40 text-emerald-300"
                          : tx.status === "pending"
                          ? "bg-amber-950 border border-amber-500/40 text-amber-300"
                          : "bg-rose-950 border border-rose-500/40 text-rose-300"
                      }`}
                    >
                      {tx.status === "approved"
                        ? "Aprovado"
                        : tx.status === "pending"
                        ? "Pendente"
                        : "Cancelado"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
