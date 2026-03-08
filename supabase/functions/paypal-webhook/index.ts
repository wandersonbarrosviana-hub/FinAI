import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Recebido Webhook do PayPal:", JSON.stringify(body));

    const eventType = body.event_type;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // O Checkout V2 dispara PAYMENT.CAPTURE.COMPLETED ou CHECKOUT.ORDER.APPROVED
    if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.APPROVED") {
       
       let orderId;
       let customIdRaw;

       if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
          const capture = body.resource;
          // O capture contém o custom_id repassado pela order
          customIdRaw = capture.custom_id;
          orderId = capture.supplementary_data?.related_ids?.order_id; 
       } else {
          const order = body.resource;
          if (order.purchase_units && order.purchase_units.length > 0) {
              customIdRaw = order.purchase_units[0].custom_id;
          }
          orderId = order.id;
       }

       if (customIdRaw) {
          try {
             const customData = JSON.parse(customIdRaw);
             const userId = customData.user_id;
             const plan = customData.plan; // pro or premium
             const cycle = customData.cycle; // monthly or annual

             console.log(`[PayPal-Webhook] Pagamento Aprovado para User: ${userId}. Ativando plano ${plan}...`);

             const nextPeriod = new Date();
             if (cycle === 'annual') {
                nextPeriod.setFullYear(nextPeriod.getFullYear() + 1);
             } else {
                nextPeriod.setMonth(nextPeriod.getMonth() + 1);
             }

             // 1. Atualiza user_subscriptions
             await supabaseAdmin
                .from('user_subscriptions')
                .update({
                  status: 'active',
                  current_period_end: nextPeriod.toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

             // 2. Atualiza profiles (fonte de verdade para UI)
             const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ plan_type: plan })
                .eq('id', userId);

             if (profileError) {
                console.error(`[PayPal-Webhook] Erro ao atualizar profile do user ${userId}:`, profileError);
             } else {
                console.log(`[PayPal-Webhook] Plano ${plan} ativado com sucesso para user ${userId}`);
             }

          } catch (e) {
             console.error("Erro ao fazer parse do custom_id", e);
          }
       }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Erro no Webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
