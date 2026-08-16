"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Timer,
  QrCode,
  ShieldCheck,
  Loader2,
  Sparkles,
  Coins,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export function PixPaymentModal() {
  const { selectedPixPayment, setSelectedPixPayment, refreshProfile, addCoinsToBalance, showSuccessToast } = useAuth();
  
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "approved" | "expired">("pending");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const txId = selectedPixPayment?.transactionId || selectedPixPayment?.externalPaymentId;

  // 1. TIMER REGRESSIVO DE EXPIRAÇÃO
  useEffect(() => {
    if (!selectedPixPayment) return;

    setTimeLeft(15 * 60);
    setPaymentStatus("pending");

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedPixPayment]);

  // Função para lidar com pagamento aprovado
  const handlePaymentApproved = useCallback(
    (coinsToAdd?: number, exactBalance?: number) => {
      setPaymentStatus("approved");
      const amount = coinsToAdd || selectedPixPayment?.coinsAmount || 1;
      addCoinsToBalance(amount, exactBalance);
      refreshProfile();
      showSuccessToast(
        `🎉 PAGAMENTO APROVADO! +${amount} MerdaCoins creditadas!`
      );
    },
    [addCoinsToBalance, refreshProfile, selectedPixPayment?.coinsAmount, showSuccessToast]
  );

  // 2. REALTIME LISTENER & POLLING DE STATUS
  useEffect(() => {
    if (!selectedPixPayment || paymentStatus === "approved") return;

    const externalId = selectedPixPayment.externalPaymentId;
    const dbTxId = selectedPixPayment.transactionId;

    // Polling a cada 2 segundos com verificação ativa na API do Mercado Pago
    const checkStatus = async () => {
      try {
        const idToCheck = externalId || dbTxId;
        if (!idToCheck) return;

        const res = await fetch(`/api/payment/status/${idToCheck}`);
        const data = await res.json();

        if (data.success && data.status === "approved") {
          handlePaymentApproved(data.coinsAmount, data.coinsBalance);
        }
      } catch (err) {
        console.warn("[PixModal] Erro no polling de status:", err);
      }
    };

    // Executa uma vez imediatamente
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 2000);

    // Escuta em Realtime do Supabase na tabela transactions
    let unsubscribe = () => {};
    if (isSupabaseConfigured() && (dbTxId || externalId)) {
      const channel = supabase
        .channel(`tx-status-${dbTxId || externalId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const updated = payload.new as any;
            if (
              (updated.id === dbTxId || updated.external_payment_id === externalId) &&
              updated.status === "approved"
            ) {
              handlePaymentApproved();
            }
          }
        )
        .subscribe();

      unsubscribe = () => {
        supabase.removeChannel(channel);
      };
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      unsubscribe();
    };
  }, [selectedPixPayment, paymentStatus, handlePaymentApproved]);

  if (!selectedPixPayment) return null;

  // Formatação de minutos e segundos (Ex: 14:59)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remSecs).padStart(2, "0")}`;
  };

  // Copiar código PIX
  const handleCopyCode = () => {
    if (!selectedPixPayment.qrCode) return;
    navigator.clipboard.writeText(selectedPixPayment.qrCode);
    setCopied(true);
    showSuccessToast("Código PIX Copiado! Cole no app do seu banco. 📱");
    setTimeout(() => setCopied(false), 3000);
  };

  // Simular aprovação em ambiente de testes/sandbox
  const handleSimulateApproval = async () => {
    const idToApprove = selectedPixPayment.externalPaymentId || selectedPixPayment.transactionId;
    if (!idToApprove) return;

    setIsSimulating(true);
    try {
      const res = await fetch(`/api/payment/status/${idToApprove}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate_approval" }),
      });
      const data = await res.json();
      if (data.success) {
        handlePaymentApproved();
      }
    } catch (e) {
      console.error("Erro na simulação:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop escuro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedPixPayment(null)}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Card do Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-[#0e041d] border-2 border-pink-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(236,72,153,0.35)] text-slate-100 my-auto z-10 overflow-hidden"
      >
        {/* Glow Superior Neon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-pink-500/20 blur-xl pointer-events-none" />

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-sm">
              ⚡
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-fredoka)] font-black text-lg text-white uppercase">
                PAGAMENTO VIA PIX
              </h3>
              <span className="text-[11px] text-pink-300 font-semibold">
                {selectedPixPayment.packageName || "Pacote de Moedas"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPixPayment(null)}
            className="p-1.5 rounded-xl bg-purple-950/60 hover:bg-rose-950/80 border border-purple-500/30 text-purple-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTEÚDO BASEADO NO STATUS */}
        {paymentStatus === "approved" ? (
          /* TELA DE SUCESSO / APROVADO */
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-6 flex flex-col items-center text-center gap-3"
          >
            <div className="w-20 h-20 rounded-full bg-lime-400/20 border-2 border-lime-400 flex items-center justify-center text-lime-400 shadow-[0_0_30px_rgba(57,255,20,0.6)] animate-bounce">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <h4 className="text-2xl font-black font-[family-name:var(--font-fredoka)] text-lime-300 uppercase tracking-wide">
              PAGAMENTO APROVADO!
            </h4>

            <div className="p-3 rounded-2xl bg-purple-950/70 border border-lime-400/50 flex items-center gap-2 text-white font-mono font-bold text-lg">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span>+{selectedPixPayment.coinsAmount} MerdaCoins</span>
            </div>

            <p className="text-xs text-purple-200/90 font-medium max-w-xs">
              Seu saldo foi atualizado instantaneamente! Agora você pode esbanjar zoeira nas salas.
            </p>

            <button
              type="button"
              onClick={() => setSelectedPixPayment(null)}
              className="w-full mt-3 py-3.5 rounded-2xl font-[family-name:var(--font-fredoka)] font-bold text-base uppercase tracking-wider text-slate-950 btn-3d-green shadow-lg cursor-pointer"
            >
              CONTINUAR JOGANDO 💩
            </button>
          </motion.div>
        ) : paymentStatus === "expired" ? (
          /* TELA DE EXPIRADO */
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-16 h-16 text-rose-500" />
            <h4 className="text-xl font-bold font-[family-name:var(--font-fredoka)] text-rose-300">
              PIX EXPIRADO
            </h4>
            <p className="text-xs text-purple-300">
              O tempo limite de 15 minutos foi atingido. Gere um novo código para concluir a compra.
            </p>
            <button
              type="button"
              onClick={() => setSelectedPixPayment(null)}
              className="mt-2 py-3 px-6 rounded-2xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs uppercase"
            >
              Fechar
            </button>
          </div>
        ) : (
          /* TELA DE PAGAMENTO PENDENTE COM QR CODE */
          <div className="flex flex-col items-center gap-3">
            {/* TIMER E VALOR */}
            <div className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/25 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-yellow-300">
                <Timer className="w-4 h-4 animate-spin-slow" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>

              <div className="flex items-center gap-1 text-lime-300 font-mono font-bold">
                <span>R$ {((selectedPixPayment.amountCents || 0) / 100).toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            {/* ÁREA DO QR CODE */}
            <div className="relative p-3 rounded-2xl bg-white shadow-[0_0_30px_rgba(236,72,153,0.35)] flex items-center justify-center">
              {selectedPixPayment.qrCodeBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${selectedPixPayment.qrCodeBase64}`}
                  alt="QR Code PIX Mercado Pago"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                />
              ) : (
                /* Fallback QR visual para desenvolvimento/mock */
                <div className="w-44 h-44 sm:w-48 sm:h-48 bg-slate-900 rounded-lg flex flex-col items-center justify-center p-3 text-center text-slate-100 gap-2">
                  <QrCode className="w-20 h-20 text-lime-400" />
                  <span className="text-[10px] font-mono text-purple-200 uppercase font-bold">
                    PIX MERCADO PAGO
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-purple-300/90 text-center">
              Abra o app do seu banco, escolha <strong>Pagar via PIX</strong> e escaneie o código ou copie o código abaixo.
            </p>

            {/* CÓDIGO COPIA E COLA */}
            <div className="w-full flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                PIX COPIA E COLA
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={selectedPixPayment.qrCode || ""}
                  className="w-full py-2.5 pl-3 pr-24 rounded-xl bg-[#14082c] border border-purple-500/40 text-purple-200 text-xs font-mono select-all focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="absolute right-1.5 py-1.5 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-lime-300" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* STATUS EM TEMPO REAL: AGUARDANDO */}
            <div className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-200 text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
              <span>Aguardando confirmação do pagamento...</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
