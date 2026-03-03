import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import YahooFinance from "npm:yahoo-finance2@3.13.1";
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let ticker = url.searchParams.get('ticker');
    
    // Fallback if not in query params, try JSON body
    if (!ticker && req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json();
        ticker = body.ticker;
    }

    if (!ticker) {
      return new Response(JSON.stringify({ error: 'Ticker is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Auto-append .SA if it's a Brazilian stock format (usually 4 letters + 1-2 numbers)
    // Simple check: if it doesn't have a dot and looks like a B3 symbol
    let yfTicker = ticker.toUpperCase().trim();
    if (!yfTicker.includes('.') && /^[A-Z]{4}[0-9]{1,2}$/.test(yfTicker)) {
        yfTicker = `${yfTicker}.SA`;
    }

    console.log(`Fetching data for: ${yfTicker}`);

    // Fetch Base Fundamentals (P/B, ROE, Net Income)
    const quoteSummary = await yahooFinance.quoteSummary(yfTicker, {
        modules: ['defaultKeyStatistics', 'financialData']
    });

    // Fetch Historical Dividends (Last 6 Years)
    const today = new Date();
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(today.getFullYear() - 6);

    const historicalDividends = await yahooFinance.historical(yfTicker, {
        period1: sixYearsAgo,
        period2: today,
        events: 'dividends'
    }).catch((err) => {
        console.warn(`Failed to fetch dividends for ${yfTicker}:`, err);
        return [];
    });

    return new Response(JSON.stringify({
        ticker: yfTicker,
        quoteSummary: quoteSummary,
        dividends: historicalDividends
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error("Yahoo Finance Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
