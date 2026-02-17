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
                <div className="md:hidden flex flex-col divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredTransactions.map((t) => (
                        <div key={t.id} className="p-4 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                                        {t.description}
                                    </span>
                                    {t.created_by && familyMembers && familyMembers[t.created_by] && (
                                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full pr-2 border border-slate-200 dark:border-slate-700 min-w-fit">
                                            <img
                                                src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                                                alt={familyMembers[t.created_by].name}
                                                className="w-3 h-3 rounded-full"
                                            />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                                    {t.category}
                                </span>
                            </div>
                            <div className={`text-sm font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm italic">
                            Nenhum lançamento encontrado para este período.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllTransactions;
