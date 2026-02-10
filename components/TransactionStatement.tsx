
import React, { useState } from 'react';
import { Transaction, Account } from '../types';
import { FileText, Download, Filter, Search, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TransactionStatementProps {
    transactions: Transaction[];
    accounts: Account[];
}

const TransactionStatement: React.FC<TransactionStatementProps> = ({ transactions, accounts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

    const filtered = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleExportXLSX = () => {
        const data = filtered.map(t => ({
            Data: new Date(t.date).toLocaleDateString('pt-BR'),
            Descrição: t.description,
            Categoria: t.category,
            Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
            Valor: t.amount,
            Status: t.isPaid ? 'Pago' : 'Pendente',
            Conta: accounts.find(a => a.id === t.account)?.name || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Extrato");
        XLSX.writeFile(wb, "extrato_finai.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Extrato Financeiro - FinAI", 14, 22);

        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

        const tableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"];
        const tableRows = filtered.map(t => [
            new Date(t.date).toLocaleDateString('pt-BR'),
            t.description,
            t.category,
            t.type === 'income' ? 'Receita' : 'Despesa',
            `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            t.isPaid ? 'Pago' : 'Pendente'
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [14, 165, 233] } // Sky-500
        });

        doc.save("extrato_finai.pdf");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 w-full md:w-auto focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                    <Search size={18} className="text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar lançamentos..."
                        className="bg-transparent outline-none text-sm font-medium text-slate-200 placeholder-slate-600 w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    >
                        <option value="all">Todos</option>
                        <option value="income">Receitas</option>
                        <option value="expense">Despesas</option>
                    </select>

                    <div className="h-6 w-[1px] bg-slate-800 mx-2"></div>

                    <button onClick={handleExportXLSX} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors text-xs font-bold whitespace-nowrap">
                        <FileText size={16} /> Excel
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-colors text-xs font-bold whitespace-nowrap">
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50">
                            <tr>
                                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria/Conta</th>
                                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filtered.map((t) => (
                                <tr key={t.id} className="hover:bg-cyan-500/5 transition-colors group">
                                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-slate-400 whitespace-nowrap font-medium">
                                        {new Date(t.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                                        <div className="text-sm font-bold text-slate-200">{t.description}</div>
                                    </td>
                                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-cyan-500">{t.category}</span>
                                            <span className="text-[10px] text-slate-500">
                                                {accounts.find(a => a.id === t.account)?.name || 'Conta desconhecida'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`px-4 py-3 sm:px-6 sm:py-4 text-right text-sm font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]' : 'text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.3)]'
                                        }`}>
                                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${t.isPaid
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            }`}>
                                            {t.isPaid ? 'CONSOLIDADO' : 'PENDENTE'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic">
                                        Nenhum lançamento encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionStatement;
