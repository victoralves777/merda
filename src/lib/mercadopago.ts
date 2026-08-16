export const PRICE_PER_COIN_CENTS = 25; // R$ 0,25 por moeda

export interface CoinPackage {
  id: string;
  name: string;
  subtitle: string;
  coins: number;
  priceCents: number;
  priceFormatted: string;
  bonus: string;
  popular: boolean;
  icon: string;
  gradient: string;
  borderGlow: string;
}

// Atalhos rápidos baseados no preço fixo de R$ 0,25 por moeda
export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: "pacote_20",
    name: "Punhado de Merda",
    subtitle: "R$ 0,25 cada moeda",
    coins: 20,
    priceCents: 20 * PRICE_PER_COIN_CENTS, // R$ 5,00
    priceFormatted: "R$ 5,00",
    bonus: "",
    popular: false,
    icon: "💩",
    gradient: "from-amber-700/80 via-yellow-900/60 to-purple-950/90",
    borderGlow: "border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]",
  },
  {
    id: "pacote_40",
    name: "Saco Reforçado",
    subtitle: "R$ 0,25 cada moeda",
    coins: 40,
    priceCents: 40 * PRICE_PER_COIN_CENTS, // R$ 10,00
    priceFormatted: "R$ 10,00",
    bonus: "",
    popular: true,
    icon: "🧪",
    gradient: "from-emerald-900/80 via-purple-950/90 to-purple-950/90",
    borderGlow: "border-lime-400/80 hover:border-lime-300 shadow-[0_0_25px_rgba(57,255,20,0.35)]",
  },
  {
    id: "pacote_100",
    name: "Balde da Zueira",
    subtitle: "R$ 0,25 cada moeda",
    coins: 100,
    priceCents: 100 * PRICE_PER_COIN_CENTS, // R$ 25,00
    priceFormatted: "R$ 25,00",
    bonus: "POPULAR",
    popular: false,
    icon: "🎩",
    gradient: "from-fuchsia-950/80 via-purple-950/90 to-purple-950/90",
    borderGlow: "border-fuchsia-500/40 hover:border-fuchsia-400 hover:shadow-[0_0_25px_rgba(217,70,239,0.3)]",
  },
  {
    id: "pacote_200",
    name: "Trono de Ouro do Merda",
    subtitle: "R$ 0,25 cada moeda",
    coins: 200,
    priceCents: 200 * PRICE_PER_COIN_CENTS, // R$ 50,00
    priceFormatted: "R$ 50,00",
    bonus: "ESTOQUE CHEIO",
    popular: false,
    icon: "👑",
    gradient: "from-amber-600/70 via-pink-900/60 to-purple-950/90",
    borderGlow: "border-yellow-400/60 hover:border-yellow-300 hover:shadow-[0_0_30px_rgba(250,204,21,0.4)]",
  },
];

export interface CreatePixInput {
  userId: string;
  packageId?: string;
  customCoins?: number; // Quantidade personalizada X de moedas escolhida pelo jogador
  userEmail?: string;
  userName?: string;
}

export interface PixPaymentResponse {
  success: boolean;
  transactionId?: string;
  externalPaymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  expiresAt?: string;
  amountCents?: number;
  coinsAmount?: number;
  packageName?: string;
  isMock?: boolean;
  error?: string;
}

// Criação de Cobrança PIX via API Oficial do Mercado Pago
export async function createMercadoPagoPix(input: CreatePixInput): Promise<PixPaymentResponse> {
  let coins = 0;
  let priceCents = 0;
  let packageName = "";
  let effectivePackageId = input.packageId || "custom";

  if (input.customCoins && input.customCoins > 0) {
    coins = Math.max(1, Math.floor(input.customCoins));
    priceCents = coins * PRICE_PER_COIN_CENTS;
    packageName = `${coins} MerdaCoins 💩`;
    effectivePackageId = `custom_${coins}`;
  } else if (input.packageId) {
    const pkg = COIN_PACKAGES.find((p) => p.id === input.packageId);
    if (pkg) {
      coins = pkg.coins;
      priceCents = pkg.priceCents;
      packageName = pkg.name;
    }
  }

  if (coins <= 0 || priceCents <= 0) {
    return { success: false, error: "Quantidade de moedas inválida. Escolha pelo menos 1 moeda." };
  }

  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Se não houver token configurado, gera modo Sandbox/Demonstração visual instantâneo
  if (!token) {
    console.warn("[MercadoPago] MERCADO_PAGO_ACCESS_TOKEN não configurado. Utilizando simulação de ambiente.");
    const mockId = `sim_mp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // QR code mock gerado dinamicamente para visualização e testes
    const mockQrCode = `00020126580014br.gov.bcb.pix0136${mockId}520400005303986540${(priceCents / 100).toFixed(2)}5802BR5915Merda Se Fudeu6009SAO PAULO62070503***6304ABCD`;

    return {
      success: true,
      externalPaymentId: mockId,
      qrCode: mockQrCode,
      qrCodeBase64: null as any,
      ticketUrl: `https://www.mercadopago.com.br/payments/${mockId}/ticket`,
      expiresAt,
      amountCents: priceCents,
      coinsAmount: coins,
      packageName,
      isMock: true,
    };
  }

  try {
    const expirationDate = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos de expiração
    const idempotencyKey = `pix_${input.userId}_${effectivePackageId}_${Date.now()}`;

    const isHttpsUrl = appUrl.startsWith("https://") && !appUrl.includes("localhost");

    const bodyPayload: any = {
      transaction_amount: Number((priceCents / 100).toFixed(2)),
      description: `Merda Se Fudeu! 💩 - ${packageName} (${coins} moedas a R$ 0,25 cada)`,
      payment_method_id: "pix",
      date_of_expiration: expirationDate,
      payer: {
        email: input.userEmail || "comprador@merdasefudeu.com.br",
        first_name: input.userName || "Jogador",
      },
      metadata: {
        user_id: input.userId,
        package_id: effectivePackageId,
        coins_amount: coins,
        price_cents: priceCents,
      },
    };

    if (isHttpsUrl) {
      bodyPayload.notification_url = `${appUrl}/api/webhooks/mercadopago`;
    }

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("[MercadoPago] Erro ao criar pagamento:", data);
      return {
        success: false,
        error: data.message || data.error || "Falha na comunicação com o Mercado Pago.",
      };
    }

    const txData = data.point_of_interaction?.transaction_data;

    return {
      success: true,
      externalPaymentId: String(data.id),
      qrCode: txData?.qr_code || "",
      qrCodeBase64: txData?.qr_code_base64 || "",
      ticketUrl: txData?.ticket_url || "",
      expiresAt: data.date_of_expiration || expirationDate,
      amountCents: priceCents,
      coinsAmount: coins,
      packageName,
      isMock: false,
    };
  } catch (err: any) {
    console.error("[MercadoPago] Exceção na requisição:", err);
    return {
      success: false,
      error: err.message || "Erro inesperado ao gerar cobrança PIX.",
    };
  }
}

// Consulta de Pagamento no Mercado Pago
export async function getMercadoPagoPayment(paymentId: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    return { id: paymentId, status: "pending", isMock: true };
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("[MercadoPago] Erro ao consultar pagamento:", e);
    return null;
  }
}
