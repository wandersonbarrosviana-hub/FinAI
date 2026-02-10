
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

export const processVoiceAction = (text: string): any => {
    const lowerText = text.toLowerCase();

    // Patterns
    // 1. Expense: "Gastei [Valor] com [Categoria]" or "Compra de [Valor] em [Categoria]"
    const expensePattern = /(?:gastei|compra de|paguei)\s+(?:r\$)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:reais)?\s*(?:com|em|no|na)\s+(.+)/i;

    // 2. Income: "Recebi [Valor] de [Fonte]" or "Ganhei [Valor]"
    const incomePattern = /(?:recebi|ganhei|entrada de)\s+(?:r\$)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:reais)?\s*(?:de|com)?\s*(.*)/i;

    const expenseMatch = lowerText.match(expensePattern);
    if (expenseMatch) {
        const amountStr = expenseMatch[1].replace(',', '.');
        const amount = parseFloat(amountStr);
        const categoryRaw = expenseMatch[2].trim();

        // Categorization logic (simple mapping or default)
        // We'll let the UI handle exact category matching or default to 'Outros'
        return {
            intent: 'CREATE',
            data: {
                type: 'expense',
                amount: amount,
                category: capitalize(categoryRaw), // Helper needed
                subCategory: 'Outros',
                description: `Despesa com ${categoryRaw}`,
                date: new Date().toISOString().split('T')[0],
                isPaid: true,
                paymentMethod: 'Débito' // Default
            },
            message: `Entendido! Lançando despesa de R$ ${amount} em ${categoryRaw}.`
        };
    }

    const incomeMatch = lowerText.match(incomePattern);
    if (incomeMatch) {
        const amountStr = incomeMatch[1].replace(',', '.');
        const amount = parseFloat(amountStr);
        const description = incomeMatch[2].trim() || 'Receita Extra';

        return {
            intent: 'CREATE',
            data: {
                type: 'income',
                amount: amount,
                category: 'Renda Extra',
                subCategory: 'Outros',
                description: capitalize(description),
                date: new Date().toISOString().split('T')[0],
                isPaid: true,
                paymentMethod: 'PIX'
            },
            message: `Boa! Registrando receita de R$ ${amount}.`
        };
    }

    return { intent: 'UNKNOWN' };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
