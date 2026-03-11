import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push@3.6.7";

// Defina as chaves VAPID geradas. 
// Para gerar um par real: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB2bSYzNn7kceZf9c3sLqGIf8';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'YOUR_PRIVATE_KEY_HERE_CHANGE_IN_PROD';

webpush.setVapidDetails(
  'mailto:contato@finai.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  try {
    // Inicializa Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca usuários com notificações ligadas e push subscription válida
    const { data: usersSettings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('user_id, push_subscription, budget_alert_threshold, goal_alert_threshold')
      .eq('notifications_enabled', true)
      .not('push_subscription', 'is', null);

    if (settingsError) throw settingsError;
    if (!usersSettings || usersSettings.length === 0) {
      return new Response(JSON.stringify({ message: "No users active for push" }), { status: 200 });
    }

    let sentCount = 0;

    for (const setting of usersSettings) {
      const userId = setting.user_id;
      const sub = typeof setting.push_subscription === 'string' 
            ? JSON.parse(setting.push_subscription) 
            : setting.push_subscription;

      // === ALERTA DE ORÇAMENTO (BUDGETS) ===
      const { data: budgets } = await supabaseClient
        .from('budgets')
        .select('name, amount, spent')
        .eq('user_id', userId);

      if (budgets) {
        for (const b of budgets) {
          const percentage = (b.spent / b.amount) * 100;
          if (percentage >= setting.budget_alert_threshold) {
             const payload = JSON.stringify({
                title: 'Alerta de Orçamento ⚠️',
                body: `Seu orçamento '${b.name}' atingiu ${percentage.toFixed(0)}% do limite.`,
                url: '/budgets'
             });
             try {
                await webpush.sendNotification(sub, payload);
                sentCount++;
             } catch (e) { console.error("Push Error (Budget)", e); }
          }
        }
      }

      // === ALERTA DE METAS (GOALS) ===
      const { data: goals } = await supabaseClient
        .from('goals')
        .select('name, target_amount, current_amount')
        .eq('user_id', userId)
        .eq('status', 'in_progress');

      if (goals) {
        for (const g of goals) {
          const percentage = (g.current_amount / g.target_amount) * 100;
          if (percentage >= setting.goal_alert_threshold && percentage < 100) {
             const payload = JSON.stringify({
                title: 'Aviso de Meta 🎯',
                body: `Sua meta '${g.name}' está quase lá, com ${percentage.toFixed(0)}% concluídos!`,
                url: '/goals'
             });
             try {
                await webpush.sendNotification(sub, payload);
                sentCount++;
             } catch (e) { console.error("Push Error (Goal)", e); }
          } else if (percentage >= 100) {
             const payload = JSON.stringify({
                title: 'Meta Atingida! 🏆',
                body: `Parabéns! Você alcançou a meta '${g.name}'.`,
                url: '/goals'
             });
             try {
                await webpush.sendNotification(sub, payload);
                sentCount++;
             } catch (e) { console.error("Push Error (Goal Achieved)", e); }
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: `Successfully sent ${sentCount} notifications`, sentCount }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
