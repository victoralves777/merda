import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getMercadoPagoPayment } from "@/lib/mercadopago";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID não fornecido" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      // 1. Busca a transação no Supabase pelo UUID ou external_payment_id
      const { data: tx, error } = await supabase
        .from("transactions")
        .select("*, profiles(coins_balance)")
        .or(`id.eq.${id},external_payment_id.eq.${id}`)
        .maybeSingle();

      if (!error && tx) {
        // Se a transação já está aprovada no banco, retorna imediatamente
        if (tx.status === "approved") {
          return NextResponse.json({
            success: true,
            status: "approved",
            coinsAmount: tx.coins_amount,
            amountCents: tx.amount_cents,
            userId: tx.user_id,
            expiresAt: tx.expires_at,
            coinsBalance: (tx as any).profiles?.coins_balance,
          });
        }

        // Se ainda está pendente no banco, consulta ativamente a API oficial do Mercado Pago
        const externalId = tx.external_payment_id || id;
        if (externalId && !externalId.startsWith("sim_mp_")) {
          const mpPayment = await getMercadoPagoPayment(externalId);

          if (mpPayment && mpPayment.status === "approved") {
            // Pagamento confirmado no Mercado Pago! Credita as moedas no banco agora
            const { data: rpcResult, error: rpcErr } = await supabase.rpc("process_approved_transaction", {
              p_external_id: externalId,
              p_metadata: {
                mp_status: mpPayment.status,
                mp_status_detail: mpPayment.status_detail,
                date_approved: mpPayment.date_approved,
                active_polling: true,
                processed_at: new Date().toISOString(),
              },
            });

            let finalBalance: number | undefined;

            if (rpcErr) {
              // Fallback manual se a RPC não estiver carregada
              await supabase.from("transactions").update({ status: "approved" }).eq("id", tx.id);
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("coins_balance")
                .eq("id", tx.user_id)
                .single();

              finalBalance = (userProfile?.coins_balance || 0) + tx.coins_amount;
              await supabase.from("profiles").update({ coins_balance: finalBalance }).eq("id", tx.user_id);
            } else {
              // Busca saldo atualizado
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("coins_balance")
                .eq("id", tx.user_id)
                .single();
              finalBalance = userProfile?.coins_balance;
            }

            // Retorna aprovado com o saldo atualizado para a tela atualizar
            return NextResponse.json({
              success: true,
              status: "approved",
              coinsAmount: tx.coins_amount,
              amountCents: tx.amount_cents,
              userId: tx.user_id,
              expiresAt: tx.expires_at,
              coinsBalance: finalBalance,
            });
          }
        }

        return NextResponse.json({
          success: true,
          status: tx.status,
          coinsAmount: tx.coins_amount,
          amountCents: tx.amount_cents,
          userId: tx.user_id,
          expiresAt: tx.expires_at,
          coinsBalance: (tx as any).profiles?.coins_balance,
        });
      }
    }

    // Se for mock ou não encontrado no banco, tenta consultar no Mercado Pago diretamente pelo id
    if (id && !id.startsWith("sim_mp_")) {
      const mpPayment = await getMercadoPagoPayment(id);
      if (mpPayment && mpPayment.status === "approved") {
        return NextResponse.json({
          success: true,
          status: "approved",
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao consultar status." },
      { status: 500 }
    );
  }
}
