import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ChevronLeft, Filter, Calendar } from 'lucide-react';

interface AllTransactionsProps {
    transactions: Transaction[];
    familyMembers?: Record<string, { name: string, avatar: string }>;
    onBack: () => void;
}

const AllTransactions: React.FC<AllTransactionsProps> = ({ transactions, familyMembers, onBack }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const years = useMemo(() => {
        const uniqueYears = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear())));
        if (!uniqueYears.includes(new Date().getFullYear())) {
            uniqueYears.push(new Date().getFullYear());
        }
        return uniqueYears.sort((a, b) => b - a);
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedMonth, selectedYear]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <ChevronLeft className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Todos os Lançamentos</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Histórico completo de transações</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm w-full md:w-auto overflow-x-auto">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-100 dark:border-slate-800">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrar</span>
                    </div>

                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer py-1"
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer py-1"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Categoria</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {t.description}
                                            {t.created_by && familyMembers && familyMembers[t.created_by] && (
                                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full pr-2 border border-slate-200 dark:border-slate-700">
                                                    <img
                                                        src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                                                        alt={familyMembers[t.created_by].name}
                                                        className="w-4 h-4 rounded-full"
                                                    />
                                                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 max-w-[60px] truncate">
                                                        {familyMembers[t.created_by].name.split(' ')[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider transition-all">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${t.isPaid
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                            }`}>
                                            {t.isPaid ? 'Pago' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-black text-right whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm italic">
                                        Nenhum lançamento encontrado para este período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide pb-safe">
                        <div className="space-y-3">
                            {filteredTransactions.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 italic text-sm">
                                    Nenhum lançamento encontrado neste período.
                                </div>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 group hover:shadow-md transition-all active:scale-[0.98]">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1 overflow-hidden">
                                                <span className="text-sm font-bold text-slate-800 dark:text-white truncate" title={t.description}>{t.description}</span>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                                                        {t.category}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(t.date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1 shrink-0 ml-4">
                                                <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${t.isPaid
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                                    }`}>
                                                    {t.isPaid ? 'Pago' : 'Pendente'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-white dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                                                    <Wallet size={10} className="text-slate-400" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                                                    Carteira principal
                                                </span>
                                            </div>
                                            {familyMembers && t.created_by && familyMembers[t.created_by] && (
                                                <div className="flex items-center gap-1.5 font-bold text-slate-400">
                                                    <img
                                                        src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                                                        alt={familyMembers[t.created_by].name}
                                                        className="w-4 h-4 rounded-full border border-white dark:border-slate-700 shadow-sm"
                                                    />
                                                    <span className="text-[10px]">
                                                        {familyMembers[t.created_by].name.split(' ')[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllTransactions;
