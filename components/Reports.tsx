import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Account, Tag } from '../types';
import { Calendar, CheckCircle, Clock, FileText, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ReportsProps {
    transactions: Transaction[];
    accounts: Account[];
    tags: Tag[];
    currentDate: Date;
}

const Reports: React.FC<ReportsProps> = ({ transactions, accounts, tags, currentDate }) => {
    // Filter States
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    const [dateReference, setDateReference] = useState<'date' | 'dueDate' | 'paymentDate'>('date');
    const [status, setStatus] = useState<'all' | 'paid' | 'pending'>('all');
    const [recurrence, setRecurrence] = useState('all');
    const [sortBy, setSortBy] = useState('date_asc');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [viewType, setViewType] = useState<'daily' | 'monthly'>('daily');
    const [groupBy, setGroupBy] = useState<'none' | 'category' | 'subcategory'>('none');

    // Filter Logic
    const filteredTransactions = React.useMemo(() => {
        return transactions.filter(t => {
            // 1. Period Filter based on reference
            const dateStr = dateReference === 'date' ? t.date :
                dateReference === 'dueDate' ? (t.dueDate || t.date) :
                    (t.paymentDate || t.date);
            const itemDate = new Date(dateStr);
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);

            // Set times to midnight for accurate comparison
            itemDate.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (itemDate < start || itemDate > end) return false;

            // 2. Status Filter
            if (status === 'paid' && !t.isPaid) return false;
            // Vencidas se pendente e data < hoje
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(t.dueDate || t.date);
            dueDate.setHours(0, 0, 0, 0);

            if (status === 'overdue' && (t.isPaid || dueDate >= today)) return false;
            if (status === 'pending' && (!t.isPaid && dueDate < today)) return false; // Se forpending, tiramos as vencidas (vencidas tem filtro próprio se o user quiser, ou pending = todas não pagas)

            // Ajuste no status: se o usuário selecionou pending, mostramos as não pagas indep. do vencimento.
            // Se selecionou overdue, apenas não pagas e vencidas.
            if (status === 'pending' && t.isPaid) return false;

            // 3. Recurrence
            if (recurrence !== 'all' && t.recurrence !== recurrence) return false;

            // 4. Multi-select filters (simulados)
            if (selectedAccounts.length > 0 && !selectedAccounts.includes(t.account)) return false;
            if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
            if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
            if (sortBy === 'amount_asc') return a.amount - b.amount;
            if (sortBy === 'amount_desc') return b.amount - a.amount;
            return 0;
        });
    }, [transactions, dateRange, dateReference, status, recurrence, sortBy, selectedAccounts, selectedCategories]);

    // Helper to check if item is selected (for multi-select simulation)
    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(prev => prev.filter(c => c !== cat));
        } else {
            setSelectedCategories(prev => [...prev, cat]);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Header Tabs AND Actions */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pr-6">
                    <div className="flex">
                        <button className="px-6 py-4 text-xs font-black text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400 uppercase tracking-widest">
                            Filtro
                        </button>
                        <button className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-widest">
                            Filtros salvos
                        </button>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => {
                                const data = filteredTransactions.map(t => ({
                                    Data: new Date(t.date).toLocaleDateString('pt-BR'),
                                    Descrição: t.description,
                                    Categoria: t.category,
                                    Valor: t.amount,
                                    Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
                                    Status: t.isPaid ? 'Pago' : (new Date(t.dueDate || t.date) < new Date() ? 'Vencido' : 'Pendente')
                                }));

                                const ws = XLSX.utils.json_to_sheet(data);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "Relatório");
                                XLSX.writeFile(wb, `relatorio_finai_${new Date().toISOString().split('T')[0]}.xlsx`);
                            }}
                            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                        >
                            <Download size={14} className="text-emerald-500" /> Excel (XLSX)
                        </button>
                        <button
                            onClick={() => {
                                const doc = new jsPDF();
                                doc.text("Relatório de Transações - FinAI", 14, 15);

                                const tableColumn = ["Data", "Descrição", "Categoria", "Valor", "Tipo", "Status"];
                                const tableRows = filteredTransactions.map(t => [
                                    new Date(t.date).toLocaleDateString('pt-BR'),
                                    t.description,
                                    t.category,
                                    `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                    t.type === 'income' ? 'Receita' : 'Despesa',
                                    t.isPaid ? 'Pago' : (new Date(t.dueDate || t.date) < new Date() ? 'Vencido' : 'Pendente')
                                ]);

                                autoTable(doc, {
                                    head: [tableColumn],
                                    body: tableRows,
                                    startY: 20,
                                    theme: 'grid',
                                    headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold' },
                                    alternateRowStyles: { fillColor: [248, 250, 252] }
                                } as any);

                                doc.save(`relatorio_finai_${new Date().toISOString().split('T')[0]}.pdf`);
                            }}
                            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-widest"
                        >
                            <FileText size={14} className="text-rose-500" /> PDF
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-8">
                    {/* General Filter Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Filtro Geral</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Data Inicial</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 dark:text-slate-200 font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Data Final</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 dark:text-slate-200 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Data de referência</label>
                            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                {[
                                    { id: 'date', label: 'Lançamento', icon: Calendar },
                                    { id: 'dueDate', label: 'Vencimento', icon: Clock },
                                    { id: 'paymentDate', label: 'Efetivação', icon: CheckCircle }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setDateReference(item.id as any)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${dateReference === item.id
                                            ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-sm border border-sky-100 dark:border-sky-900/30'
                                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <item.icon size={14} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-50 dark:border-slate-800" />

                    {/* Situation Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Situação</h3>
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            {['Todas', 'Efetivadas', 'Pendentes', 'Vencidas'].map((label) => {
                                const id = label === 'Todas' ? 'all' : label === 'Efetivadas' ? 'paid' : label === 'Pendentes' ? 'pending' : 'overdue';
                                const isActive = status === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setStatus(id as any)}
                                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${isActive
                                            ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-sm border border-sky-100 dark:border-sky-900/30'
                                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Recorrência</label>
                            <select
                                value={recurrence}
                                onChange={e => setRecurrence(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 dark:text-slate-200 font-medium appearance-none"
                            >
                                <option value="all">Todas</option>
                                <option value="fixed">Fixa</option>
                                <option value="installment">Parcelada</option>
                                <option value="one_time">Única</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Ordenar</label>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 dark:text-slate-200 font-medium appearance-none"
                            >
                                <option value="date_asc">Vencimento crescente</option>
                                <option value="date_desc">Vencimento decrescente</option>
                                <option value="amount_asc">Valor crescente</option>
                                <option value="amount_desc">Valor decrescente</option>
                            </select>
                        </div>
                    </div>

                    <hr className="border-slate-50 dark:border-slate-800" />

                    {/* Categorias (Mock Multi-select) */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Categorias despesas</label>
                        <div className="flex bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-2 rounded-xl items-center gap-2">
                            <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                Todas <button className="hover:text-rose-800 dark:hover:text-rose-200">×</button>
                            </span>
                            <input type="text" placeholder="Buscar..." className="bg-transparent outline-none text-xs text-slate-600 dark:text-slate-400 flex-1 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Tags</label>
                        <div className="flex bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl items-center gap-2">
                            <span className="text-slate-400 dark:text-slate-500 text-xs italic">Nenhuma</span>
                        </div>
                    </div>

                    {/* Contas */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Contas</label>
                        <div className="flex bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-2 rounded-xl items-center gap-2">
                            <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                Todas <button className="hover:text-rose-800 dark:hover:text-rose-200">×</button>
                            </span>
                        </div>
                    </div>

                    {/* Cartões de crédito */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">Cartões de crédito</label>
                        <div className="flex bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/20 p-2 rounded-xl items-center gap-2">
                            <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                Todos <button className="hover:text-sky-800 dark:hover:text-sky-200">×</button>
                            </span>
                        </div>
                    </div>


                    <hr className="border-slate-50 dark:border-slate-800" />

                    {/* View Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Agrupar por</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                {['Nenhum', 'Categoria', 'Subcategoria'].map((label) => {
                                    const id = label === 'Nenhum' ? 'none' : label === 'Categoria' ? 'category' : 'subcategory';
                                    const isActive = groupBy === id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => setGroupBy(id as any)}
                                            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${isActive
                                                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-100 dark:border-slate-600'
                                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Tipo de visualização</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setViewType('daily')}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${viewType === 'daily'
                                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-100 dark:border-slate-600'
                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                >
                                    Gráfico evolução diária
                                </button>
                                <div className="w-[1px] bg-slate-200 dark:bg-slate-700 my-2"></div>
                                <button
                                    onClick={() => setViewType('monthly')}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${viewType === 'monthly'
                                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-100 dark:border-slate-600'
                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                >
                                    Gráfico evolução mensal
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Reports;
