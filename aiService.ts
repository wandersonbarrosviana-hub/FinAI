import OpenAI from "openai";
import { Transaction, Account } from './types';
import { FINAI_CONFIG } from './config';

// Groq Config (Motor Único)
const GROQ_API_KEY = FINAI_CONFIG.GROQ_API_KEY;
const GROQ_MODEL = FINAI_CONFIG.GROQ_MODEL;
const GROQ_VISION_POOL = (FINAI_CONFIG as any).GROQ_VISION_POOL || ['llama-3.2-11b-vision-preview'];

// Função centralizada para pegar o cliente Groq
let groqInstance: OpenAI | null = null;
const getGroqClient = () => {
    if (groqInstance) return groqInstance;
    if (!GROQ_API_KEY) return null;

    try {
        groqInstance = new OpenAI({
            apiKey: GROQ_API_KEY,
            dangerouslyAllowBrowser: true,
            baseURL: "https://api.groq.com/openai/v1"
        });
        return groqInstance;
    } catch (e) {
        console.error("Erro ao instanciar cliente Groq:", e);
        return null;
    }
};

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
    if (!getGroqClient()) return "Erro: Chave API Groq não configurada.";
    try {
        const response = await getGroqClient()?.chat.completions.create({
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
    if (!getGroqClient()) return { intent: 'UNKNOWN', data: {}, message: 'Erro: Chave Groq não configurada.' };

    const systemPrompt = `
      CONTEXTO: API Financeira (PT-BR).
      TAREFA: Converter comando em JSON.
      INTENTS: CREATE, CREATE_ACCOUNT, CREATE_GOAL, CREATE_BUDGET.
      RETORNE APENAS O JSON { "intent": ..., "data": { ... }, "message": "..." }.
    `;

    try {
        const response = await getGroqClient()?.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Comando: "${text}"` }
            ]
        });
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(cleanJSON(content));
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
    if (!getGroqClient()) return "Erro: Groq não configurada.";

    const safeContext = JSON.stringify({
        total: accounts.reduce((acc, a) => acc + a.balance, 0),
        recent: transactions.slice(0, 10).map(t => ({ desc: t.description, val: t.amount, type: t.type }))
    });

    const systemPrompt = `Você é o FinAI, assistente pessoal. Contexto: ${safeContext}`;

    try {
        const response = await getGroqClient()?.chat.completions.create({
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
    if (!getGroqClient()) return null;
    const systemPrompt = `Extraia JSON de notificação: { "description": string, "amount": number, "type": "expense"|"income", "category": string, "date": "YYYY-MM-DD" }`;
    try {
        const response = await getGroqClient()?.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: notificationText }
            ]
        });
        const content = response.choices[0]?.message?.content || "{}";
        return JSON.parse(cleanJSON(content));
    } catch {
        return null;
    }
};

// --- INVOICE PARSING ---
export const parseInvoice = async (invoiceText: string): Promise<any> => {
    if (!getGroqClient()) return { error: "Groq não configurada." };
    const prompt = `Analise a fatura e retorne JSON { "items": [...], "total": number }. Texto: ${invoiceText.slice(0, 15000)}`;
    try {
        const response = await getGroqClient()?.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }]
        });
        const content = response.choices[0]?.message?.content || "{}";
        return JSON.parse(cleanJSON(content));
    } catch (error: any) {
        return { error: error.message };
    }
};

// --- OCR TEXT ANALYSIS (Nova Abordagem Híbrida) ---
export const analyzeOCRText = async (rawText: string): Promise<any> => {
    if (!getGroqClient()) return { error: "Groq não configurado" };

    const systemPrompt = `Você é um robô de extração financeira de ALTA PRECISÃO.
    REGRAS INQUEBRÁVEIS:
    1. DESCRIÇÃO: Deve ser o NOME DO ESTABELECIMENTO localizado no TOPO da nota. IGNORAR nomes de produtos.
    2. VALOR (amount): Deve ser o VALOR TOTAL FINAL localizado no RODAPÉ. Ignore subtotais ou valores de itens individuais.
    3. SCHEMA OBRIGATÓRIO (JSON):
    {
      "description": string (NOME DA LOJA),
      "amount": number (TOTAL FINAL),
      "category": string (Alimentação, Transporte, Saúde, Lazer, Moradia, Outros),
      "subCategory": string,
      "date": "YYYY-MM-DD",
      "paymentMethod": "Cartão de Crédito" | "PIX" | "Dinheiro" | "Débito",
      "recurrence": "one_time" | "installment",
      "installments": { "current": number, "total": number } | null,
      "confidence": number
    }`;

    const userPrompt = `Analise este texto de OCR e extraia o NOME DA LOJA e o VALOR TOTAL FINAL:
    """
    ${rawText}
    """`;

    try {
        const response = await getGroqClient()?.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        const content = response.choices[0].message.content || "{}";
        console.log("[AI-Analysis] OCR processado com sucesso.");
        return JSON.parse(cleanJSON(content));
    } catch (error: any) {
        console.error("[AI-Analysis] Erro na análise de texto:", error.message);
        throw error;
    }
};

// --- IMAGE OCR ANALYSIS ---
export const analyzeExpenseImage = async (base64Image: string): Promise<any> => {
    if (!getGroqClient()) return { error: "Groq não configurado" };

    const base64Data = base64Image.split(',')[1] || base64Image;
    const systemPrompt = `Você é um robô de visão financeira de ALTA PRECISÃO.
    REGRAS INQUEBRÁVEIS:
    1. DESCRIÇÃO: Deve ser o NOME DO ESTABELECIMENTO localizado no TOPO da imagem. IGNORAR nomes de produtos.
    2. VALOR (amount): Deve ser o VALOR TOTAL FINAL localizado no RODAPÉ.
    3. SCHEMA OBRIGATÓRIO (JSON):
    {
      "description": string (NOME DO LUGAR),
      "amount": number (VALOR TOTAL FINAL),
      "category": string,
      "subCategory": string,
      "date": "YYYY-MM-DD",
      "paymentMethod": string,
      "recurrence": "one_time" | "installment",
      "installments": { "current": number, "total": number } | null,
      "confidence": number
    }`;

    const userPromptText = `Identifique o NOME DA LOJA e o VALOR TOTAL no comprovante acima.`;

    for (let i = 0; i < GROQ_VISION_POOL.length; i++) {
        const currentModel = GROQ_VISION_POOL[i];
        console.log(`[OCR] Tentativa ${i} usando modelo: ${currentModel}`);

        try {
            const response = await getGroqClient()?.chat.completions.create({
                model: currentModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: userPromptText },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                        ]
                    }
                ],
                max_tokens: 1024,
                temperature: 0.1
            });

            const content = response.choices[0].message.content || "{}";
            console.log(`[OCR] Sucesso com modelo: ${currentModel}`);
            return JSON.parse(cleanJSON(content));

        } catch (error: any) {
            console.error(`[OCR] Falha no modelo ${currentModel}:`, error.message);
            // Se for erro 400 (Bad Request/Not Found) ou 404, continua para o próximo modelo
            const isModelMissing = error.message?.includes('400') || error.message?.includes('404') || error.message?.includes('not found');
            if (!isModelMissing && i < GROQ_VISION_POOL.length - 1) {
                // Se for outro erro mas ainda houver modelos, tenta o próximo
                continue;
            }
            if (i === GROQ_VISION_POOL.length - 1) {
                return { error: `Scanner indisponível: ${error.message}` };
            }
        }
    }
    return { error: "Nenhum modelo de visão disponível no momento." };
};

// --- ADVANCED AI INSIGHTS ---
export const getAdvancedAIInsights = async (
    transactions: Transaction[],
    accounts: Account[],
    budgets: any[],
    goals: any[]
): Promise<any> => {
    const client = getGroqClient();
    if (!client) {
        console.error("[FinAI] Groq Client not found");
        return null;
    }

    const context = {
        total_balance: accounts.reduce((acc, a) => acc + (a.balance || 0), 0),
        transactions: transactions.slice(0, 40).map(t => ({
            description: t.description,
            amount: t.amount,
            category: t.category,
            date: t.date
        }))
    };

    const systemPrompt = `Você é o analista financeiro senior FinAI. Sua tarefa é analisar os dados do usuário e retornar EXCLUSIVAMENTE um objeto JSON válido.
    REGRAS:
    - Retorne APENAS o JSON bruto, sem markdown ou explicações.
    - FIDELIDADE: Baseie o HealthScore no saldo real vs despesas.
    - PROJEÇÕES: 6 meses futuros obrigatórios.
    - IDIOMA: Português do Brasil (PT-BR).`;

    const userPrompt = `DADOS FINANCEIROS:
    ${JSON.stringify(context)}

    Gere o JSON seguindo este esquema:
    {
      "healthScore": { "score": 0-100, "liquidity": 0-100, "reserve": 0-100, "debt": 0-100, "stability": 0-100, "message": "string" },
      "emotionalPatterns": { "peakDay": "string", "peakCategory": "string", "impulsivityScore": 0-100, "description": "string", "highSpendingDays": [] },
      "scenarios": [{ "description": "string", "action": "string", "impact": "string", "targetObjective": "string" }],
      "projections": [{ "date": "YYYY-MM-DD", "amount": number }]
    }`;

    try {
        console.log("[FinAI] Solicitando insights avançados (Modo Robusto)...");
        const response = await client.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        const content = response.choices[0]?.message?.content || "{}";
        console.log("[FinAI] Conteúdo bruto da IA:", content.substring(0, 100) + "...");

        const rawParsed = JSON.parse(cleanJSON(content));

        // Pós-processamento com validação rigorosa
        const insights = {
            healthScore: {
                score: Math.min(100, Math.max(0, Number(rawParsed.healthScore?.score) ?? 0)),
                liquidity: Number(rawParsed.healthScore?.liquidity) || 0,
                reserve: Number(rawParsed.healthScore?.reserve) || 0,
                debt: Number(rawParsed.healthScore?.debt) || 0,
                stability: Number(rawParsed.healthScore?.stability) || 0,
                message: String(rawParsed.healthScore?.message || "Análise indisponível")
            },
            emotionalPatterns: {
                peakDay: String(rawParsed.emotionalPatterns?.peakDay || "Não identificado"),
                peakCategory: String(rawParsed.emotionalPatterns?.peakCategory || "Variado"),
                impulsivityScore: Number(rawParsed.emotionalPatterns?.impulsivityScore) || 0,
                description: String(rawParsed.emotionalPatterns?.description || "Sem padrões claros detectados."),
                highSpendingDays: (rawParsed.emotionalPatterns?.highSpendingDays || []).map((d: any) => ({
                    day: String(d.day || ""),
                    amount: Number(d.amount) || 0,
                    isImpulsive: Boolean(d.isImpulsive)
                }))
            },
            scenarios: (rawParsed.scenarios || []).map((s: any) => ({
                description: String(s.description || ""),
                action: String(s.action || ""),
                impact: String(s.impact || ""),
                targetObjective: String(s.targetObjective || "")
            })),
            projections: (rawParsed.projections || []).map((p: any) => ({
                date: String(p.date || ""),
                amount: Number(p.amount) || 0
            }))
        };

        console.log("[FinAI] Insights processados com sucesso.");
        return insights;
    } catch (error: any) {
        console.error("[FinAI] Erro crítico na API do Groq:", error);
        return null;
    }
};

// --- INVESTMENT ANALYSIS ---
export const getInvestmentAnalysis = async (investment: any): Promise<any> => {
    if (!getGroqClient()) return null;
    const prompt = `Analise este investimento e retorne JSON { score, recommendation, strengths, weaknesses, iaInsight }. DADOS: ${JSON.stringify(investment)}`;
    try {
        const response = await getGroqClient()?.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }]
        });
        const content = response.choices[0]?.message?.content || "{}";
        return JSON.parse(cleanJSON(content));
    } catch {
        return null;
    }
};

// --- DOCUMENT CONTENT ANALYSIS ---
export const analyzeDocumentContent = async (fileName: string, content: string): Promise<string> => {
    return generateContent(`Analise o arquivo "${fileName}" e resuma: ${content.slice(0, 10000)}`);
};
