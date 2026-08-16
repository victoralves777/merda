"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Coins,
  Sparkles,
  QrCode,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Flame,
  Plus,
  Minus,
  Calculator,
  Zap,
} from "lucide-react";
import { COIN_PACKAGES, CoinPackage, PRICE_PER_COIN_CENTS } from "@/lib/mercadopago";
import { useAuth } from "@/contexts/AuthContext";

export function CoinShopModal() {
  const { isShopOpen, setIsShopOpen, profile, user, setSelectedPixPayment, showSuccessToast } = useAuth();
  
  // Estado para quantidade personalizada X de moedas
  const [customCoins, setCustomCoins] = useState<number>(40); // 40 moedas = R$ 10,00 por padrão
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isShopOpen) return null;

  // Cálculo de valor em Reais a R$ 0,25 por moeda
  const pricePerCoin = PRICE_PER_COIN_CENTS / 100; // 0.25
  const safeCoins = Math.max(1, isNaN(customCoins) ? 1 : customCoins);
  const calculatedTotal = (safeCoins * pricePerCoin).toFixed(2).replace(".", ",");

  const handleBuyCustom = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const effectiveUserId = profile?.id || user?.id || `anon_${Date.now()}`;
      const effectiveEmail = user?.email || "jogador@merdasefudeu.com";
      const effectiveName = profile?.display_name || profile?.username || "Jogador";

      const res = await fetch("/api/payment/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customCoins: safeCoins,
          userId: effectiveUserId,
          userEmail: effectiveEmail,
          userName: effectiveName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Não foi possível gerar a cobrança PIX.");
        setIsLoading(false);
        return;
      }

      setIsShopOpen(false);
      setSelectedPixPayment(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao gerar o PIX.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyPreset = async (pkg: CoinPackage) => {
    setCustomCoins(pkg.coins);
    setErrorMsg(null);
    setLoadingPackageId(pkg.id);

    try {
      const effectiveUserId = profile?.id || user?.id || `anon_${Date.now()}`;
      const effectiveEmail = user?.email || "jogador@merdasefudeu.com";
      const effectiveName = profile?.display_name || profile?.username || "Jogador";

      const res = await fetch("/api/payment/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          customCoins: pkg.coins,
          userId: effectiveUserId,
          userEmail: effectiveEmail,
          userName: effectiveName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Não foi possível gerar a cobrança PIX.");
        setLoadingPackageId(null);
        return;
      }

      setIsShopOpen(false);
      setSelectedPixPayment(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao gerar o PIX.");
    } finally {
      setLoadingPackageId(null);
    }
  };

  const adjustCoins = (delta: number) => {
    setCustomCoins((prev) => Math.max(1, (isNaN(prev) ? 0 : prev) + delta));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop com blur escuro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsShopOpen(false)}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Card Principal da Loja */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 25 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative w-full max-w-lg bg-[#0e041d] border-2 border-purple-500/50 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.35)] text-slate-100 my-auto z-10 overflow-hidden"
      >
        {/* Glow Superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-yellow-400/20 via-pink-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-400/50 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.35)]">
              🪙
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-fredoka)] uppercase tracking-tight text-white flex items-center gap-2">
                <span>LOJA DE MOEDAS</span>
                <span className="text-sm">💩</span>
              </h2>
              <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                <span>Preço fixo:</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-yellow-300 font-mono">
                  R$ 0,25 cada moeda
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsShopOpen(false)}
            className="p-2 rounded-xl bg-purple-950/60 hover:bg-rose-950/80 border border-purple-500/30 text-purple-300 hover:text-white transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENSAGEM DE ERRO */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* SEÇÃO 1: COMPRA PERSONALIZADA (O TANTO DE MOEDAS QUE O USUÁRIO QUISER) */}
        <div className="mb-4 p-4 rounded-3xl bg-gradient-to-b from-[#1c0a3a] via-[#14062c] to-[#120526] border-2 border-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.25)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center gap-1.5 font-[family-name:var(--font-fredoka)]">
              <Calculator className="w-4 h-4 text-yellow-400" />
              ESCOLHA A QUANTIDADE EXATA
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
              R$ 0,25 / un
            </span>
          </div>

          {/* INPUT NUMÉRICO COM STEPPERS */}
          <div className="flex items-center gap-2 my-3">
            <button
              type="button"
              onClick={() => adjustCoins(-10)}
              className="w-12 h-12 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white flex items-center justify-center font-black text-lg transition-transform active:scale-90 cursor-pointer shrink-0"
              title="Diminuir 10 moedas"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="relative flex-1 flex items-center">
              <input
                type="number"
                min={1}
                max={10000}
                value={customCoins || ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCustomCoins(isNaN(val) ? 0 : val);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#090214] border-2 border-yellow-400/50 text-center font-mono font-black text-2xl sm:text-3xl text-yellow-300 focus:outline-none focus:border-yellow-300 focus:shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all"
                placeholder="0"
              />
              <span className="absolute right-3 text-xs font-bold uppercase text-purple-400 pointer-events-none hidden xs:inline">
                Moedas
              </span>
            </div>

            <button
              type="button"
              onClick={() => adjustCoins(10)}
              className="w-12 h-12 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white flex items-center justify-center font-black text-lg transition-transform active:scale-90 cursor-pointer shrink-0"
              title="Aumentar 10 moedas"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* BOTÕES RÁPIDOS DE ADICIONAR (+5, +10, +25, +50, +100) */}
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {[5, 10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => adjustCoins(amt)}
                className="py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/80 border border-purple-500/30 text-purple-200 hover:text-yellow-300 font-mono font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                +{amt}
              </button>
            ))}
          </div>

          {/* TOTAL EM REAIS CALCULADO */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0a0216] border border-yellow-400/30 mb-3">
            <span className="text-xs text-purple-200 font-medium">
              Valor total ({safeCoins} x R$ 0,25):
            </span>
            <span className="font-mono font-black text-xl text-lime-300 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
              R$ {calculatedTotal}
            </span>
          </div>

          {/* BOTÃO PRINCIPAL DE GERAR PIX PERSONALIZADO */}
          <motion.button
            type="button"
            onClick={handleBuyCustom}
            disabled={isLoading || safeCoins <= 0}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            className="w-full relative group overflow-hidden rounded-2xl py-3.5 sm:py-4 px-5 font-[family-name:var(--font-fredoka)] text-base sm:text-lg font-bold tracking-wider uppercase text-slate-950 btn-3d-green flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(34,197,94,0.45)] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>GERANDO PIX...</span>
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5 stroke-[2.5]" />
                <span>PAGAR R$ {calculatedTotal} NO PIX</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </motion.button>
        </div>

        {/* SEÇÃO 2: ATALHOS RÁPIDOS DE PACOTES */}
        <div className="mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-2 block">
            OU ESCOLHA UM PACOTE PRONTO (1-CLIQUE):
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COIN_PACKAGES.map((pkg) => {
              const isPkgLoading = loadingPackageId === pkg.id;

              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleBuyPreset(pkg)}
                  disabled={isPkgLoading}
                  className="p-2.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 hover:border-lime-400 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-sm"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl">{pkg.icon}</span>
                    <span className="text-[10px] font-mono font-bold text-lime-300">
                      {pkg.priceFormatted}
                    </span>
                  </div>

                  <span className="font-mono font-black text-sm text-yellow-300 block">
                    {pkg.coins} moedas
                  </span>
                  <span className="text-[9px] text-purple-400 font-medium truncate block">
                    {pkg.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RODAPÉ INFORMATIVO */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-purple-400/80 font-medium text-center pt-2 border-t border-purple-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Pagamento instantâneo via PIX do Mercado Pago. 100% seguro.</span>
        </div>
      </motion.div>
    </div>
  );
}
