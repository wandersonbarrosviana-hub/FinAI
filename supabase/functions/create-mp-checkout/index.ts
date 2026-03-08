import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("Raw Request Body:", rawBody);

    if (!rawBody) throw new Error("Requisição vazia");

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      throw new Error("JSON inválido na requisição");
    }

    const { plan, userId, email, billingCycle = 'monthly' } = body;

    if (!plan || !userId) {
      throw new Error(`Parâmetros faltando: plan=${plan}, userId=${userId}`);
    }

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');

    if (!MP_ACCESS_TOKEN) {
      console.warn("Mercado Pago token não encontrado!");
      return new Response(JSON.stringify({
        error: "Configuração incompleta",
        detail: "ACCESS_TOKEN do Mercado Pago não encontrado nas Secrets do Supabase."
      }), {
        status: 200, // Força 200 para frontend ler JSON
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const planPrices: Record<string, { monthly: number, annual: number }> = {
      pro: { monthly: 8.99, annual: 90.99 },
      premium: { monthly: 13.99, annual: 143.99 }
    };

    const prices = planPrices[plan as string];
    if (!prices) throw new Error("Plano inválido.");

    const price = billingCycle === 'annual' ? prices.annual : prices.monthly;

    const payload = {
      back_url: "https://fin-ai-assist.vercel.app/?payment=success",
      reason: `FinAI - Plano ${plan.toUpperCase()} ${billingCycle.toUpperCase()}`,
      auto_recurring: {
        frequency: billingCycle === 'annual' ? 12 : 1,
        frequency_type: "months",
        transaction_amount: price,
        currency_id: "BRL"
      },
      payer_email: email || "usuario@finai.com.br",
      external_reference: userId,
      status: "authorized",
      // Adicionando metadados para facilitar identificação de PF se necessário no futuro
      metadata: {
        user_id: userId,
        plan: plan,
        cycle: billingCycle
      }
    };

    console.log(`[MP-Checkout] Gerando assinatura para User: ${userId}, Plano: ${plan}, Valor: ${price}`);

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error(`[MP-Error] Status: ${mpResponse.status}`);
      console.error(`[MP-Error] Body: ${JSON.stringify(mpData, null, 2)}`);
      
      return new Response(JSON.stringify({
        error: "Erro Mercado Pago",
        detail: mpData.message || mpData.error || "Erro desconhecido",
        status_code: mpResponse.status,
        mp_data: mpData // Retornar dado bruto para facilitar debug no alert
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_name: plan,
        status: 'pending',
        mp_subscription_id: mpData.id,
        current_period_start: new Date().toISOString()
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({ init_point: mpData.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Erro na função:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, // Força 200 para frontend ler JSON
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
