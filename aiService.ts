

import OpenAI from "openai";
import { Transaction, Account } from './types';
import { FINAI_CONFIG } from './config';

// API Keys from Config
const GROQ_API_KEY = FINAI_CONFIG.GROQ_API_KEY;

// Initialize Client
const groq = GROQ_API_KEY ? new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    dangerouslyAllowBrowser: true // Vite/React requirement
}) : null;

// Models
const GROQ_MODEL = FINAI_CONFIG.GROQ_MODEL; // High speed & stable

if (GROQ_API_KEY) {
    console.log("%c FinAI Voice Ready ", "background: #22c55e; color: #fff; border-radius: 4px; font-weight: bold;");
} else {
    console.warn("%c FinAI Voice Offline ", "background: #ef4444; color: #fff; border-radius: 4px; font-weight: bold;", "Chave não encontrada no .env");
}

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
    if (!GROQ_API_KEY) return "Erro: Chave API Groq não configurada.";

    try {
        return await retryOperation(async () => {
            if (groq) {
                console.log("Using Groq for Generation...");
                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [{ role: "user", content: prompt }],
                });
                return response.choices[0].message.content || "";
            }
            throw new Error("Serviço Groq não inicializado.");
        });
    } catch (error: any) {
        console.error("AI Generate Error:", error);
        if (error.message?.includes('429')) return "Erro: Limite de uso excedido no Groq (tente novamente mais tarde).";
        if (error.message?.includes('API key')) return "Erro: Chave API Groq inválida ou expirada.";
        return `Erro de conexão com Groq: ${error.message || 'Desconhecido'}`;
    }
};

export const parseVoiceCommand = async (text: string): Promise<VoiceCommandResult> => {
    if (!GROQ_API_KEY) {
        console.error("FinAI: Tentativa de uso de voz sem chave configurada.");
        return { intent: 'UNKNOWN', data: {}, message: 'Erro: Chave API não detectada.' };
    }

    // Prompt Otimizado e RESTRIÇÃO JSON FORTE
    const systemPrompt = `
      CONTEXTO: API Financeira (PT-BR). Data: ${new Date().toISOString().split('T')[0]}.
      TAREFA: Converter comando de voz em JSON estruturado.
      FORMATO DE RESPOSTA: Apenas JSON válido. Sem markdown, sem explicação.
      
      SCHEMA:
      {
        "intent": "CREATE" | "UPDATE_STATUS" | "UNKNOWN",
        "data": {
          "description": "string",
          "amount": number,
          "type": "expense" | "income",
          "category": "string",
          "isPaid": boolean,
          "date": "YYYY-MM-DD"
        }
      }

      EXEMPLOS:
      "Gastei 50 na padaria" -> {"intent":"CREATE","data":{"description":"Padaria","amount":50,"type":"expense","category":"Alimentação"}}
      "Recebi 1000 reais" -> {"intent":"CREATE","data":{"description":"Recebimento","amount":1000,"type":"income","category":"Salário"}}
    `;

    try {
        return await retryOperation(async () => {
            if (groq) {
                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: text }
                    ],
                    temperature: 0.1, // Mais determinístico
                    response_format: { type: "json_object" }
                });

                const textResponse = response.choices[0].message.content || "";
                const cleaned = cleanJSON(textResponse);
                const parsed = JSON.parse(cleaned);

                if (parsed.data) {
                    parsed.data.originalText = text;
                }
                return parsed;
            }
            throw new Error("Serviço Groq não inicializado.");
        });

    } catch (error) {
        console.error('AI Parsing Error:', error);
        return { intent: 'UNKNOWN', data: { originalText: text }, message: 'Desculpe, não consegui entender o comando de voz via Groq.' };
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
    if (!GROQ_API_KEY) return "Erro: Chave API Groq não configurada.";

    // Preparar Contexto Financeiro Resumido (evitar estouro de tokens)
    const financialContext = JSON.stringify({
        totalBalance: accounts.reduce((acc, a) => acc + a.balance, 0),
        recentTransactions: transactions.slice(0, 10).map(t => ({
            desc: t.description,
            value: t.amount,
            type: t.type,
            date: t.date
        })),
        goals: goals.map(g => ({ title: g.title, progress: (g.current / g.target) * 100 })),
        budgets: budgets
    });

    const systemPrompt = `
      Você é o FinAI, um assistente financeiro pessoal inteligente, experiente e sarcástico (nível leve).
      Use o contexto financeiro abaixo para responder ao usuário.
      Se não souber, diga que não sabe. Seja direto, prático e use emojis.
      Dê conselhos curtos e acionáveis.
      
      CONTEXTO FINANCEIRO DO USUÁRIO:
      ${financialContext}
    `;

    try {
        return await retryOperation(async () => {
            if (groq) {
                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.7, // Um pouco mais criativo que o parser
                    max_tokens: 500
                });
                return response.choices[0].message.content || "Fiquei sem palavras.";
            }
            throw new Error("Groq não inicializado.");
        });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return "Desculpe, meu cérebro de silício deu um nó. Tente de novo.";
    }
};

// Deep Analysis também pode ser um chat wrapper simples agora
export const performDeepAnalysis = async (transactions: Transaction[], accounts: Account[]): Promise<string> => {
    return chatWithFinancialAssistant("Faça uma análise profunda dos meus gastos recentes e me dê 3 dicas.", transactions, accounts, [], []);
};

export const parseNotification = async (notificationText: string): Promise<any> => {
    if (!GROQ_API_KEY) return null;

    try {
        return await retryOperation(async () => {
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

            if (groq) {
                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: notificationText }
                    ],
                    response_format: { type: "json_object" }
                });
                const cleaned = cleanJSON(response.choices[0].message.content || "");
                return JSON.parse(cleaned);
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
    // Basic check, might rely on config.ts or env directly
    const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';

    if (!apiKey) {
        console.warn("Groq API Key missing for invoice parsing.");
        return { error: "API Key missing" };
    }

    // Truncate text if too long to avoid token limits (optimistic approach)
    const truncatedText = invoiceText.slice(0, 15000);

    const parserPrompt = `
    Analyze the following credit card invoice text and extract the transactions.
    Return ONLY a valid JSON object with this structure:
    {
      "items": [
        {
          "date": "YYYY-MM-DD", // Date of purchase. Use current year if missing.
          "description": "Store Name", // Clean up the name
          "amount": 100.00, // Positive number
          "installmentCurrent": 1, // If installment (e.g., 01/10), else null
          "installmentTotal": 10 // If installment, else null
        }
      ],
      "total": 0.00,
      "confidence": 0.9
    }

    Rules:
    - Ignore payments, credits, or subtotal lines. Only new purchases/installments.
    - Convert all dates to YYYY-MM-DD.
    - If a transaction is an installment (e.g. "Parc 01/10"), extract current and total.
    - Return JSON only. No markdown.

    INVOICE TEXT:
    ${truncatedText}
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a specialized financial data extractor. You output strictly valid JSON." },
                { role: "user", content: parserPrompt }
            ],
            model: "llama3-70b-8192", // High intelligence needed for unstructured text
            temperature: 0.1, // Low temp for precision
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No content from Groq");

        return JSON.parse(content);
    } catch (error) {
        console.error("Error parsing invoice with Groq:", error);
        return { items: [], error: "Failed to parse invoice" };
    }
};
