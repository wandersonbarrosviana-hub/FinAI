
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction, Account } from './types';
import { FINAI_CONFIG } from './config';

// API Keys from Config
const GEMINI_API_KEY = FINAI_CONFIG.GEMINI_API_KEY;

// Initialize Google Generative AI
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Models
const GEMINI_MODEL = FINAI_CONFIG.GEMINI_MODEL;

if (GEMINI_API_KEY) {
    console.log("%c FinAI Gemini Ready ", "background: #4285f4; color: #fff; border-radius: 4px; font-weight: bold;");
} else {
    console.warn("%c FinAI AI Offline ", "background: #ef4444; color: #fff; border-radius: 4px; font-weight: bold;", "Chave Gemini não encontrada no .env");
}

export interface VoiceCommandResult {
    intent: 'CREATE' | 'UPDATE_STATUS' | 'UNKNOWN' | 'ADVICE_REQUEST'
    | 'CREATE_ACCOUNT' | 'UPDATE_ACCOUNT' | 'DELETE_ACCOUNT'
    | 'CREATE_GOAL' | 'UPDATE_GOAL' | 'DELETE_GOAL'
    | 'CREATE_BUDGET' | 'UPDATE_BUDGET' | 'DELETE_BUDGET'
    | 'SIMULATE_RETIREMENT';
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
    if (!GEMINI_API_KEY) return "Erro: Chave API Gemini não configurada.";

    try {
        return await retryOperation(async () => {
            if (genAI) {
                console.log("Using Gemini for Generation...");
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text() || "";
            }
            throw new Error("Serviço Gemini não inicializado.");
        });
    } catch (error: any) {
        console.error("AI Generate Error:", error);
        if (error.message?.includes('429')) return "Erro: Limite de uso excedido no Gemini (tente novamente mais tarde).";
        if (error.message?.includes('API key')) return "Erro: Chave API Gemini inválida ou expirada.";
        return `Erro de conexão com Gemini: ${error.message || 'Desconhecido'}`;
    }
};

export const parseVoiceCommand = async (text: string): Promise<VoiceCommandResult> => {
    if (!GEMINI_API_KEY) {
        console.error("FinAI: Tentativa de uso de voz sem chave configurada.");
        return { intent: 'UNKNOWN', data: {}, message: 'Erro: Chave API não detectada.' };
    }

    const systemPrompt = `
      CONTEXTO: API Financeira (PT-BR). Data atual: ${new Date().toISOString().split('T')[0]}.
      TAREFA: Converter comando de voz em JSON estruturado para uma aplicação financeira.
      
      INTENTS E ESTRUTURAS:
      1. CREATE: { "description": string, "amount": number, "type": "expense"|"income", "category": string, "isPaid": boolean, "date": "YYYY-MM-DD" }
      2. CREATE_ACCOUNT: { "name": string, "balance": number, "type": "checking"|"wallet"|"investment" }
      3. CREATE_GOAL: { "title": string, "target": number, "deadline": "YYYY-MM-DD" }
      4. CREATE_BUDGET: { "category": string, "amount": number }
      
      RETORNE APENAS O JSON.
    `;

    try {
        return await retryOperation(async () => {
            if (genAI) {
                const model = genAI.getGenerativeModel({
                    model: GEMINI_MODEL,
                    generationConfig: { responseMimeType: "application/json" }
                });

                const result = await model.generateContent([systemPrompt, `Comando do usuário: "${text}"`]);
                const textResponse = result.response.text();
                const parsed = JSON.parse(textResponse);

                if (parsed.data) {
                    parsed.data.originalText = text;
                }
                return parsed;
            }
            throw new Error("Serviço Gemini não inicializado.");
        });

    } catch (error) {
        console.error('AI Parsing Error:', error);
        return { intent: 'UNKNOWN', data: { originalText: text }, message: 'Desculpe, não consegui entender o comando de voz via Gemini.' };
    }
};

// Função de Chat Financeiro (Restaurada com Groq)
export const chatWithFinancialAssistant = async (
    userMessage: string,
    transactions: Transaction[],
    accounts: Account[],
    goals: any[],
    budgets: any[]
): Promise<string> => {
    if (!GEMINI_API_KEY) return "Erro: Chave API Gemini não configurada.";

    const financialContext = JSON.stringify({
        totalBalance: accounts.reduce((acc, a) => acc + a.balance, 0),
        recentTransactions: transactions.slice(0, 10).map(t => ({
            desc: t.description,
            value: t.amount,
            type: t.type,
            date: t.date
        })),
        goals: goals.map(g => ({ title: g.title, progress: (g.current / (g.target || 1)) * 100 })),
        budgets: budgets
    });

    const systemPrompt = `
      Você é o FinAI, um assistente financeiro pessoal inteligente, experiente e sarcástico (nível leve).
      Use o contexto financeiro abaixo para responder ao usuário.
      CONTEXTO FINANCEIRO DO USUÁRIO: ${financialContext}
    `;

    try {
        return await retryOperation(async () => {
            if (genAI) {
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                const chat = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: systemPrompt }] },
                        { role: "model", parts: [{ text: "Entendido. Sou o FinAI e estou pronto para ajudar com sarcasmo e inteligência." }] },
                    ],
                });

                const result = await chat.sendMessage(userMessage);
                return result.response.text();
            }
            throw new Error("Gemini não inicializado.");
        });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return `Erro na IA (${error.message || 'Desconhecido'}). Verifique sua chave ou limite de uso.`;
    }
};

// Deep Analysis também pode ser um chat wrapper simples agora
export const performDeepAnalysis = async (transactions: Transaction[], accounts: Account[]): Promise<string> => {
    return chatWithFinancialAssistant("Faça uma análise profunda dos meus gastos recentes e me dê 3 dicas.", transactions, accounts, [], []);
};

export const parseNotification = async (notificationText: string): Promise<any> => {
    if (!GEMINI_API_KEY) return null;

    try {
        return await retryOperation(async () => {
            const systemPrompt = `
          Extraia os dados financeiros desta notificação bancária.
          RETORNE APENAS JSON:
          {
            "description": string,
            "amount": number,
            "type": "expense" | "income",
            "category": string,
            "date": "YYYY-MM-DD"
          }
        `;

            if (genAI) {
                const model = genAI.getGenerativeModel({
                    model: GEMINI_MODEL,
                    generationConfig: { responseMimeType: "application/json" }
                });
                const result = await model.generateContent([systemPrompt, notificationText]);
                return JSON.parse(result.response.text());
            }
            return null;
        });
    } catch (error) {
        console.error("Notification Parse Error:", error);
        return null;
    }
};

// --- INVOICE PARSING ---
export const parseInvoice = async (invoiceText: string): Promise<any> => {
    if (!GEMINI_API_KEY) {
        console.warn("Gemini API Key missing for invoice parsing.");
        return { error: "Chave de API da Gemini não configurada." };
    }

    const truncatedText = invoiceText.slice(0, 30000); // Gemini tem janela maior, aumentei de 15k para 30k

    const parserPrompt = `
    Analise o texto da fatura de cartão de crédito e extraia as transações.
    Retorne APENAS um objeto JSON com esta estrutura:
    {
      "items": [
        {
          "date": "YYYY-MM-DD",
          "description": string,
          "amount": number,
          "installmentCurrent": number | null,
          "installmentTotal": number | null
        }
      ],
      "total": number,
      "confidence": number
    }
    TEXTO DA FATURA:
    ${truncatedText}
    `;

    try {
        if (!genAI) throw new Error("GenAI não inicializado");

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(parserPrompt);
        const content = result.response.text();

        console.log("Gemini Raw Response:", content);
        return JSON.parse(content);
    } catch (error: any) {
        console.error("Error parsing invoice with Gemini:", error);
        return { items: [], error: `Erro na Gemini: ${error.message}` };
    }
};
