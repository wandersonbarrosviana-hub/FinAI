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
            <div className="p-6 bg-[#1A1B1E] rounded-xl border border-[#2C2D33] text-center text-gray-500">
                Sem dados de proventos.
            </div>
        )
    }

    return (
        <div className="bg-[#1A1B1E] rounded-xl border border-[#2C2D33] overflow-hidden">
            <div className="p-4 border-b border-[#2C2D33]">
                <h3 className="text-lg font-bold text-white">Histórico de Pagamentos</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#25262B] text-slate-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Tipo</th>
                            <th className="p-4 font-semibold">Data Com</th>
                            <th className="p-4 font-semibold">Pagamento</th>
                            <th className="p-4 font-semibold text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2C2D33]">
                        {currentItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 text-sm text-white font-medium">
                                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs">{item.type}</span>
                                </td>
                                <td className="p-4 text-sm text-slate-300">{item.dateCom}</td>
                                <td className="p-4 text-sm text-slate-300">{item.paymentDate}</td>
                                <td className="p-4 text-sm text-[#00D084] font-bold text-right">
                                    {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-[#2C2D33] flex justify-between items-center bg-[#25262B]">
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs font-bold"
                >
                    <ChevronLeft size={16} /> Anterior
                </button>

                <span className="text-xs text-slate-500 font-medium">
                    Página {currentPage} de {totalPages}
                </span>

                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs font-bold"
                >
                    Próximo <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default DividendTable;
