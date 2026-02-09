import React, { useState } from 'react';
import { Transaction, Account, Tag } from '../types';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ReportsProps {
    transactions: Transaction[];
    accounts: Account[];
    tags: Tag[];
}

const Reports: React.FC<ReportsProps> = ({ transactions, accounts, tags }) => {
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
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header Tabs */}
                <div className="flex border-b border-slate-100">
                    <button className="px-6 py-4 text-sm font-bold text-rose-600 border-b-2 border-rose-600">
                        Filtro
                    </button>
                    <button className="px-6 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                        Filtros salvos
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* General Filter Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Filtro Geral</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold ml-1">Data Inicial</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold ml-1">Data Final</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold ml-1">Data de referência</label>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                {[
                                    { id: 'date', label: 'Lançamento', icon: Calendar },
                                    { id: 'dueDate', label: 'Vencimento', icon: Clock },
                                    { id: 'paymentDate', label: 'Efetivação', icon: CheckCircle }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setDateReference(item.id as any)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${dateReference === item.id
                                            ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-100'
                                            : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        <item.icon size={14} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-50" />

                    {/* Situation Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Situação</h3>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                            {['Todas', 'Efetivadas', 'Pendentes'].map((label) => {
                                const id = label === 'Todas' ? 'all' : label === 'Efetivadas' ? 'paid' : 'pending';
                                const isActive = status === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setStatus(id as any)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                                            ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-100'
                                            : 'text-slate-500 hover:bg-slate-100'
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
                            <label className="text-xs text-slate-500 font-bold ml-1">Recorrência</label>
                            <select
                                value={recurrence}
                                onChange={e => setRecurrence(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 font-medium appearance-none"
                            >
                                <option value="all">Todas</option>
                                <option value="fixed">Fixa</option>
                                <option value="installment">Parcelada</option>
                                <option value="one_time">Única</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 font-bold ml-1">Ordenar</label>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 font-medium appearance-none"
                            >
                                <option value="date_asc">Vencimento crescente</option>
                                <option value="date_desc">Vencimento decrescente</option>
                                <option value="amount_asc">Valor crescente</option>
                                <option value="amount_desc">Valor decrescente</option>
                            </select>
                        </div>
                    </div>

                    <hr className="border-slate-50" />

                    {/* Categorias (Mock Multi-select) */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-bold ml-1">Categorias despesas</label>
                        <div className="flex bg-rose-50 border border-rose-100 p-2 rounded-xl items-center gap-2">
                            <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                Todas <button className="hover:text-rose-800">×</button>
                            </span>
                            <input type="text" placeholder="Buscar..." className="bg-transparent outline-none text-xs text-slate-600 flex-1" />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-bold ml-1">Tags</label>
                        <div className="flex bg-slate-50 border border-slate-200 p-2 rounded-xl items-center gap-2">
                            <span className="text-slate-400 text-xs italic">Nenhuma</span>
                        </div>
                    </div>

                    {/* Contas */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-bold ml-1">Contas</label>
                        <div className="flex bg-rose-50 border border-rose-100 p-2 rounded-xl items-center gap-2">
                            <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                Todas <button className="hover:text-rose-800">×</button>
                            </span>
                        </div>
                    </div>

                    {/* Cartões de crédito */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-bold ml-1">Cartões de crédito</label>
                        <div className="flex bg-sky-50 border border-sky-100 p-2 rounded-xl items-center gap-2">
                            <span className="bg-sky-100 text-sky-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                Todos <button className="hover:text-sky-800">×</button>
                            </span>
                        </div>
                    </div>


                    <hr className="border-slate-50" />

                    {/* View Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Agrupar por</h3>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                {['Nenhum', 'Categoria', 'Subcategoria'].map((label) => {
                                    const id = label === 'Nenhum' ? 'none' : label === 'Categoria' ? 'category' : 'subcategory';
                                    const isActive = groupBy === id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => setGroupBy(id as any)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                                                ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-100'
                                                : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tipo de visualização</h3>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <button
                                    onClick={() => setViewType('daily')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'daily'
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    Gráfico evolução diária
                                </button>
                                <div className="w-[1px] bg-slate-200 my-2"></div>
                                <button
                                    onClick={() => setViewType('monthly')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'monthly'
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:bg-slate-100'
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
