
import React from 'react';
import { Transaction, Account } from '../types';
import { X, Calendar, Wallet, Tag, ArrowUpCircle, ArrowDownCircle, Building2, Landmark, CreditCard, TrendingUp } from 'lucide-react';
import { BANKS } from '../constants';

interface SummaryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'accounts' | 'income' | 'expense' | 'transfer';
    data: {
        transactions?: Transaction[];
        accounts?: Account[];
    };
    color: string;
    familyMembers?: Record<string, { name: string, avatar: string }>;
}

const SummaryDetailModal: React.FC<SummaryDetailModalProps> = ({
    isOpen,
    onClose,
    title,
    type,
    data,
    color,
    familyMembers
}) => {
    if (!isOpen) return null;

    const getBankLogo = (bankId: string) => BANKS.find(b => b.id === bankId)?.logoUrl || '';
    const getBankName = (bankId: string) => BANKS.find(b => b.id === bankId)?.name || 'Outro';
    const getBankColor = (bankId: string) => BANKS.find(b => b.id === bankId)?.color || '#64748b';

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-950 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ring-1 ring-black/5"
                onClick={(e) => e.stopPropagation()}
            >
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
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {type === 'accounts'
                                    ? `${data.accounts?.length || 0} Instituições conectadas`
                                    : `${data.transactions?.length || 0} Lançamentos detectados`
                                }
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
                    <div className="space-y-4">
                        {type === 'accounts' ? (
                            data.accounts && data.accounts.length > 0 ? (
                                data.accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                                                <img src={getBankLogo(acc.bankId)} alt={acc.name} className="max-w-full max-h-full object-contain" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white text-base">{acc.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getBankName(acc.bankId)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-sky-600 dark:text-sky-400">
                                                R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            <div className="flex justify-end gap-1 mt-1">
                                                {acc.type === 'checking' && <CreditCard size={10} className="text-slate-400" />}
                                                {acc.type === 'savings' && <Landmark size={10} className="text-slate-400" />}
                                                {acc.type === 'investment' && <TrendingUp size={10} className="text-slate-400" />}
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {acc.type === 'checking' ? 'Corrente' : acc.type === 'savings' ? 'Poupança' : 'Investimento'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300">
                                        <Building2 size={40} className="opacity-20" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 italic">Nenhuma conta encontrada.</p>
                                </div>
                            )
                        ) : (
                            data.transactions && data.transactions.length > 0 ? (
                                data.transactions.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : t.type === 'expense' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'}`}>
                                                {t.type === 'income' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900 dark:text-white text-base truncate">{t.description}</p>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <span className="flex items-center gap-1"><Calendar size={12} className="text-sky-500" />{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                                    <span className="flex items-center gap-1"><Tag size={12} className="text-sky-500" />{t.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            {t.isPaid && <span className="text-[8px] font-black text-emerald-500 tracking-widest">PAGO</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300">
                                        <Tag size={40} className="opacity-20" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 italic">Nenhum lançamento encontrado.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Clique fora para fechar • Visão Detalhada FinAI
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SummaryDetailModal;
