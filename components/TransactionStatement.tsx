import React, { useState } from 'react';
import { Transaction, Account } from '../types';
import { FileText, Download, Filter, Search, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle, Paperclip, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TransactionStatementProps {
    transactions: Transaction[];
    accounts: Account[];
    familyMembers?: Record<string, { name: string, avatar: string }>;
}

const TransactionStatement: React.FC<TransactionStatementProps> = ({ transactions, accounts, familyMembers }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
    const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

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
        <div className="space-y-[var(--fluid-space-md)]">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-[var(--fluid-space-sm)] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-5 py-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 w-full md:w-auto focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
                    <Search size={20} className="text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar lançamentos..."
                        className="bg-transparent outline-none text-[var(--fluid-text-sm)] font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto pb-1 md:pb-0">
                    <div className="relative flex-1 md:flex-none">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="w-full md:w-auto px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest outline-none focus:ring-2 focus:ring-sky-500/20 transition-all appearance-none cursor-pointer pr-10"
                        >
                            <option value="all">Todos Fluxos</option>
                            <option value="income">Só Receitas</option>
                            <option value="expense">Só Despesas</option>
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button onClick={handleExportXLSX} className="flex items-center justify-center p-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all shadow-sm active:scale-95" title="Exportar Excel">
                            <FileText size={20} />
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center justify-center p-3.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all shadow-sm active:scale-95" title="Exportar PDF">
                            <Download size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-safe ring-1 ring-black/5 dark:ring-white/5">
                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50 px-[var(--fluid-space-sm)]">
                    {filtered.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 italic text-sm font-medium">
                            Nenhum lançamento encontrado.
                        </div>
                    ) : (
                        filtered.map((t) => (
                            <div key={t.id} className="py-5 flex flex-col gap-4 group active:bg-slate-50 dark:active:bg-slate-800/30 transition-colors rounded-2xl px-2 -mx-2">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex gap-4 overflow-hidden">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : t.type === 'expense' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' : 'bg-sky-50 dark:bg-sky-950/20 text-sky-600'}`}>
                                            {t.type === 'income' ? <ArrowUpCircle size={20} /> : t.type === 'expense' ? <ArrowDownCircle size={20} /> : <ArrowRightCircle size={20} />}
                                        </div>
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <span className="text-[var(--fluid-text-sm)] font-black text-slate-800 dark:text-white truncate tracking-tight">{t.description}</span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                                                    {t.category}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`text-[var(--fluid-text-sm)] font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-[0.5rem] text-[8px] font-black uppercase tracking-[0.1em] ${t.isPaid
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                            {t.isPaid ? 'Efetuado' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 bg-white dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-sm">
                                            <Wallet size={12} className="text-sky-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                            {accounts.find(a => a.id === t.account)?.name || 'Carteira Padrão'}
                                        </span>
                                    </div>
                                    {familyMembers && t.created_by && familyMembers[t.created_by] && (
                                        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <img
                                                src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                                                alt={familyMembers[t.created_by].name}
                                                className="w-4 h-4 rounded-full border border-white dark:border-slate-700"
                                            />
                                            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                                                {familyMembers[t.created_by].name.split(' ')[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Data</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Categoria/Conta</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right whitespace-nowrap pr-8">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filtered.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest whitespace-nowrap ${t.isPaid
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                                            }`}>
                                            {t.isPaid ? 'PAGO' : 'PENDENTE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 min-w-[200px]">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-normal" title={t.description}>{t.description}</div>
                                        {t.created_by && familyMembers && familyMembers[t.created_by] && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <img
                                                    src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                                                    alt={familyMembers[t.created_by].name}
                                                    className="w-3 h-3 rounded-full"
                                                />
                                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                    {familyMembers[t.created_by].name.split(' ')[0]}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap text-center">
                                        {new Date(t.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-tighter">{t.category}</span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                {accounts.find(a => a.id === t.account)?.name || 'Conta desconhecida'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-black whitespace-nowrap pr-8 text-right ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {t.type === 'income' ? '+' : '-'}{' '}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Attachment Modal Viewer */}
            {selectedAttachment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Visualizar Anexo</h3>
                            <button
                                onClick={() => setSelectedAttachment(null)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 flex justify-center bg-slate-50 min-h-[300px] max-h-[70vh] overflow-y-auto">
                            {selectedAttachment.startsWith('data:image') ? (
                                <img src={selectedAttachment} alt="Anexo" className="max-w-full h-auto rounded-xl shadow-sm" />
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4 py-12">
                                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                                        <FileText size={48} className="text-sky-500" />
                                    </div>
                                    <p className="text-slate-500 font-medium text-center">Este anexo é um link externo.</p>
                                    <a
                                        href={selectedAttachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-sky-500 transition-all shadow-lg shadow-sky-100"
                                    >
                                        Abrir Link Externo
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedAttachment(null)}
                                className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionStatement;
