import OpenAI from "openai";
import { Transaction, Account } from './types';
import { FINAI_CONFIG } from './config';

// Groq Config (Motor Único)
const GROQ_API_KEY = FINAI_CONFIG.GROQ_API_KEY;
const GROQ_MODEL = FINAI_CONFIG.GROQ_MODEL;
const GROQ_VISION_MODEL = FINAI_CONFIG.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';

const groq = GROQ_API_KEY ? new OpenAI({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
    baseURL: "https://api.groq.com/openai/v1"
}) : null;

if (GROQ_API_KEY) {
    console.log("%c FinAI Groq UNIFIED Mode Active ", "background: #f59e0b; color: #fff; border-radius: 4px; font-weight: bold;");
} else {
    console.warn("%c FinAI AI Offline ", "background: #ef4444; color: #fff; border-radius: 4px; font-weight: bold;", "Chave Groq não encontrada no .env");
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

// Helper to clean Markdown JSON code blocks
const cleanJSON = (text: string): string => {
    let clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
};

// Security: Sanitize user input
const sanitizeInput = (text: string, maxLength = 4000): string => {
    if (!text || typeof text !== 'string') return '';
    const sanitized = text
        .replace(/ignore all above instructions/gi, '[filtered]')
        .replace(/forget your previous instructions/gi, '[filtered]')
        .trim();
    return sanitized.slice(0, maxLength);
};

// Helper for Exponential Backoff Retry
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries: number = 2, delayMs: number = 3000): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const errorMessage = error.message?.toLowerCase() || '';
            const isRetryable = errorMessage.includes('429') || errorMessage.includes('503') || errorMessage.includes('fetch');
            if (isRetryable) {
                console.warn(`Attempt ${i + 1} failed. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 1.5;
            } else {
                throw error;
            }
        }
    }
    throw lastError;
};

// --- CORE GENERATION ---
export const generateContent = async (prompt: string): Promise<string> => {
    if (!groq) return "Erro: Chave API Groq não configurada.";
    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }]
        });
        return response.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error("Groq Generate Error:", error.message);
        return `Erro: ${error.message}`;
    }
};

// --- VOICE COMMAND PARSING ---
export const parseVoiceCommand = async (text: string): Promise<VoiceCommandResult> => {
    if (!groq) return { intent: 'UNKNOWN', data: {}, message: 'Erro: Chave Groq não configurada.' };

    const systemPrompt = `
      CONTEXTO: API Financeira (PT-BR).
      TAREFA: Converter comando em JSON.
      INTENTS: CREATE, CREATE_ACCOUNT, CREATE_GOAL, CREATE_BUDGET.
      RETORNE APENAS O JSON { "intent": ..., "data": { ... }, "message": "..." }.
    `;

    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Comando: "${text}"` }
            ],
            response_format: { type: "json_object" }
        });
        const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
        if (parsed.data) parsed.data.originalText = text;
        return parsed;
    } catch (error: any) {
        console.error("Voice Error:", error);
        return { intent: 'UNKNOWN', data: { originalText: text }, message: 'Erro ao processar voz.' };
    }
};

// --- FINANCIAL CHAT ---
export const chatWithFinancialAssistant = async (
    userMessage: string,
    transactions: Transaction[],
    accounts: Account[],
    goals: any[],
    budgets: any[]
): Promise<string> => {
    if (!groq) return "Erro: Groq não configurada.";

    const safeContext = JSON.stringify({
        total: accounts.reduce((acc, a) => acc + a.balance, 0),
        recent: transactions.slice(0, 10).map(t => ({ desc: t.description, val: t.amount, type: t.type }))
    });

    const systemPrompt = `Você é o FinAI, assistente pessoal. Contexto: ${safeContext}`;

    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ]
        });
        return response.choices[0]?.message?.content || "";
    } catch (error: any) {
        return `Erro no Chat: ${error.message}`;
    }
};

export const performDeepAnalysis = async (transactions: Transaction[], accounts: Account[]): Promise<string> => {
    return chatWithFinancialAssistant("Faça uma análise profunda dos meus gastos recentes.", transactions, accounts, [], []);
};

// --- NOTIFICATION PARSING ---
export const parseNotification = async (notificationText: string): Promise<any> => {
    if (!groq) return null;
    const systemPrompt = `Extraia JSON de notificação: { "description": string, "amount": number, "type": "expense"|"income", "category": string, "date": "YYYY-MM-DD" }`;
    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: notificationText }
            ],
            response_format: { type: "json_object" }
        });
        return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch {
        return null;
    }
};

// --- INVOICE PARSING ---
export const parseInvoice = async (invoiceText: string): Promise<any> => {
    if (!groq) return { error: "Groq não configurada." };
    const prompt = `Analise a fatura e retorne JSON { "items": [...], "total": number }. Texto: ${invoiceText.slice(0, 15000)}`;
    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error: any) {
        return { error: error.message };
    }
};

// --- IMAGE OCR ANALYSIS ---
export const analyzeExpenseImage = async (base64Image: string): Promise<any> => {
    if (!groq || !GROQ_VISION_MODEL) return { error: "Groq Vision não configurado" };
    const base64Data = base64Image.split(',')[1] || base64Image;
    const systemPrompt = `Extraia dados financeiro da imagem em JSON: { description, amount, category, subCategory, date, paymentMethod, type, installments: { current, total }, confidence }.`;

    try {
        const combinedPrompt = `INSTRUÇÕES: ${systemPrompt}\nAnalise a imagem.`;
        const response = await groq.chat.completions.create({
            model: GROQ_VISION_MODEL,
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: combinedPrompt },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                ]
            }],
            max_tokens: 1024,
            temperature: 0.1
        });
        return JSON.parse(cleanJSON(response.choices[0].message.content || "{}"));
    } catch (error: any) {
        return { error: error.message };
    }
};

// --- ADVANCED AI INSIGHTS ---
export const getAdvancedAIInsights = async (
    transactions: Transaction[],
    accounts: Account[],
    budgets: any[],
    goals: any[]
): Promise<any> => {
    if (!groq) return null;
    const context = {
        bal: accounts.reduce((acc, a) => acc + a.balance, 0),
        tx: transactions.slice(0, 50).map(t => ({ d: t.description, v: t.amount, c: t.category }))
    };
    const prompt = `Gere insights financeiros profundos em JSON: { emotionalPatterns, scenarios, projections, healthScore }. DADOS: ${JSON.stringify(context)}`;
    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch {
        return null;
    }
};

// --- INVESTMENT ANALYSIS ---
export const getInvestmentAnalysis = async (investment: any): Promise<any> => {
    if (!groq) return null;
    const prompt = `Analise este investimento e retorne JSON { score, recommendation, strengths, weaknesses, iaInsight }. DADOS: ${JSON.stringify(investment)}`;
    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch {
        return null;
    }
};

// --- DOCUMENT CONTENT ANALYSIS ---
export const analyzeDocumentContent = async (fileName: string, content: string): Promise<string> => {
    return generateContent(`Analise o arquivo "${fileName}" e resuma: ${content.slice(0, 10000)}`);
};
