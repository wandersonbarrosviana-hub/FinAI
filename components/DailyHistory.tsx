import React, { useMemo } from 'react';
import { Transaction, Account } from '../types';
import { X, ArrowUpCircle, ArrowDownCircle, Search, Calendar, Filter } from 'lucide-react';

interface DailyHistoryProps {
    transactions: Transaction[];
    accounts: Account[];
    onClose: () => void;
}

const DailyHistory: React.FC<DailyHistoryProps> = ({ transactions, accounts, onClose }) => {

    // Group transactions by date
    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: Transaction[] } = {};

        transactions.forEach(t => {
            const date = t.date.split('T')[0]; // Ensure YYYY-MM-DD
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(t);
        });

        // Sort dates descending
        const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        return sortedDates.map(date => ({
            date,
            items: groups[date]
        }));
    }, [transactions]);

    // Calculate totals
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00'); // Force noon to avoid timezone shift
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hoje';
        if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getDayOfWeek = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', { weekday: 'long' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                            <Calendar className="text-sky-600" size={24} />
                            Extrato Diário
                        </h2>
                        <p className="text-sm text-slate-400 mt-1 font-medium">Histórico completo de movimentações</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="flex md:grid md:grid-cols-3 gap-4 p-6 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 overflow-x-auto custom-scrollbar">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center min-w-[120px] flex-1">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1 tracking-widest">Entradas</p>
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-center min-w-[120px] flex-1">
                        <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase mb-1 tracking-widest">Saídas</p>
                        <p className="text-lg font-black text-rose-700 dark:text-rose-300">
                            R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className={`p-3 rounded-2xl border text-center min-w-[120px] flex-1 ${balance >= 0 ? 'bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30 text-sky-700 dark:text-sky-300' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                        <p className="text-[10px] font-black uppercase mb-1 tracking-widest text-slate-400 dark:text-slate-500">Saldo</p>
                        <p className={`text-lg font-black ${balance >= 0 ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Timeline List */}
                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {groupedTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <Filter size={48} className="mb-4 opacity-50" />
                            <p>Nenhuma transação encontrada.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800/50">
                            {groupedTransactions.map((group) => (
                                <div key={group.date} className="bg-white">
                                    {/* Date Header */}
                                    <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-4 border-y border-slate-100 flex items-baseline justify-between shadow-sm">
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                                            {formatDate(group.date)}
                                        </h3>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {getDayOfWeek(group.date)}
                                        </span>
                                    </div>

                                    {/* Transactions List */}
                                    <div className="px-2">
                                        {group.items.map((t, index) => (
                                            <div
                                                key={t.id}
                                                className={`flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all mx-2 my-1 ${index !== group.items.length - 1 ? 'border-b border-slate-50' : ''
                                                    }`}
                                            >
                                                {/* Icon & Info */}
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${t.type === 'income'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                        {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm truncate max-w-[150px] sm:max-w-none">{t.description}</p>
                                                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-medium uppercase tracking-tighter">
                                                            <span className="bg-slate-50 px-1.5 py-0.5 rounded text-[10px] border border-slate-100">
                                                                {t.category}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{accounts.find(a => a.id === t.account)?.name || 'Conta'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Amount & Status */}
                                                <div className="text-right">
                                                    <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <div className="mt-1">
                                                        {t.isPaid ? (
                                                            <span className="text-[10px] font-black text-emerald-600/70 flex items-center justify-end gap-1 uppercase tracking-widest">
                                                                ● Efetuado
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-amber-600/70 flex items-center justify-end gap-1 uppercase tracking-widest">
                                                                ○ Pendente
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyHistory;
