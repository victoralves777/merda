"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle, Coins, ArrowRight } from "lucide-react";
import { SurrealDecorations } from "@/components/SurrealDecorations";
import { useAuth } from "@/contexts/AuthContext";

export default function CadastroPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || username.trim().length < 3) {
      setErrorMessage("O nome de usuário deve ter no mínimo 3 caracteres! 💩");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Digite um endereço de email válido! 📧");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres! 🔒");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem! ⚠️");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await register(
      email.trim(),
      password,
      username.trim().toLowerCase(),
      displayName.trim() || username.trim()
    );

    if (!res.success) {
      setIsSubmitting(false);
      setErrorMessage(res.error || "Erro ao criar conta. Tente novamente.");
      return;
    }

    router.push("/perfil");
  };

  const isFormValid =
    username.trim().length >= 3 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col bg-surreal-grid overflow-x-hidden text-slate-100">
      <SurrealDecorations />

      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-4 pt-4 pb-12">
        {/* TOPO */}
        <header className="w-full mb-4">
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 cursor-pointer"
              aria-label="Voltar para a página inicial"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-950/70 border border-lime-500/30 text-lime-400 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Novo Jogador</span>
            </div>
          </div>

          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-fredoka)] flex items-center gap-2">
              <span>CRIAR CONTA</span>
              <span className="text-2xl">🎪</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/80 font-medium mt-0.5">
              “Entre pro clube dos zombadores profissionais.”
            </p>
          </div>
        </header>

        {/* BANNER DE INFORMAÇÃO DA LOJA */}
        <div className="w-full mb-4 p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#220a3d] to-purple-950/80 border border-purple-500/40 text-purple-200 flex items-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <div className="w-10 h-10 rounded-xl bg-purple-900 border border-purple-400/40 text-yellow-300 flex items-center justify-center font-black text-xl shrink-0">
            🪙
          </div>
          <div>
            <span className="font-bold text-xs text-white uppercase block">
              SISTEMA DE MOEDAS (PIX)
            </span>
            <span className="text-[11px] text-purple-300 font-medium flex items-center gap-1">
              Recarregue qualquer quantidade por apenas <strong className="text-lime-300 font-mono">R$ 0,25 / moeda</strong>!
            </span>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleRegister} className="flex flex-col gap-3 my-auto">
          {/* USERNAME */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-lime-400" />
              Nome de Usuário (@)
            </label>
            <input
              type="text"
              value={username}
              maxLength={20}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="ex: zoeiro_mor"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-sm font-semibold tracking-wide focus:outline-none focus:border-lime-400 focus:shadow-[0_0_20px_rgba(57,255,20,0.35)] transition-all font-mono"
            />
          </div>

          {/* APELIDO / DISPLAY NAME */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Apelido no Jogo
            </label>
            <input
              type="text"
              value={displayName}
              maxLength={20}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como quer ser chamado nas salas?"
              className="w-full px-4 py-3 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-sm font-semibold tracking-wide focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          {/* EMAIL */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-pink-400" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-sm font-semibold tracking-wide focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          {/* SENHA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-yellow-400" />
                Senha
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Mínimo 6 dígitos"
                autoComplete="new-password"
                className="w-full px-3.5 py-3 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-xs font-semibold focus:outline-none focus:border-yellow-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center justify-between">
                <span>Confirmar</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-purple-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Repita a senha"
                autoComplete="new-password"
                className="w-full px-3.5 py-3 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-xs font-semibold focus:outline-none focus:border-yellow-400 transition-all"
              />
            </div>
          </div>

          {/* MENSAGEM DE ERRO */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-pink-950/80 border border-pink-500/50 text-pink-200 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTÃO CADASTRAR */}
          <motion.button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            whileTap={isFormValid ? { scale: 0.97 } : {}}
            whileHover={isFormValid ? { scale: 1.01 } : {}}
            className={`w-full relative group overflow-hidden rounded-2xl py-4 px-6 font-[family-name:var(--font-fredoka)] text-lg font-bold tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all mt-2 ${
              isFormValid
                ? "btn-3d-green text-slate-950 shadow-[0_10px_25px_rgba(34,197,94,0.45)] cursor-pointer"
                : "bg-purple-950/40 border-2 border-purple-800/30 text-purple-400/50 cursor-not-allowed opacity-60"
            }`}
          >
            <span>{isSubmitting ? "CRIANDO CONTA..." : "CRIAR MINHA CONTA 💩"}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* LINK PARA LOGIN */}
          <div className="text-center mt-3">
            <span className="text-xs text-purple-300/80">Já tem uma conta? </span>
            <Link
              href="/login"
              className="text-xs font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4 ml-1"
            >
              Fazer Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
