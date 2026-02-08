import { GoogleGenerativeAI } from '@google/generative-ai';
import { Transaction, Account } from './types';

// Initialize the API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper to get the model
const getModel = () => genAI.getGenerativeModel({ model: 'gemini-pro' });

interface VoiceCommandResult {
    intent: 'CREATE' | 'UPDATE_STATUS' | 'UNKNOWN' | 'ADVICE_REQUEST';
    data: any;
    message?: string;
}

export const generateContent = async (prompt: string): Promise<string> => {
    if (!API_KEY) return "";
    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Generate Error:", error);
        return "";
    }
};

export const parseVoiceCommand = async (text: string): Promise<VoiceCommandResult> => {
    if (!API_KEY) {
        console.warn('Gemini API Key missing');
        return { intent: 'UNKNOWN', data: {}, message: 'Erro: Chave API da IA não configurada.' };
    }

    try {
        const model = getModel();
        // Prompt design for robust extraction
        const prompt = `
      Act as a Financial Parsing API. Analyze the user's spoken command regarding finances.
      Current Date: ${new Date().toISOString().split('T')[0]}

      User Input: "${text}"

      Possible Intents:
      1. CREATE: New transaction (expense/income).
      2. UPDATE_STATUS: Mark a transaction as paid/received.
      3. ADVICE_REQUEST: User is asking for financial advice.

      Output JSON ONLY. Format:
      {
        "intent": "CREATE" | "UPDATE_STATUS" | "ADVICE_REQUEST" | "UNKNOWN",
        "data": {
          // For CREATE:
          "description": "Short description",
          "amount": 123.45 (number),
          "type": "expense" | "income",
          "category": "One of: Alimentação, Moradia, Transporte, Lazer, Saúde, Educação, Investimentos, Salário, Renda Extra, Outros",
          "subCategory": "Best guess or 'Diversos'",
          "paymentMethod": "PIX" | "Cartão de Crédito" | "Dinheiro" | "Boleto" | "Débito",
          "isPaid": true/false (default true for expense if past/now, false if future; true for income usually),
          "date": "YYYY-MM-DD" (infer from context like "yesterday", "tomorrow", "next friday", default to today)
          
          // For UPDATE_STATUS:
          "searchDescription": "Keywords to find transaction",
          "newStatus": true (paid) | false (pending)
        },
        "message": "Short conversational confirmation message (Portuguese)"
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Gemini API Error:', error);
        return { intent: 'UNKNOWN', data: {}, message: 'Desculpe, não consegui entender.' };
    }
};

export const getFinancialAdvice = async (transactions: Transaction[], accounts: Account[]): Promise<string> => {
    if (!API_KEY) return "Serviço de IA indisponível (Chave API ausente).";

    try {
        const model = getModel();
        const balance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

        const simpleContext = `
      Saldo Total: R$ ${balance.toFixed(2)}
      Receitas (Total Histórico): R$ ${income.toFixed(2)}
      Despesas (Total Histórico): R$ ${expenses.toFixed(2)}
      
      Últimas 5 transações:
      ${transactions.slice(0, 5).map(t => `- ${t.date}: ${t.description} (R$ ${t.amount})`).join('\n')}
    `;

        const prompt = `
      Act as a wise, friendly personal finance advisor named "FinAI".
      Analyze this user's summary and give 1 paragraph of specific, actionable advice or encouragement in Portuguese.
      Be concise. Not generic.
      User Data:
      ${simpleContext}
    `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Getting advice error:', error);
        return "Não foi possível gerar um conselho agora. Tente mais tarde!";
    }
};

export const parseNotification = async (notificationText: string): Promise<any> => {
    if (!API_KEY) return null;

    try {
        const model = getModel();
        const prompt = `
      Parse this notification text for a financial app.
      Text: "${notificationText}"
      
      Return JSON:
      {
        "description": "Merchant Name or Description",
        "amount": 123.45,
        "type": "expense" | "income",
        "category": "Best guess category",
        "subCategory": "Best guess subcategory",
        "date": "YYYY-MM-DD" (assume today if missing)
      }
    `;

        const result = await model.generateContent(prompt);
        const jsonStr = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        return null;
    }
};
