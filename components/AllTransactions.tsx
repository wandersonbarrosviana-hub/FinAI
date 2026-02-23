import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ChevronLeft, Filter, Wallet, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle, Calendar } from 'lucide-react';

interface AllTransactionsProps {
    transactions: Transaction[];
    familyMembers?: Record<string, { name: string, avatar: string }>;
    onBack: () => void;
}

const AllTransactions: React.FC<AllTransactionsProps> = ({ transactions = [], familyMembers, onBack }) => {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const years = useMemo(() => {
        const yearSet = new Set<number>();
        yearSet.add(now.getFullYear());

        transactions.forEach(t => {
            if (t.date) {
                const year = new Date(t.date).getFullYear();
                if (!isNaN(year)) yearSet.add(year);
            }
        });

        return Array.from(yearSet).sort((a, b) => b - a);
    }, [transactions, now]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (!t.date) return false;
            const d = new Date(t.date);
            if (isNaN(d.getTime())) return false;
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedMonth, selectedYear]);

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            {/* Header Fixed Inside Modal */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-500 dark:text-slate-400 hover:text-sky-600 rounded-2xl transition-all border border-slate-100 dark:border-slate-800"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Histórico Completo</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Explore todos os seus lançamentos</p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm ring-1 ring-black/5">
                        <Calendar size={16} className="text-sky-500" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none uppercase tracking-widest cursor-pointer"
                        >
                            {months.map((m, i) => <option key={i} value={i} className="dark:bg-slate-950">{m}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm ring-1 ring-black/5">
                        <Filter size={16} className="text-sky-500" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none uppercase tracking-widest cursor-pointer"
                        >
                            {years.map(y => <option key={y} value={y} className="dark:bg-slate-950">{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* List Container */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5 overflow-hidden flex flex-col">
                <div className="overflow-y-auto scrollbar-hide flex-1">
                    {/* Desktop Table */}
                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md z-10">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-slate-800 dark:text-white">{t.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${t.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {t.isPaid ? 'Pago' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-black text-right pr-8 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-50 dark:divide-slate-800 px-2">
                        {filteredTransactions.length === 0 ? (
                            <div className="py-12 text-center flex flex-col items-center gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300">
                                    <ArrowUpCircle size={32} className="rotate-45 opacity-20" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 italic">Nenhum lançamento encontrado.</p>
                            </div>
                        ) : (
                            filteredTransactions.map(t => (
                                <div key={t.id} className="py-3 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                                                {t.description}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase tracking-tighter border border-slate-100 dark:border-slate-800 truncate max-w-[80px]">
                                                    {t.category}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                                                    {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end shrink-0">
                                            <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${t.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {t.isPaid ? 'Pago' : 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Wallet size={10} className="text-sky-500 flex-shrink-0" />
                                            <span className="text-[9px] font-bold text-slate-500 truncate">
                                                Carteira Principal
                                            </span>
                                        </div>
                                        {familyMembers && t.created_by && familyMembers[t.created_by] && (
                                            <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm flex-shrink-0">
                                                <img src={familyMembers[t.created_by].avatar} className="w-3 h-3 rounded-full" alt="Member" />
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
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
    );
};

export default AllTransactions;
