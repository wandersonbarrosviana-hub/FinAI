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
    const { plan, userId, email, billingCycle = 'monthly' } = await req.json();

    if (!plan || !userId) {
      throw new Error("Parameters 'plan' and 'userId' are required.");
    }

    // Mercado Pago Preapproval configuration
    // The MP_ACCESS_TOKEN and MP_WEBHOOK_URL must be configured in Supabase Secrets
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
    
    // We mock the response if no MP Token is found in the environment to prevent crashing on the frontend
    if (!MP_ACCESS_TOKEN) {
      console.warn("Mercado Pago token not found! Returning mock URL.");
      return new Response(JSON.stringify({ 
        init_point: "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=mock",
        mocked: true,
        message: "O sistema está em modo desenvolvedor pois o ACCESS_TOKEN não foi configurado."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Plans values synchronized with PlansPage
    const planPrices: Record<string, { monthly: number, annual: number }> = {
      pro: { monthly: 8.99, annual: 90.99 },
      premium: { monthly: 13.99, annual: 143.99 }
    };

    const prices = planPrices[plan as string];
    if (!prices) {
      throw new Error("Plano inválido.");
    }
    
    const price = billingCycle === 'annual' ? prices.annual : prices.monthly;
    const frequency = billingCycle === 'annual' ? 12 : 1;
    const frequencyType = "months";

    const frontendUrl = Deno.env.get('FRONTEND_URL') || "http://localhost:5173";

    const payload = {
      back_url: `${frontendUrl}/?payment=success`, // Garantindo navegação pelo React sem Router
      reason: `FinAI - Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)} ${billingCycle === 'annual' ? 'Anual' : 'Mensal'}`,
      auto_recurring: {
        frequency: frequency,
        frequency_type: frequencyType,
        transaction_amount: price,
        currency_id: "BRL"
      },
      payer_email: email || "cliente@finai.com.br",
      external_reference: userId, // Passamos o userID para vincular

      status: "authorized"
    };

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
      console.error("Mercado Pago Error:", mpData);
      throw new Error("Erro ao criar assinatura no Mercado Pago.");
    }

    // Insert or update state as 'pending' in our DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Save pending subscription
    await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_name: plan,
        status: 'pending',
        mp_subscription_id: mpData.id,
        current_period_start: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({ init_point: mpData.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Error creating checkout:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
