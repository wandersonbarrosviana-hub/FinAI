
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Transaction, Account } from './types';

// API Keys from Environment
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

// Initialize Clients
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const groq = GROQ_API_KEY ? new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    dangerouslyAllowBrowser: true // Vite/React requirement
}) : null;

// Models
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // High speed & stable

console.log("FinAI AI Service Initializing...");
console.log("Gemini Status:", GOOGLE_API_KEY ? "READY" : "MISSING");
console.log("Groq Status:", GROQ_API_KEY ? "READY" : "OPTIONAL");

interface VoiceCommandResult {
    intent: 'CREATE' | 'UPDATE_STATUS' | 'UNKNOWN' | 'ADVICE_REQUEST' | 'CREATE_ACCOUNT' | 'CREATE_GOAL' | 'CREATE_BUDGET';
    data: any;
    message?: string;
}

// Helper to clean Markdown JSON code blocks often returned by LLMs
const cleanJSON = (text: string): string => {
    let clean = text.replace(/```json\n?|\n?```/g, '').trim();
    // Try to find the first '{' and last '}' to handle potential preamble/postscript text
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
};

// Helper for Exponential Backoff Retry
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries: number = 3, delayMs: number = 2000): Promise<T> => {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            // Check for 429 (Rate Limit) or 503 (Service Unavailable)
            const isRateLimit = error.message?.includes('429') ||
                error.message?.includes('503') ||
                error.message?.includes('Resource has been exhausted') ||
                error.message?.toLowerCase().includes('retry');
            const isServiceOverloaded = error.message?.includes('503') || error.message?.includes('Overloaded');

            if (isRateLimit || isServiceOverloaded) {
                console.warn(`Attempt ${i + 1} failed (Rate Limit). Retrying in ${delayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 2; // Exponential backoff (2s -> 4s -> 8s)
            } else {
                throw error; // Throw other errors immediately
            }
        }
    }
    throw lastError;
};

export const generateContent = async (prompt: string): Promise<string> => {
    if (!GOOGLE_API_KEY && !GROQ_API_KEY) return "Erro: Chave API (Google ou Groq) não configurada.";

    // Logic: Try Gemini first if available, then Groq.
    try {
        return await retryOperation(async () => {
            if (genAI) {
                try {
                    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                } catch (geminiError) {
                    console.warn("Gemini Failed, checking for backup...");
                    if (!groq) throw geminiError;
                    // Proceed to Groq below
                }
            }

            if (groq) {
                console.log("Using Groq for Generation...");
                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [{ role: "user", content: prompt }],
                });
                return response.choices[0].message.content || "";
            }

            throw new Error("Nenhum serviço de IA disponível.");
        });
    } catch (error: any) {
        console.error("AI Generate Error:", error);
        if (error.message?.includes('429')) return "Erro: Limite de uso excedido (tente novamente mais tarde).";
        if (error.message?.includes('API key')) return "Erro: Chave API inválida ou expirada.";
        return `Erro de conexão com IA: ${error.message || 'Desconhecido'}`;
    }
};

export const parseVoiceCommand = async (text: string): Promise<VoiceCommandResult> => {
    if (!GOOGLE_API_KEY && !GROQ_API_KEY) {
        return { intent: 'UNKNOWN', data: {}, message: 'Erro: Chave API da IA não configurada.' };
    }

    const systemPrompt = `
      Aja como uma API de Parsing Financeiro especializado em Português do Brasil.
      Analise o comando de voz do usuário sobre finanças.
      Data Atual: ${new Date().toISOString().split('T')[0]}

      Seu objetivo principal é extrair transações (despesas/receitas) com PERFEIÇÃO.
      Trate números falados como "cinquenta reais", "mil e duzentos", "dois com cinquenta" corretamente.

      Intenções Possíveis:
      1. CREATE: Nova transação (despesa ou receita).
      2. UPDATE_STATUS: Marcar transação como paga/recebida.
      3. UNKNOWN: Não foi possível identificar uma ação financeira clara.

      Categorias Válidas: Alimentação, Moradia, Transporte, Lazer, Saúde, Educação, Investimentos, Salário, Renda Extra, Outros.

      Saída JSON ÚNICA. Formato:
      {
        "intent": "CREATE" | "UPDATE_STATUS" | "UNKNOWN",
        "data": {
          "description": "Descrição curta e clara",
          "amount": 123.45,
          "type": "expense" | "income",
          "category": "Uma das categorias válidas",
          "subCategory": "Subcategoria ou 'Diversos'",
          "paymentMethod": "PIX" | "Cartão de Crédito" | "Dinheiro" | "Boleto" | "Débito",
          "isPaid": true/false,
          "date": "YYYY-MM-DD"
        },
        "message": "Mensagem curta de confirmação"
      }
    `;

    try {
        return await retryOperation(async () => {
            let textResponse = "";

            if (genAI) {
                try {
                    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                    const result = await model.generateContent([systemPrompt, text]);
                    const response = await result.response;
                    textResponse = response.text();
                } catch (err) {
                    if (!groq) throw err;
                }
            }

            if (!textResponse && groq) {
                console.log("Using Groq for Voice Parsing...");
                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: text }
                    ],
                    response_format: { type: "json_object" }
                });
                textResponse = response.choices[0].message.content || "";
            }

            const cleaned = cleanJSON(textResponse);
            const parsed = JSON.parse(cleaned);

            if (parsed.data) {
                parsed.data.originalText = text;
            }
            return parsed;
        });

    } catch (error) {
        console.error('AI Parsing Error:', error);
        return { intent: 'UNKNOWN', data: { originalText: text }, message: 'Desculpe, não consegui entender o comando de voz.' };
    }
};


export const getFinancialAdvice = async (transactions: Transaction[], accounts: Account[]): Promise<string> => {
    // Legacy function redirect
    return chatWithFinancialAssistant("Dê uma dica rápida baseada no meu saldo atual.", transactions, accounts, [], []);
};

export const chatWithFinancialAssistant = async (
    userMessage: string,
    transactions: Transaction[],
    accounts: Account[],
    goals: any[],
    budgets: any[]
): Promise<string> => {
    if (!GOOGLE_API_KEY && !GROQ_API_KEY) return "Erro Config: Chave de API não detectada.";

    // Safe helpers
    const safeNum = (n: any) => typeof n === 'number' ? n : Number(n) || 0;

    // Prepare Context
    const balance = accounts.reduce((sum, acc) => sum + safeNum(acc.balance), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + safeNum(t.amount), 0);
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + safeNum(t.amount), 0);

    const recentTrans = transactions.slice(0, 10).map(t =>
        `- ${t.date}: ${t.description} (R$ ${safeNum(t.amount).toFixed(2)}) [${t.category}]`
    ).join('\n');

    const safeGoals = Array.isArray(goals) ? goals.map(g => ({ title: g.title, target: safeNum(g.target), current: safeNum(g.current) })) : [];
    const safeBudgets = Array.isArray(budgets) ? budgets.map(b => ({ category: b.category, amount: safeNum(b.amount) })) : [];

    const context = `
      CONTEXTO FINANCEIRO DO USUÁRIO:
      - Saldo Total Atual: R$ ${balance.toFixed(2)}
      - Total Receitas (Histórico): R$ ${income.toFixed(2)}
      - Total Despesas (Histórico): R$ ${expenses.toFixed(2)}
      - Metas Ativas: ${JSON.stringify(safeGoals)}
      - Orçamentos: ${JSON.stringify(safeBudgets)}
      
      ÚLTIMAS 10 TRANSAÇÕES:
      ${recentTrans}
    `;

    const systemPrompt = `
      Você é o FinAI, um assistente financeiro pessoal inteligente, amigável e extremamente capaz.
      
      ${context}
      
      INSTRUÇÕES:
      1. Analise os dados acima para responder com precisão.
      2. Se o usuário perguntar "posso gastar?", verifique o saldo e padrões de gasto.
      3. Seja conciso e direto.
      4. Responda sempre em Português do Brasil.
      5. Use Markdown.
    `;

    try {
        return await retryOperation(async () => {
            if (genAI) {
                try {
                    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                    const result = await model.generateContent([systemPrompt, userMessage]);
                    const response = await result.response;
                    return response.text();
                } catch (err) {
                    if (!groq) throw err;
                }
            }

            if (groq) {
                console.log("Using Groq for Chat...");
                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ]
                });
                return response.choices[0].message.content || "";
            }
            throw new Error("Nenhum serviço de IA disponível.");
        });

    } catch (error: any) {
        console.error("Chat Error:", error);
        return `Erro na IA: ${error.message?.substring(0, 50)}...`;
    }
};

export const performDeepAnalysis = async (transactions: Transaction[], accounts: Account[], goals: any[]): Promise<string> => {
    if (!GOOGLE_API_KEY && !GROQ_API_KEY) return "Erro: Chave API ausente.";

    const balance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const categoryMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const topCategories = Object.entries(categoryMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`)
        .join(', ');

    const systemPrompt = `
      Realize uma ANÁLISE PROFUNDA da saúde financeira deste usuário.
      
      DADOS:
      - Saldo Geral: R$ ${balance.toFixed(2)}
      - Top 5 Gastos por Categoria: ${topCategories}
      - Metas Definidas: ${JSON.stringify(goals)}
      
      Gere um relatório em Markdown com:
      1. **Diagnóstico Geral**
      2. **Análise de Gastos**
      3. **Insights de Economia**
      4. **Recomendação de Metas**
    `;

    try {
        return await retryOperation(async () => {
            if (genAI) {
                try {
                    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                    const result = await model.generateContent(systemPrompt);
                    const response = await result.response;
                    return response.text();
                } catch (err) {
                    if (!groq) throw err;
                }
            }

            if (groq) {
                console.log("Using Groq for Deep Analysis...");
                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [{ role: "user", content: systemPrompt }]
                });
                return response.choices[0].message.content || "";
            }
            throw new Error("Nenhum serviço de IA disponível.");
        });

    } catch (error) {
        console.error("Deep Analysis Error:", error);
        return "Não foi possível realizar a análise no momento.";
    }
};

export const parseNotification = async (notificationText: string): Promise<any> => {
    if (!API_KEY) return null;

    try {
        return await retryOperation(async () => {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            const systemPrompt = `
          Parse this notification text for a financial app.
          
          Return JSON ONLY:
          {
            "description": "Merchant Name or Description",
            "amount": 123.45,
            "type": "expense" | "income",
            "category": "Best guess category",
            "subCategory": "Best guess subcategory",
            "date": "YYYY-MM-DD" (assume today if missing)
          }
        `;

            const result = await model.generateContent([systemPrompt, notificationText]);
            const response = await result.response;
            const cleaned = cleanJSON(response.text());

            return JSON.parse(cleaned);
        });
    } catch (error) {
        return null;
    }
};
