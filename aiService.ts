
import OpenAI from 'openai';
import { Transaction, Account } from './types';

// Initialize the OpenAI API
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const openai = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true // Client-side usage for demo purposes
});

const MODEL = 'gpt-4o-mini';

interface VoiceCommandResult {
    intent: 'CREATE' | 'UPDATE_STATUS' | 'UNKNOWN' | 'ADVICE_REQUEST' | 'CREATE_ACCOUNT' | 'CREATE_GOAL' | 'CREATE_BUDGET';
    data: any;
    message?: string;
}

export const generateContent = async (prompt: string): Promise<string> => {
    console.log("generateContent called. API Key length:", API_KEY?.length);
    if (!API_KEY) {
        console.error("API Key is missing in generateContent");
        return "Erro: Chave API não encontrada.";
    }
    try {
        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
        });
        return completion.choices[0].message.content || "";
    } catch (error) {
        console.error("OpenAI Generate Error:", error);
        return "Erro ao conectar com a IA.";
    }
};

export const parseVoiceCommand = async (text: string): Promise<VoiceCommandResult> => {
    if (!API_KEY) {
        console.warn('OpenAI API Key missing');
        return { intent: 'UNKNOWN', data: {}, message: 'Erro: Chave API da IA não configurada no .env.local' };
    }

    try {
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

        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content");

        const parsed = JSON.parse(content);
        // Inject original text for context
        if (parsed.data) {
            parsed.data.originalText = text;
        }
        return parsed;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return { intent: 'UNKNOWN', data: { originalText: text }, message: 'Desculpe, não consegui entender.' };
    }
};


export const getFinancialAdvice = async (transactions: Transaction[], accounts: Account[]): Promise<string> => {
    // Legacy function, using chat
    return chatWithFinancialAssistant("Dê uma dica rápida baseada no meu saldo atual.", transactions, accounts, [], []);
};

export const chatWithFinancialAssistant = async (
    userMessage: string,
    transactions: Transaction[],
    accounts: Account[],
    goals: any[],
    budgets: any[]
): Promise<string> => {
    console.log("chatWithFinancialAssistant called. API Key available:", !!API_KEY);
    if (!API_KEY) return "Erro: Chave API não configurada. Verifique o .env.local";

    try {
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

        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ]
        });

        return completion.choices[0].message.content || "Desculpe, não consegui gerar uma resposta.";
    } catch (error) {
        console.error("Chat Error Details:", error);
        return `Erro ao processar: ${(error as any).message || "Falha desconhecida"}`;
    }
};

export const performDeepAnalysis = async (transactions: Transaction[], accounts: Account[], goals: any[]): Promise<string> => {
    if (!API_KEY) return "Erro: Chave API ausente.";

    try {
        // Aggregating data for token efficiency
        const balance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        // Category breakdown
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

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Use stronger model for deep analysis if possible, typically available. If not, fallback to mini.
            messages: [
                { role: "user", content: systemPrompt } // System prompt fits in user for simple analysis or spread it.
            ]
        });

        return completion.choices[0].message.content || "Não foi possível realizar a análise.";

    } catch (error) {
        console.error("Deep Analysis Error:", error);
        return `Erro na análise: ${(error as any).message || "Falha desconhecida"}`;
    }
};

export const parseNotification = async (notificationText: string): Promise<any> => {
    if (!API_KEY) return null;

    try {
        const systemPrompt = `
            Parse this notification text for a financial app.
            
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

        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: notificationText }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        return content ? JSON.parse(content) : null;
    } catch (error) {
        return null;
    }
};
