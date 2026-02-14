

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
                console.log("🎤 Enviando para Groq:", text); // DEBUG

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
                console.log("🤖 Resposta Bruta Groq:", textResponse); // DEBUG IMPORTANTE

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


// Funções de Chat e Análise removidas a pedido do usuário.
// O foco agora é execução direta de comandos e parsing de notificações.

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
