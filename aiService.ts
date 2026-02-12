
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction, Account } from './types';

// Initialize the Google Gemini API
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);
// Using gemini-2.0-flash as it is the latest stable version available
const MODEL_NAME = 'gemini-2.0-flash';

console.log("FinAI AI Service Initializing (Gemini)...");
console.log("API Key Status:", API_KEY ? "Present" : "MISSING");

interface VoiceCommandResult {
    intent: 'CREATE' | 'UPDATE_STATUS' | 'UNKNOWN' | 'ADVICE_REQUEST' | 'CREATE_ACCOUNT' | 'CREATE_GOAL' | 'CREATE_BUDGET';
    data: any;
    message?: string;
}

// Helper to clean Markdown JSON code blocks often returned by LLMs
const cleanJSON = (text: string): string => {
    return text.replace(/```json\n?|\n?```/g, '').trim();
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
    if (!API_KEY) return "Erro: Chave API do Google (VITE_GOOGLE_API_KEY) não configurada.";

    try {
        return await retryOperation(async () => {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        });
    } catch (error: any) {
        console.error("Gemini Generate Error:", error);
        if (error.message?.includes('429')) return "Erro: Limite de uso excedido (tente novamente mais tarde).";
        if (error.message?.includes('API key')) return "Erro: Chave API inválida ou expirada.";
        return `Erro de conexão com IA: ${error.message || 'Desconhecido'}`;
    }
};

export const parseVoiceCommand = async (text: string): Promise<VoiceCommandResult> => {
    if (!API_KEY) {
        return { intent: 'UNKNOWN', data: {}, message: 'Erro: Chave API da IA não configurada (VITE_GOOGLE_API_KEY).' };
    }

    try {
        return await retryOperation(async () => {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            const systemPrompt = `
          Act as a Financial Parsing API. Analyze the user's spoken command regarding finances.
          Current Date: ${new Date().toISOString().split('T')[0]}
    
          Possible Intents:
          1. CREATE: New transaction (expense/income).
          2. UPDATE_STATUS: Mark a transaction as paid/received.
          3. ADVICE_REQUEST: User is asking for financial advice.
          4. CREATE_ACCOUNT: User wants to create a new bank account.
          5. CREATE_GOAL: User wants to create a financial goal.
          6. CREATE_BUDGET: User wants to set a budget limit.
    
          Output JSON ONLY. Format:
          {
            "intent": "CREATE" | "UPDATE_STATUS" | "ADVICE_REQUEST" | "CREATE_ACCOUNT" | "CREATE_GOAL" | "CREATE_BUDGET" | "UNKNOWN",
            "data": {
              // For CREATE (Transaction):
              "description": "Short description",
              "amount": 123.45 (number),
              "type": "expense" | "income",
              "category": "One of: Alimentação, Moradia, Transporte, Lazer, Saúde, Educação, Investimentos, Salário, Renda Extra, Outros",
              "subCategory": "Best guess or 'Diversos'",
              "paymentMethod": "PIX" | "Cartão de Crédito" | "Dinheiro" | "Boleto" | "Débito",
              "isPaid": true/false (default true for expense if past/now, false if future; true for income usually),
              "date": "YYYY-MM-DD" (infer from context like "yesterday", "tomorrow", "next friday", default to today)
              
              // For CREATE_ACCOUNT:
              "name": "Bank Name",
              "balance": 1000.00,
              "type": "checking" | "savings" | "investment"
    
              // For CREATE_GOAL:
              "title": "Goal Title",
              "target": 5000.00,
              "category": "Best guess",
              "deadline": "YYYY-MM-DD" (optional)
    
              // For CREATE_BUDGET:
              "category": "Category to limit",
              "amount": 500.00
    
              // For UPDATE_STATUS:
              "searchDescription": "Keywords to find transaction",
              "newStatus": true (paid) | false (pending)
            },
            "message": "Short conversational confirmation message (Portuguese)"
          }
        `;

            const result = await model.generateContent([systemPrompt, text]);
            const response = await result.response;
            const textResponse = response.text();

            const cleaned = cleanJSON(textResponse);
            const parsed = JSON.parse(cleaned);

            if (parsed.data) {
                parsed.data.originalText = text;
            }
            return parsed;
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        return { intent: 'UNKNOWN', data: { originalText: text }, message: 'Desculpe, não consegui entender (tente novamente).' };
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
    if (!API_KEY) return "Erro Config: Chave do Google não detectada.";

    try {
        return await retryOperation(async () => {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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
          3. Seja conciso, direto, mas educado.
          4. Se não souber algo (ex: dados muito antigos não listados), diga que só tem acesso aos dados recentes.
          5. Responda sempre em Português do Brasil.
          6. Use formatação Markdown (negrito, listas) para facilitar a leitura.
        `;

            const result = await model.generateContent([systemPrompt, userMessage]); // Gemini doesn't strictly have system roles in generateContent like Chat, but prepending works well or use startChat.
            // For single turn, prepending is fine. For multi-turn, startChat is better.
            // Using simple generateContent for now to keep it stateless like before.
            const response = await result.response;
            return response.text();
        });

    } catch (error: any) {
        console.error("Chat Error Details:", error);
        if (error.message?.includes('429') || error.message?.toLowerCase().includes('retry')) return "Erro: Muito tráfego na IA. Aguarde um momento.";
        return `Erro na IA: ${error.message?.substring(0, 50)}... (Verifique a Chave)`;
    }
};

export const performDeepAnalysis = async (transactions: Transaction[], accounts: Account[], goals: any[]): Promise<string> => {
    if (!API_KEY) return "Erro: Chave API ausente.";

    try {
        return await retryOperation(async () => {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME }); // Use defined model constant

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
          1. **Diagnóstico Geral**: Situação atual (Crítica, Estável, Confortável).
          2. **Análise de Gastos**: Onde está indo o dinheiro.
          3. **Insights de Economia**: Sugestões práticas baseadas nas categorias de maior gasto.
          4. **Recomendação de Metas**: Se não houver metas, sugira. Se houver, avalie o progresso.
          
          Tom profissional mas acessível.
        `;

            const result = await model.generateContent(systemPrompt);
            const response = await result.response;
            return response.text();
        });

    } catch (error) {
        console.error("Deep Analysis Error:", error);
        return "Não foi possível realizar a análise no momento (Tente novamente).";
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
