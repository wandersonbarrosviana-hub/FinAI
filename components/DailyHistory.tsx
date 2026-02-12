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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="text-cyan-400" size={24} />
                            Extrato Diário
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Histórico completo de movimentações</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-slate-950/30 border-b border-slate-800">
                    <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-center">
                        <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Entradas</p>
                        <p className="text-lg font-black text-emerald-400">
                            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20 text-center">
                        <p className="text-xs font-bold text-rose-400 uppercase mb-1">Saídas</p>
                        <p className="text-lg font-black text-rose-400">
                            R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className={`p-3 rounded-2xl border text-center ${balance >= 0 ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-slate-800 border-slate-700'}`}>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Saldo Período</p>
                        <p className={`text-lg font-black ${balance >= 0 ? 'text-cyan-400' : 'text-slate-300'}`}>
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
                                <div key={group.date} className="bg-slate-900/50">
                                    {/* Date Header */}
                                    <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm px-6 py-3 border-y border-slate-800/50 flex items-baseline justify-between shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-300">
                                            {formatDate(group.date)}
                                        </h3>
                                        <span className="text-xs font-medium text-slate-500 lowercase">
                                            {getDayOfWeek(group.date)}
                                        </span>
                                    </div>

                                    {/* Transactions List */}
                                    <div className="px-2">
                                        {group.items.map((t, index) => (
                                            <div
                                                key={t.id}
                                                className={`flex items-center justify-between p-4 hover:bg-slate-800/50 rounded-xl transition-colors mx-2 my-1 ${index !== group.items.length - 1 ? 'border-b border-slate-800/30' : ''
                                                    }`}
                                            >
                                                {/* Icon & Info */}
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-full ${t.type === 'income'
                                                            ? 'bg-emerald-500/10 text-emerald-400'
                                                            : 'bg-rose-500/10 text-rose-400'
                                                        }`}>
                                                        {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-200 text-sm">{t.description}</p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                                                                {t.category}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{accounts.find(a => a.id === t.account)?.name || 'Conta'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Amount & Status */}
                                                <div className="text-right">
                                                    <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                                                        }`}>
                                                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <div className="mt-1">
                                                        {t.isPaid ? (
                                                            <span className="text-[10px] font-bold text-emerald-500/70 flex items-center justify-end gap-1">
                                                                ● Efetuado
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-amber-500/70 flex items-center justify-end gap-1">
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
