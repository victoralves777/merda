import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/mercadopago";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryId = url.searchParams.get("data.id") || url.searchParams.get("id");
    const queryTopic = url.searchParams.get("type") || url.searchParams.get("topic");

    const body = await req.json().catch(() => ({}));
    const paymentId = body.data?.id || body.id || queryId;
    const topic = body.type || body.action || queryTopic || "payment";

    console.log(`[MercadoPago Webhook] Notificação recebida - ID: ${paymentId}, Topic: ${topic}`);

    if (!paymentId) {
      return NextResponse.json({ received: true, note: "Sem ID de pagamento" }, { status: 200 });
    }

    // Apenas processa tópicos de pagamento
    if (topic && !topic.includes("payment")) {
      return NextResponse.json({ received: true, note: "Tópico ignorado" }, { status: 200 });
    }

    // 1. Consulta o pagamento diretamente na API oficial do Mercado Pago para verificação anti-fraude
    const paymentData = await getMercadoPagoPayment(String(paymentId));

    if (!paymentData) {
      console.warn(`[MercadoPago Webhook] Pagamento ${paymentId} não encontrado na API do Mercado Pago.`);
      return NextResponse.json({ received: true, error: "Pagamento não encontrado" }, { status: 200 });
    }

    const status = paymentData.status;
    console.log(`[MercadoPago Webhook] Status do pagamento ${paymentId}: ${status}`);

    // 2. Se o status for "approved", processa e credita as moedas
    if (status === "approved" && isSupabaseConfigured()) {
      const { data: result, error } = await supabase.rpc("process_approved_transaction", {
        p_external_id: String(paymentId),
        p_metadata: {
          mp_status: status,
          mp_status_detail: paymentData.status_detail,
          date_approved: paymentData.date_approved,
          payer_email: paymentData.payer?.email,
          processed_at: new Date().toISOString(),
        },
      });

      if (error) {
        console.error("[MercadoPago Webhook] Erro ao executar RPC process_approved_transaction:", error);
        
        // Fallback manual
        const { data: tx } = await supabase
          .from("transactions")
          .select("*")
          .eq("external_payment_id", String(paymentId))
          .maybeSingle();

        if (tx && tx.status !== "approved") {
          await supabase.from("transactions").update({ status: "approved" }).eq("id", tx.id);
          
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("coins_balance")
            .eq("id", tx.user_id)
            .single();

          const newBalance = (userProfile?.coins_balance || 0) + tx.coins_amount;
          await supabase
            .from("profiles")
            .update({ coins_balance: newBalance })
            .eq("id", tx.user_id);

          console.log(`[MercadoPago Webhook] Saldo creditado via Fallback para o usuário ${tx.user_id}: +${tx.coins_amount}`);
        }
      } else {
        console.log("[MercadoPago Webhook] Transação processada com sucesso via RPC:", result);
      }
    }

    return NextResponse.json({ received: true, status }, { status: 200 });
  } catch (err: any) {
    console.error("[MercadoPago Webhook] Erro ao processar webhook:", err);
    // Sempre retorna 200 para evitar retentativas desnecessárias do Mercado Pago se for erro de payload
    return NextResponse.json({ received: true, error: err.message }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  // Tratamento para requisições de validação de URL do Mercado Pago
  return NextResponse.json({ status: "online", service: "Merda Se Fudeu PIX Webhook 💩" }, { status: 200 });
}
