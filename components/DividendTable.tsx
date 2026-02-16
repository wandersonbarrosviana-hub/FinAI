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
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Sem dados de proventos disponíveis.</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Histórico de Pagamentos</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Listagem Detalhada</p>
                </div>
            </div>

            <div className="overflow-hidden bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Tipo</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Data Com</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Pagamento</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right min-w-[120px]">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white transition-colors group">
                                    <td className="p-5 sticky left-0 bg-slate-50 group-hover:bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${item.type.includes('Dividendo')
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="p-5 text-sm text-slate-500 font-bold whitespace-nowrap">{item.dateCom}</td>
                                    <td className="p-5 text-sm text-slate-500 font-bold whitespace-nowrap">{item.paymentDate}</td>
                                    <td className="p-5 text-sm text-slate-900 font-black text-right whitespace-nowrap">
                                        {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white/50">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} /> Anterior
                    </button>

                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        {currentPage} <span className="mx-1 text-slate-200">/</span> {totalPages}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                        Próximo <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DividendTable;
