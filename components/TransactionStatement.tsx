
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 w-full md:w-auto focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar lançamentos..."
                        className="bg-transparent outline-none text-sm font-medium text-slate-700 placeholder-slate-400 w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    >
                        <option value="all">Todos</option>
                        <option value="income">Receitas</option>
                        <option value="expense">Despesas</option>
                    </select>

                    <div className="h-6 w-[1px] bg-slate-100 mx-2"></div>

                    <button onClick={handleExportXLSX} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-colors text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        <FileText size={16} /> Excel
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-colors text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto relative">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="sticky left-0 z-20 bg-slate-50 px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[100px]">Status</th>
                                <th className="sticky left-[100px] z-20 bg-slate-50 px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[200px]">Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Categoria/Conta</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="sticky left-0 z-10 bg-white px-6 py-4 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[100px]">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest whitespace-nowrap ${t.isPaid
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {t.isPaid ? 'PAGO' : 'PENDENTE'}
                                        </span>
                                    </td>
                                    <td className="sticky left-[100px] z-10 bg-white px-6 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[200px]">
                                        <div className="text-sm font-bold text-slate-700 whitespace-normal" title={t.description}>{t.description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap font-medium">
                                        {new Date(t.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-sky-600 uppercase tracking-tighter">{t.category}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {accounts.find(a => a.id === t.account)?.name || 'Conta desconhecida'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-right text-sm font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
