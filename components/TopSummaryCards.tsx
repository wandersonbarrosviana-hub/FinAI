import React from 'react';
import { Building2, Plus, Minus, ArrowRightLeft, MoreVertical } from 'lucide-react';

interface TopSummaryCardsProps {
    totalBalance: number;
    monthIncome: number;
    monthExpense: number;
    transferBalance: number;
}

const TopSummaryCards: React.FC<TopSummaryCardsProps> = ({
    totalBalance,
    monthIncome,
    monthExpense,
    transferBalance
}) => {
    return (
        <div className="w-full mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200 tracking-tight">Visão geral</h2>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Contas Card */}
                <div className="bg-[#1976D2] rounded-2xl p-5 text-white flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Building2 size={24} className="text-white opacity-90" />
                    </div>
                    <div className="flex flex-col z-10">
                        <span className="text-xl sm:text-2xl font-semibold tracking-tight">
                            {totalBalance < 0 ? '-' : ''}R$ {Math.abs(totalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-medium text-blue-100/90">Contas</span>
                    </div>
                </div>

                {/* Receitas Card */}
                <div className="bg-[#0f9d58] rounded-2xl p-5 text-white flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Plus size={24} className="text-white opacity-90" />
                    </div>
                    <div className="flex flex-col z-10">
                        <span className="text-xl sm:text-2xl font-semibold tracking-tight">
                            R$ {monthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-medium text-emerald-100/90">Receitas</span>
                    </div>
                </div>

                {/* Despesas Card */}
                <div className="bg-[#DB4437] rounded-2xl p-5 text-white flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Minus size={24} className="text-white opacity-90" />
                    </div>
                    <div className="flex flex-col z-10">
                        <span className="text-xl sm:text-2xl font-semibold tracking-tight">
                            R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-medium text-rose-100/90">Despesas</span>
                    </div>
                </div>

                {/* Transferências Card */}
                <div className="bg-[#F4B400] rounded-2xl p-5 text-white flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <ArrowRightLeft size={24} className="text-white opacity-90" />
                    </div>
                    <div className="flex flex-col z-10">
                        <span className="text-xl sm:text-2xl font-semibold tracking-tight">
                            R$ {transferBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-medium text-yellow-50/90">Balanço transferências</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopSummaryCards;
