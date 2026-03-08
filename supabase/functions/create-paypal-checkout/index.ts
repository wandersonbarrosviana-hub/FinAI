import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Autenticação para obter o Token de Acesso da API do PayPal
async function getPayPalAccessToken(clientId: string, secret: string) {
  const credentials = btoa(`${clientId}:${secret}`);
  
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Erro ao obter PayPal Token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// Cria a Order (Pedido)
async function createPayPalOrder(accessToken: string, price: number, plan: string, billingCycle: string, userId: string) {
  const planNames = {
    pro: "Plano PRO",
    premium: "PRO Premium"
  };
  const planoNome = planNames[plan as keyof typeof planNames] || plan;
  
  const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: userId,
        description: `FinAI - ${planoNome} (${billingCycle})`,
        custom_id: JSON.stringify({
           user_id: userId,
           plan: plan,
           cycle: billingCycle
        }),
        amount: {
          currency_code: 'BRL',
          value: price.toFixed(2)
        }
      }],
      application_context: {
        brand_name: "FinAI",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: "https://fin-ai-assist.vercel.app/?payment=success",
        cancel_url: "https://fin-ai-assist.vercel.app/?payment=cancelled"
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Erro ao criar Order PayPal: ${JSON.stringify(data)}`);
  }
  return data;
}

serve(async (req) => {
  // 1. Lidar com o preflight CORS primeiro
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
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

    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET');

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      console.warn("PayPal credentials não encontradas!");
      return new Response(JSON.stringify({
        error: "Configuração incompleta",
        detail: "Client ID ou Secret do PayPal não encontrado nas Secrets do Supabase."
      }), {
        status: 200, 
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

    console.log(`[PayPal-Checkout] Gerando pedido para User: ${userId}, Plano: ${plan}, Valor: ${price}`);

    const accessToken = await getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_SECRET);
    
    const orderData = await createPayPalOrder(accessToken, price, plan, billingCycle, userId);

    const approvalUrl = orderData.links.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
       throw new Error("Não foi possível gerar a URL de aprovação do PayPal");
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
        mp_subscription_id: orderData.id, 
        current_period_start: new Date().toISOString()
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({ init_point: approvalUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Erro na função:", error.message);
    // IMPORTANTE: Sempre retornar os corsHeaders mesmo no erro
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, // Idealmente 400 em vez de 200 para erros REAIS
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
