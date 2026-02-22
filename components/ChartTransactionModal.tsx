
import React from 'react';
import { Transaction } from '../types';
import { X, Calendar, Wallet, Tag, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface ChartTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    transactions: Transaction[];
    color: string;
    familyMembers?: Record<string, { name: string, avatar: string }>;
}

const ChartTransactionModal: React.FC<ChartTransactionModalProps> = ({
    isOpen,
    onClose,
    title,
    transactions,
    color,
    familyMembers
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ring-1 ring-black/5">

                {/* Header */}
                <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-3 h-10 rounded-full"
                            style={{ backgroundColor: color }}
                        ></div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {title}
                            </h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {transactions.length} {transactions.length === 1 ? 'Transação' : 'Transações'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-2xl transition-all border border-slate-100 dark:border-slate-800 active:scale-95 group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
                    <div className="space-y-4">
                        {transactions.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300">
                                    <Tag size={40} className="opacity-20" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 italic">Nenhuma transação encontrada nesta categoria.</p>
                            </div>
                        ) : (
                            transactions.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-sky-100 dark:hover:border-sky-900/30 transition-all hover:shadow-md group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'}`}>
                                            {t.type === 'income' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 dark:text-white text-base truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                {t.description}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} className="text-sky-500" />
                                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Tag size={12} className="text-sky-500" />
                                                    {t.category}
                                                </span>
                                                {t.isPaid && (
                                                    <span className="text-emerald-500 flex items-center gap-1">
                                                        ● PAGO
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                                        <p className={`text-lg font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        {familyMembers && t.created_by && familyMembers[t.created_by] && (
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                                                <img
                                                    src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                                                    className="w-4 h-4 rounded-full"
                                                    alt="Member"
                                                />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
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

                {/* Footer */}
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Clique fora para fechar • FinAI de Alta Performance
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChartTransactionModal;
