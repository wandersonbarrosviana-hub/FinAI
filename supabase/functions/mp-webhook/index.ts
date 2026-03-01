import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    // Para simplificar a assinatura, o Webhook no MP avisa os eventos via POST
    const body = await req.json();
    console.log("Recebido Webhook do MP:", JSON.stringify(body));

    // Apenas nos importamos se houver um ID e o Tópico for de 'subscription_preapproval' ou 'payment'
    const topic = body.type || body.topic;
    
    // Configura o client admin do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Quando o usuário completa a assinatura e gera o pagamento de aprovação
    if (topic === "payment") {
      const paymentId = body.data.id;
      
      const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
      if (!MP_ACCESS_TOKEN) {
        throw new Error("Token do MP não configurado no servidor.");
      }

      // Buscar detalhes do pagamento no MP
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
      });
      const payment = await mpResponse.json();

      if (payment.status === 'approved') {
        // A referência externa é o userID que passamos no checkout!
        const userId = payment.external_reference;
        if (userId) {
           // Calcula o próximo mês
           const nextMonth = new Date();
           nextMonth.setMonth(nextMonth.getMonth() + 1);

           await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'active',
              current_period_end: nextMonth.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
            
           // Atualiza na profile tabela para forçar o frontend a liberar
           const isPremium = payment.description?.toLowerCase().includes('premium');
           
           await supabaseAdmin
            .from('profiles')
            .update({ plan_type: isPremium ? 'premium' : 'pro' })
            .eq('id', userId);
            
           console.log(`Assinatura ativada (Plano ${isPremium ? 'Premium' : 'Pro'}) para o usuário ${userId}`);
        }
      }
    } else if (topic === "subscription_preapproval") {
      const preapprovalId = body.data?.id;
      if (preapprovalId) {
        const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
        const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
          headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
        });
        const preapproval = await mpResponse.json();

        if (preapproval.status === 'cancelled') {
           const userId = preapproval.external_reference;
           if (userId) {
             await supabaseAdmin
              .from('user_subscriptions')
              .update({ status: 'canceled', updated_at: new Date().toISOString() })
              .eq('user_id', userId);

             await supabaseAdmin
              .from('profiles')
              .update({ plan_type: 'free' })
              .eq('id', userId);
              
             console.log(`Assinatura cancelada para o usuário ${userId}`);
           }
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
