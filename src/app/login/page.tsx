"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { SurrealDecorations } from "@/components/SurrealDecorations";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Preencha todos os campos para entrar! 💩");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await login(email, password);

    if (!res.success) {
      setIsSubmitting(false);
      setErrorMessage(res.error || "Email ou senha incorretos.");
      return;
    }

    router.push("/perfil");
  };

  const isFormValid = email.trim().length > 0 && password.trim().length >= 6;

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col bg-surreal-grid overflow-x-hidden text-slate-100">
      <SurrealDecorations />

      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-4 pt-4 pb-12">
        {/* TOPO */}
        <header className="w-full mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 cursor-pointer"
              aria-label="Voltar para a página inicial"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-500/30 text-pink-400 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </div>
          </div>

          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-fredoka)] flex items-center gap-2">
              <span>ENTRAR NA CONTA</span>
              <span className="text-2xl">💩</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/80 font-medium mt-0.5">
              “Acesse seu perfil, moedas e histórico de zoeira.”
            </p>
          </div>
        </header>

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 my-auto">
          {/* CAMPO: EMAIL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-pink-400" />
              Seu Email
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
              className="w-full px-4 py-3.5 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-sm font-semibold tracking-wide focus:outline-none focus:border-pink-500 focus:shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-all"
            />
          </div>

          {/* CAMPO: SENHA */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-lime-400" />
              Sua Senha
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Sua senha secreta..."
                autoComplete="current-password"
                className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-[#13082a]/90 border-2 border-purple-500/40 text-white placeholder-purple-400/40 text-sm font-semibold tracking-wide focus:outline-none focus:border-lime-400 focus:shadow-[0_0_20px_rgba(57,255,20,0.35)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-purple-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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

          {/* BOTÃO ENTRAR */}
          <motion.button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            whileTap={isFormValid ? { scale: 0.97 } : {}}
            whileHover={isFormValid ? { scale: 1.01 } : {}}
            className={`w-full relative group overflow-hidden rounded-2xl py-4 px-6 font-[family-name:var(--font-fredoka)] text-lg font-bold tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all mt-2 ${
              isFormValid
                ? "btn-3d-pink text-white shadow-[0_10px_25px_rgba(236,72,153,0.45)] cursor-pointer"
                : "bg-purple-950/40 border-2 border-purple-800/30 text-purple-400/50 cursor-not-allowed opacity-60"
            }`}
          >
            <span>{isSubmitting ? "ENTRANDO..." : "ENTRAR"}</span>
            <LogIn className="w-5 h-5" />
          </motion.button>

          {/* LINK PARA CADASTRO */}
          <div className="text-center mt-4">
            <span className="text-xs text-purple-300/80">Ainda não tem uma conta? </span>
            <Link
              href="/cadastro"
              className="text-xs font-bold text-lime-400 hover:text-lime-300 underline underline-offset-4 ml-1"
            >
              Criar Conta Grátis 💩
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
