
import { Transaction, Account } from './types';

interface LocalResponse {
    text: string;
    action?: 'NAVIGATE_DASHBOARD' | 'NAVIGATE_EXPENSES' | 'NAVIGATE_INCOME';
}

export const processLocalQuery = (
    query: string,
    transactions: Transaction[],
    accounts: Account[]
): LocalResponse => {
    const lowerQuery = query.toLowerCase();

    // Helper to calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });

    // 1. Balance Parsing
    if (lowerQuery.includes('saldo') || lowerQuery.includes('tenho') || lowerQuery.includes('dinheiro')) {
        return {
            text: `Seu saldo total atual é de **R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** somando todas as contas.`
        };
    }

    // 2. Expenses Parsing
    if (lowerQuery.includes('gasto') || lowerQuery.includes('despesa') || lowerQuery.includes('gastos') || lowerQuery.includes('saiu')) {
        // Detailed category breakdown if asked
        if (lowerQuery.includes('com') || lowerQuery.includes('em')) {
            // Check for specific categories
            // Simple extraction: logic to match category names from transaction list
            const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));
            const matchedCategory = uniqueCategories.find(cat => lowerQuery.includes(cat.toLowerCase()));

            if (matchedCategory) {
                const catTotal = transactions
                    .filter(t => t.type === 'expense' && t.category === matchedCategory)
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                return {
                    text: `Em **${matchedCategory}**, você gastou um total de **R$ ${catTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** neste período.`
                };
            }
        }

        return {
            text: `Neste mês de ${currentMonth}, suas despesas somam **R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**.`
        };
    }

    // 3. Income Parsing
    if (lowerQuery.includes('receita') || lowerQuery.includes('ganhei') || lowerQuery.includes('entrada')) {
        return {
            text: `Suas receitas em ${currentMonth} totalizam **R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**.`
        };
    }

    // 4. Balanço / Resumo
    if (lowerQuery.includes('resumo') || lowerQuery.includes('balanço') || lowerQuery.includes('situação')) {
        const result = totalIncome - totalExpenses;
        const status = result >= 0 ? 'positivo' : 'negativo';
        return {
            text: `Resumo de ${currentMonth}:\n\n` +
                `📥 Entradas: R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                `📤 Saídas: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                `💰 Balanço: R$ ${result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${status})`
        };
    }

    // 5. Greetings / Help
    if (lowerQuery.includes('oi') || lowerQuery.includes('olá') || lowerQuery.includes('ajuda')) {
        return {
            text: "Olá! Sou sua Assistente Financeira Virtual. Posso te ajudar com perguntas como:\n" +
                "- Qual meu saldo atual?\n" +
                "- Quanto gastei este mês?\n" +
                "- Quanto gastei com Alimentação?\n" +
                "- Qual meu resumo financeiro?"
        };
    }

    // Default Fallback
    return {
        text: "Desculpe, ainda estou aprendendo. Tente perguntar sobre 'saldo', 'gastos', 'receitas' ou 'resumo'."
    };
};
