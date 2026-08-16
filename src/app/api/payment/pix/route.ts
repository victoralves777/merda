import { NextRequest, NextResponse } from "next/server";
import { createMercadoPagoPix, COIN_PACKAGES, PRICE_PER_COIN_CENTS } from "@/lib/mercadopago";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packageId, customCoins, userId, userEmail, userName } = body;

    if (!userId || (!packageId && !customCoins)) {
      return NextResponse.json(
        { success: false, error: "Parâmetros obrigatórios ausentes (userId e packageId ou customCoins)." },
        { status: 400 }
      );
    }

    // 1. Gera cobrança PIX no Mercado Pago (com suporte a X moedas personalizadas)
    const pixResult = await createMercadoPagoPix({
      userId,
      packageId,
      customCoins: customCoins ? Number(customCoins) : undefined,
      userEmail,
      userName,
    });

    if (!pixResult.success) {
      return NextResponse.json(
        { success: false, error: pixResult.error || "Erro ao gerar cobrança PIX." },
        { status: 500 }
      );
    }

    const effectivePackageId = customCoins ? `custom_${pixResult.coinsAmount}` : packageId;

    // 2. Grava a transação na tabela transactions do Supabase
    let transactionId = `tx_${Date.now()}`;
    if (isSupabaseConfigured()) {
      try {
        const { data: txRecord, error: txError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            package_id: effectivePackageId,
            amount_cents: pixResult.amountCents || (pixResult.coinsAmount || 1) * PRICE_PER_COIN_CENTS,
            coins_amount: pixResult.coinsAmount || 1,
            status: "pending",
            payment_method: "pix",
            external_payment_id: pixResult.externalPaymentId,
            qr_code: pixResult.qrCode,
            qr_code_base64: pixResult.qrCodeBase64,
            expires_at: pixResult.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            metadata: {
              package_name: pixResult.packageName,
              user_email: userEmail,
              user_name: userName,
              price_per_coin_cents: PRICE_PER_COIN_CENTS,
              is_mock: pixResult.isMock,
            },
          })
          .select()
          .single();

        if (!txError && txRecord) {
          transactionId = txRecord.id;
        } else if (txError) {
          console.warn("[API PIX] Erro ao gravar transação no Supabase:", txError);
        }
      } catch (dbErr) {
        console.error("[API PIX] Exceção ao gravar no banco:", dbErr);
      }
    }

    return NextResponse.json({
      ...pixResult,
      transactionId,
    });
  } catch (err: any) {
    console.error("[API PIX] Exceção geral:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
