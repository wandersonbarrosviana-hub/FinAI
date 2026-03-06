
import { supabase } from './supabaseClient';
import { Transaction, Account, Budget, FinancialScore, QuizResponse, Debt } from './types';

export const calculateFinancialScore = async (
    userId: string,
    transactions: Transaction[],
    accounts: Account[],
    budgets: Budget[],
    debts: Debt[],
    quizResponses?: QuizResponse
): Promise<Partial<FinancialScore>> => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

    // 0. Buscar Investimentos
    const { data: assets } = await supabase
        .from('wallet_assets')
        .select('quantity, purchase_price, symbol')
        .eq('wallet_id', (await supabase.from('wallets').select('id').eq('user_id', userId)).data?.[0]?.id); // Simplificado para primeira carteira

    const investmentValue = assets?.reduce((acc, a) => acc + (a.quantity * a.purchase_price), 0) || 0;

    // Buscar quiz se não fornecido
    let activeQuiz = quizResponses;
    if (!activeQuiz) {
        const { data: quizData } = await supabase
            .from('financial_quiz_responses')
            .select('*')
            .eq('user_id', userId)
            .eq('month', currentMonth)
            .single();
        if (quizData) activeQuiz = quizData as QuizResponse;
    }

    // 1. ESTRUTURA (Max 200) - Reduzi de 250
    const structureScore = calculateStructure(transactions, budgets);

    // 2. ESTABILIDADE (Max 250) - Reduzi de 300
    const stabilityScore = calculateStability(accounts, debts, transactions, investmentValue);

    // 3. COMPORTAMENTO (Max 200) - Reduzi de 250
    const behaviorScore = calculateBehavior(transactions);

    // 4. INVESTIMENTO (Max 200) - NOVO
    const investmentScore = calculateInvestmentPoints(assets || [], transactions, investmentValue);

    // 5. PSICOLOGIA (Max 150) - Reduzi de 200
    const psychologyScore = calculatePsychology(activeQuiz);

    const totalScore = Math.min(1000, structureScore + stabilityScore + behaviorScore + investmentScore + psychologyScore);

    return {
        user_id: userId,
        total_score: Math.round(totalScore),
        structure_score: Math.round(structureScore),
        stability_score: Math.round(stabilityScore),
        behavior_score: Math.round(behaviorScore),
        psychology_score: Math.round(psychologyScore),
        investment_score: Math.round(investmentScore), // Adicionado no types.ts previamente ou assumindo suporte
        month: currentMonth
    };
};

function calculateInvestmentPoints(assets: any[], transactions: Transaction[], totalInvested: number): number {
    let score = 0;
    
    // Diversificação (Max 80)
    const uniqueAssets = new Set(assets.map(a => a.symbol)).size;
    score += Math.min(80, uniqueAssets * 10); // 8 ativos = 80 pts

    // Aporte Mensal (Max 120)
    const monthlyInvestments = transactions
        .filter(t => t.category === 'Investimentos' && t.type === 'expense' && t.isPaid)
        .reduce((acc, t) => acc + t.amount, 0);
    
    const income = transactions
        .filter(t => t.type === 'income' && t.isPaid)
        .reduce((acc, t) => acc + t.amount, 0) || 1;

    const investRate = monthlyInvestments / income;
    score += Math.min(120, investRate * 600); // 20% aporte = 120 pts

    return score;
}

function calculateStructure(transactions: Transaction[], budgets: Budget[]): number {
    let score = 0;

    // Consistência: dias com lançamentos (Max 100)
    const daysWithTx = new Set(transactions.map(t => t.date.slice(8, 10))).size;
    score += Math.min(100, (daysWithTx / 20) * 100); // 20 dias sugerem alta consistência

    // Orçamento (Max 100)
    if (budgets.length > 0) {
        const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
        const totalSpent = transactions
            .filter(t => t.type === 'expense' && t.isPaid)
            .reduce((acc, t) => acc + t.amount, 0);

        if (totalSpent <= totalBudget) {
            score += 100;
        } else {
            const overspent = totalSpent - totalBudget;
            score += Math.max(0, 100 - (overspent / totalBudget) * 100);
        }
    } else {
        score += 50; // Neutro se não tiver orçamento definido
    }

    // Categorização (Max 50)
    const othersTx = transactions.filter(t => t.category.toLowerCase() === 'outros').length;
    const othersRatio = transactions.length > 0 ? othersTx / transactions.length : 0;
    if (othersRatio < 0.1) score += 50;
    else score += Math.max(0, 50 - (othersRatio * 100));

    return score;
}

function calculateStability(accounts: Account[], debts: Debt[], transactions: Transaction[], investmentValue: number = 0): number {
    let score = 0;

    const liquidBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
    const totalReserve = liquidBalance + investmentValue;
    
    const monthlyExpenses = transactions
        .filter(t => t.type === 'expense' && t.isPaid)
        .reduce((acc, t) => acc + t.amount, 0) || 1; // avoid div by 0

    // Reserva (Max 120) - Ajustado peso
    const monthsOfReserve = totalReserve / monthlyExpenses;
    score += Math.min(120, monthsOfReserve * 20); // 6 meses = 120 pts

    // Endividamento (Max 130)
    const monthlyIncome = transactions
        .filter(t => t.type === 'income' && t.isPaid)
        .reduce((acc, t) => acc + t.amount, 0) || 1;

    const monthlyDebtPayment = debts.reduce((acc, d) => acc + (d.installmentValue || 0), 0);
    const debtRatio = monthlyDebtPayment / monthlyIncome;

    if (debtRatio <= 0.1) score += 130;
    else score += Math.max(0, 130 - (debtRatio * 250));

    return score;
}

function calculateBehavior(transactions: Transaction[]): number {
    let score = 0;

    const income = transactions.filter(t => t.type === 'income' && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' && t.isPaid).reduce((acc, t) => acc + t.amount, 0);

    // Taxa de Poupança (Max 150)
    const savings = income - expense;
    const savingsRate = income > 0 ? savings / income : 0;
    score += Math.min(150, Math.max(0, savingsRate * 500)); // 30% saving = 150 pts

    // Evolução (Max 100) - Simplificado para gastos sob controle
    if (income > expense) score += 100;
    else score += Math.max(0, 100 - ((expense - income) / (income || 1)) * 100);

    return score;
}

function calculatePsychology(quiz?: QuizResponse): number {
    if (!quiz) return 100; // Valor médio inicial
    const values = Object.values(quiz.responses || {});
    if (values.length === 0) return 100;

    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    return (avg / 5) * 200; // 5 é a nota máxima por pergunta
}

export const saveFinancialScore = async (score: Partial<FinancialScore>) => {
    const { data, error } = await supabase
        .from('financial_scores')
        .upsert(score, { onConflict: 'user_id, month' });

    if (error) throw error;
    return data;
};

export const getGlobalRanking = async (month: string) => {
    const { data, error } = await supabase
        .from('global_financial_ranking')
        .select('*')
        .eq('month', month)
        .order('total_score', { ascending: false });

    if (error) throw error;
    return data;
};
