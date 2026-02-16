import React, { useState } from 'react';
import { DividendEvent } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DividendTableProps {
    dividends: DividendEvent[];
}

const ITEMS_PER_PAGE = 10;

const DividendTable: React.FC<DividendTableProps> = ({ dividends }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(dividends.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = dividends.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(p => p - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
    };

    if (dividends.length === 0) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">Sem dados de proventos disponíveis.</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Histórico de Pagamentos</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Listagem Detalhada</p>
                </div>
            </div>

            <div className="overflow-hidden bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 dark:bg-slate-900 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Tipo</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[120px]">Data Com</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[120px]">Pagamento</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right min-w-[120px]">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {currentItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                                    <td className="p-5 sticky left-0 bg-slate-50 dark:bg-slate-900 group-hover:bg-white dark:group-hover:bg-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${item.type.includes('Dividendo')
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="p-5 text-sm text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">{item.dateCom}</td>
                                    <td className="p-5 text-sm text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">{item.paymentDate}</td>
                                    <td className="p-5 text-sm text-slate-900 dark:text-white font-black text-right whitespace-nowrap">
                                        {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} /> Anterior
                    </button>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                        {currentPage} <span className="mx-1 text-slate-200 dark:text-slate-700">/</span> {totalPages}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                        Próximo <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DividendTable;
