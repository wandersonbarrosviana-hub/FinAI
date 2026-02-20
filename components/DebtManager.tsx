import React, { useState, useMemo } from 'react';
import {
    Plus, X, Landmark, AlertTriangle, TrendingDown, TrendingUp, Clock,
    DollarSign, Calendar, ChevronDown, ChevronUp, Target, Zap, Save,
    Edit2, Trash2, Info, BarChart2, CheckCircle, ArrowRight
} from 'lucide-react';
import { Debt, DebtType, AmortizationType, DebtReason, DebtClassification } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DebtManagerProps {
    debts: Debt[];
    onAddDebt: (debt: Partial<Debt>) => void;
    onUpdateDebt: (id: string, updates: Partial<Debt>) => void;
    onDeleteDebt: (id: string) => void;
    monthlyIncome?: number;
}

const defaultForm = (): Partial<Debt> => ({
    name: '',
    type: 'personal_loan',
    creditor: '',
    totalContracted: 0,
    currentBalance: 0,
    interestRateMonthly: undefined,
    totalInstallments: 12,
    remainingInstallments: 12,
    installmentValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    amortizationType: 'unknown',
    reason: undefined,
    classification: undefined,
});

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
    financing: 'Financiamento',
    personal_loan: 'Empréstimo Pessoal',
    credit_card: 'Cartão de Crédito',
    informal: 'Dívida Informal',
    other: 'Outro',
};

const AMORTIZATION_LABELS: Record<AmortizationType, string> = {
    sac: 'SAC',
    price: 'Price',
    unknown: 'Não Informado',
};

const REASON_LABELS: Record<DebtReason, string> = {
    consumption: 'Consumo',
    emergency: 'Emergência',
    education: 'Educação',
    real_estate: 'Imóvel',
    vehicle: 'Veículo',
    investment: 'Investimento',
    other: 'Outro',
};

function calcMonthsToQuit(balance: number, rate: number, payment: number): number {
    if (payment <= 0 || balance <= 0) return 0;
    if (rate <= 0) return Math.ceil(balance / payment);
    const r = rate / 100;
    const months = Math.log(payment / (payment - balance * r)) / Math.log(1 + r);
    return isFinite(months) ? Math.ceil(months) : 999;
}

function calcInterestSaved(balance: number, rateMonthly: number, currentMonths: number, newMonths: number): number {
    const r = rateMonthly / 100;
    if (r <= 0) return 0;
    const totalNow = balance * Math.pow(1 + r, currentMonths);
    const totalNew = balance * Math.pow(1 + r, newMonths);
    return Math.max(0, totalNow - totalNew);
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, onAddDebt, onUpdateDebt, onDeleteDebt, monthlyIncome = 0 }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Debt>>(defaultForm());
    const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
    const [simulateDebt, setSimulateDebt] = useState<string | null>(null);
    const [simExtra, setSimExtra] = useState<number>(0);
    const [simInstallments, setSimInstallments] = useState<number>(1);

    const summary = useMemo(() => {
        const total = debts.reduce((s, d) => s + d.currentBalance, 0);
        const totalContracted = debts.reduce((s, d) => s + d.totalContracted, 0);
        const totalPaid = Math.max(0, totalContracted - total);
        const monthlyCommitment = debts.reduce((s, d) => s + d.installmentValue, 0);
        const percentRenda = monthlyIncome > 0 ? (monthlyCommitment / monthlyIncome) * 100 : 0;
        const estimatedInterest = debts.reduce((s, d) => {
            if (!d.interestRateMonthly || d.interestRateMonthly <= 0) return s;
            const r = d.interestRateMonthly / 100;
            const n = d.remainingInstallments;
            const interest = d.currentBalance * Math.pow(1 + r, n) - d.currentBalance;
            return s + Math.max(0, interest);
        }, 0);
        const maxMonths = debts.length > 0 ? Math.max(...debts.map(d =>
            calcMonthsToQuit(d.currentBalance, d.interestRateMonthly || 0, d.installmentValue)
        )) : 0;
        return { total, totalPaid, estimatedInterest, percentRenda, monthlyCommitment, maxMonths };
    }, [debts, monthlyIncome]);

    const alerts = useMemo(() => {
        const list: string[] = [];
        if (summary.percentRenda > 40) list.push(`⚠️ Comprometimento de ${summary.percentRenda.toFixed(1)}% da renda ultrapassa o limite recomendado de 40%`);
        debts.forEach(d => {
            if (d.interestRateMonthly && d.interestRateMonthly > 4) {
                list.push(`🔴 "${d.name}" possui juros de ${d.interestRateMonthly}% a.m. (acima de 4%)`);
            }
            if (d.type === 'credit_card' && d.installmentValue < d.currentBalance * 0.03) {
                list.push(`💳 "${d.name}": você pode estar pagando apenas o mínimo do cartão`);
            }
        });
        return list;
    }, [debts, summary]);

    const sortedAvalanche = useMemo(() =>
        [...debts].sort((a, b) => (b.interestRateMonthly || 0) - (a.interestRateMonthly || 0)),
        [debts]);

    const sortedSnowball = useMemo(() =>
        [...debts].sort((a, b) => a.currentBalance - b.currentBalance),
        [debts]);

    const handleEdit = (debt: Debt) => {
        setForm({ ...debt });
        setEditingId(debt.id);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            onUpdateDebt(editingId, form);
            setEditingId(null);
        } else {
            onAddDebt(form);
        }
        setForm(defaultForm());
        setIsFormOpen(false);
    };

    const getProgressPercent = (d: Debt) => {
        if (!d.totalContracted || d.totalContracted === 0) return 0;
        return Math.min(100, ((d.totalContracted - d.currentBalance) / d.totalContracted) * 100);
    };

    const thermometerColor = summary.percentRenda < 30
        ? 'bg-emerald-500' : summary.percentRenda < 50
            ? 'bg-amber-500' : 'bg-rose-500';

    const thermometerLabel = summary.percentRenda < 30
        ? '✅ Saudável' : summary.percentRenda < 50
            ? '⚠️ Alerta' : '🔴 Crítico';

    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const timelineData = useMemo(() => {
        const months: { label: string; count: number }[] = [];
        const now = new Date();
        for (let i = 0; i < 36; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const count = debts.filter(debt => {
                const end = new Date(debt.endDate);
                return end >= d && end < new Date(d.getFullYear(), d.getMonth() + 1, 1);
            }).length;
            months.push({ label, count });
        }
        return months.filter((_, i) => i % 3 === 0 || months[i].count > 0).slice(0, 12);
    }, [debts]);

    const getSimulationResult = (debt: Debt) => {
        const rate = debt.interestRateMonthly || 0;
        const newBalance = Math.max(0, debt.currentBalance - simExtra);
        const paidInstallments = debt.totalInstallments - debt.remainingInstallments;
        const newRemaining = Math.max(0, debt.remainingInstallments - simInstallments);
        const newEndMonths = calcMonthsToQuit(newBalance, rate, debt.installmentValue);
        const currentEndMonths = debt.remainingInstallments;
        const savedInterest = calcInterestSaved(debt.currentBalance, rate, currentEndMonths, Math.min(newRemaining, newEndMonths));
        const monthsReduced = currentEndMonths - Math.min(newRemaining, newEndMonths);
        return { newBalance, newEndMonths, savedInterest, monthsReduced };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Landmark size={24} className="text-rose-600" /> Gerenciar Dívidas
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">Controle e análise do seu endividamento estruturado</p>
                </div>
                <button
                    onClick={() => { setIsFormOpen(!isFormOpen); setEditingId(null); setForm(defaultForm()); }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${isFormOpen ? 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700' : 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-100'}`}
                >
                    {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    {isFormOpen ? 'Cancelar' : 'Nova Dívida'}
                </button>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-200 font-medium">
                            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                            {alert}
                        </div>
                    ))}
                </div>
            )}

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                    { label: 'Saldo Total', value: fmt(summary.total), sub: 'dívidas ativas', icon: <TrendingDown size={18} />, color: 'rose' },
                    { label: 'Total Pago', value: fmt(summary.totalPaid), sub: 'valor quitado', icon: <CheckCircle size={18} />, color: 'emerald' },
                    { label: 'Juros Estimados', value: fmt(summary.estimatedInterest), sub: 'custo total', icon: <DollarSign size={18} />, color: 'amber' },
                    { label: 'Parcela Mensal', value: fmt(summary.monthlyCommitment), sub: 'impacto no fluxo', icon: <Calendar size={18} />, color: 'blue' },
                    { label: 'Prazo Máximo', value: `${summary.maxMonths} meses`, sub: 'para quitar tudo', icon: <Clock size={18} />, color: 'violet' },
                ].map(card => (
                    <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                        <div className={`w-8 h-8 rounded-xl bg-${card.color}-50 dark:bg-${card.color}-900/20 flex items-center justify-center text-${card.color}-600 dark:text-${card.color}-400 mb-3`}>
                            {card.icon}
                        </div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.label}</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-tight">{card.value}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Thermometer */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Comprometimento de Renda</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{summary.percentRenda.toFixed(1)}%</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${summary.percentRenda < 30 ? 'bg-emerald-50 text-emerald-700' : summary.percentRenda < 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                        {thermometerLabel}
                    </span>
                </div>
                <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${thermometerColor}`} style={{ width: `${Math.min(100, summary.percentRenda)}%` }} />
                    <div className="absolute left-[30%] top-0 h-full w-px bg-white/50" />
                    <div className="absolute left-[50%] top-0 h-full w-px bg-white/50" />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    <span>0%</span><span className="text-emerald-500">30% saudável</span><span className="text-amber-500">50% alerta</span><span>100%</span>
                </div>
            </div>

            {/* Form */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-6">
                        {editingId ? <Edit2 size={14} /> : <Plus size={14} />}
                        {editingId ? 'Editar Dívida' : 'Cadastrar Nova Dívida'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Nome */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Nome da Dívida *</label>
                            <input required type="text" placeholder="Ex: Empréstimo Caixa" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Tipo */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Tipo *</label>
                            <select required value={form.type || 'personal_loan'} onChange={e => setForm({ ...form, type: e.target.value as DebtType })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white">
                                {Object.entries(DEBT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>

                        {/* Credor */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Credor *</label>
                            <input required type="text" placeholder="Ex: Banco do Brasil" value={form.creditor || ''} onChange={e => setForm({ ...form, creditor: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Valor Total Contratado */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Valor Total Contratado (R$) *</label>
                            <input required type="number" min="0" step="0.01" placeholder="0,00" value={form.totalContracted || ''} onChange={e => setForm({ ...form, totalContracted: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Saldo Atual */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Saldo Atual (R$) *</label>
                            <input required type="number" min="0" step="0.01" placeholder="0,00" value={form.currentBalance || ''} onChange={e => setForm({ ...form, currentBalance: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Taxa Juros */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Taxa Juros Mensal (%)</label>
                            <input type="number" min="0" step="0.01" placeholder="Ex: 2.5" value={form.interestRateMonthly || ''} onChange={e => setForm({ ...form, interestRateMonthly: parseFloat(e.target.value) || undefined })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Total Parcelas */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Total de Parcelas *</label>
                            <input required type="number" min="1" placeholder="12" value={form.totalInstallments || ''} onChange={e => setForm({ ...form, totalInstallments: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Parcelas Restantes */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Parcelas Restantes *</label>
                            <input required type="number" min="0" placeholder="6" value={form.remainingInstallments || ''} onChange={e => setForm({ ...form, remainingInstallments: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Valor Parcela */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Valor da Parcela (R$) *</label>
                            <input required type="number" min="0" step="0.01" placeholder="0,00" value={form.installmentValue || ''} onChange={e => setForm({ ...form, installmentValue: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Data Início */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Data de Início *</label>
                            <input required type="date" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Data Término */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Data Prevista de Término *</label>
                            <input required type="date" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                        </div>

                        {/* Amortização */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Tipo de Amortização</label>
                            <select value={form.amortizationType || 'unknown'} onChange={e => setForm({ ...form, amortizationType: e.target.value as AmortizationType })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white">
                                {Object.entries(AMORTIZATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>

                        {/* Motivo */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Motivo</label>
                            <select value={form.reason || ''} onChange={e => setForm({ ...form, reason: (e.target.value || undefined) as DebtReason | undefined })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white">
                                <option value="">Não informado</option>
                                {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>

                        {/* Classificação */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Classificação</label>
                            <select value={form.classification || ''} onChange={e => setForm({ ...form, classification: (e.target.value || undefined) as DebtClassification | undefined })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white">
                                <option value="">Não informada</option>
                                <option value="productive">Produtiva</option>
                                <option value="passive">Passiva</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-rose-100 transition-all uppercase tracking-widest text-xs">
                            <Save size={18} /> {editingId ? 'Atualizar' : 'Salvar Dívida'}
                        </button>
                    </div>
                </form>
            )}

            {/* Debt List */}
            {debts.length === 0 && !isFormOpen && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
                        <Landmark size={36} className="text-rose-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">Nenhuma dívida cadastrada</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mt-1">Clique em "Nova Dívida" para começar a rastrear seu endividamento.</p>
                    </div>
                </div>
            )}

            {debts.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suas Dívidas ({debts.length})</h3>
                    {debts.map(debt => {
                        const progress = getProgressPercent(debt);
                        const isExpanded = expandedDebt === debt.id;
                        const isSimulating = simulateDebt === debt.id;
                        const simResult = isSimulating ? getSimulationResult(debt) : null;
                        const monthsLeft = calcMonthsToQuit(debt.currentBalance, debt.interestRateMonthly || 0, debt.installmentValue);
                        return (
                            <div key={debt.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-black text-slate-900 dark:text-white text-base">{debt.name}</h4>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 uppercase">
                                                    {DEBT_TYPE_LABELS[debt.type]}
                                                </span>
                                                {debt.classification && (
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${debt.classification === 'productive' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {debt.classification === 'productive' ? 'Produtiva' : 'Passiva'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">{debt.creditor}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xl font-black text-rose-600 dark:text-rose-400">{fmt(debt.currentBalance)}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">saldo devedor</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
                                            <span>Progresso: {progress.toFixed(1)}% quitado</span>
                                            <span>{debt.remainingInstallments}x de {fmt(debt.installmentValue)} restantes</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                                        {[
                                            { label: 'Parcela', value: fmt(debt.installmentValue) },
                                            { label: 'Juros/mês', value: debt.interestRateMonthly ? `${debt.interestRateMonthly}%` : '—' },
                                            { label: 'Prazo est.', value: `${monthsLeft}m` },
                                            { label: 'Contratado', value: fmt(debt.totalContracted) },
                                            { label: 'Amortização', value: AMORTIZATION_LABELS[debt.amortizationType] },
                                        ].map(s => (
                                            <div key={s.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{s.label}</p>
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                                        <button onClick={() => setSimulateDebt(isSimulating ? null : debt.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition-colors">
                                            <Zap size={12} /> Simular Antecipação
                                        </button>
                                        <button onClick={() => handleEdit(debt)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
                                            <Edit2 size={12} /> Editar
                                        </button>
                                        <button onClick={() => onDeleteDebt(debt.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 hover:bg-rose-100 transition-colors">
                                            <Trash2 size={12} /> Excluir
                                        </button>
                                    </div>

                                    {/* Simulation Panel */}
                                    {isSimulating && (
                                        <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-900 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <h5 className="text-xs font-black text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <Zap size={12} /> Simulador de Antecipação
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Valor Extra para Amortizar (R$)</label>
                                                    <input type="number" min="0" step="100" value={simExtra} onChange={e => setSimExtra(parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded-lg font-bold text-sky-700 dark:text-sky-300 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Parcelas a Antecipar</label>
                                                    <input type="number" min="0" max={debt.remainingInstallments} step="1" value={simInstallments} onChange={e => setSimInstallments(parseInt(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded-lg font-bold text-sky-700 dark:text-sky-300 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
                                                </div>
                                            </div>
                                            {simResult && (
                                                <div className="grid grid-cols-3 gap-3 mt-3">
                                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Novo Saldo</p>
                                                        <p className="text-sm font-black text-emerald-600">{fmt(simResult.newBalance)}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Economia em Juros</p>
                                                        <p className="text-sm font-black text-sky-600">{fmt(simResult.savedInterest)}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Redução do Prazo</p>
                                                        <p className="text-sm font-black text-violet-600">{simResult.monthsReduced} meses</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Strategy Section */}
            {debts.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Avalanche */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                            <TrendingDown size={16} className="text-rose-600" /> Método Avalanche
                        </h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-3">Prioriza maior taxa de juros → menor custo total</p>
                        {sortedAvalanche.slice(0, 3).map((d, i) => (
                            <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full font-black text-xs ${i === 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{d.name}</p>
                                    <p className="text-[10px] text-slate-400">{d.interestRateMonthly ? `${d.interestRateMonthly}% a.m.` : 'Juros não informados'}</p>
                                </div>
                                <span className="text-xs font-black text-rose-600 dark:text-rose-400 shrink-0">{fmt(d.currentBalance)}</span>
                            </div>
                        ))}
                        {sortedAvalanche[0] && (
                            <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2">
                                <Info size={12} className="shrink-0 mt-0.5" />
                                <span>Priorize <strong>{sortedAvalanche[0].name}</strong> — maiores juros. Você maximiza a economia com menor custo financeiro.</span>
                            </div>
                        )}
                    </div>

                    {/* Snowball */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                            <Target size={16} className="text-sky-600" /> Bola de Neve
                        </h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-3">Prioriza menor saldo → motivação e velocidade</p>
                        {sortedSnowball.slice(0, 3).map((d, i) => (
                            <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full font-black text-xs ${i === 0 ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{d.name}</p>
                                    <p className="text-[10px] text-slate-400">{d.remainingInstallments} parcelas restantes</p>
                                </div>
                                <span className="text-xs font-black text-sky-600 dark:text-sky-400 shrink-0">{fmt(d.currentBalance)}</span>
                            </div>
                        ))}
                        {sortedSnowball[0] && (
                            <div className="mt-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl text-[11px] text-sky-700 dark:text-sky-300 font-medium flex items-start gap-2">
                                <Info size={12} className="shrink-0 mt-0.5" />
                                <span>Quite <strong>{sortedSnowball[0].name}</strong> primeiro para liberar {fmt(sortedSnowball[0].installmentValue)}/mês de fluxo de caixa.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Timeline */}
            {debts.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                        <Calendar size={16} className="text-violet-600" /> Linha do Tempo das Quitações
                    </h3>
                    <div className="overflow-x-auto">
                        <div className="flex gap-3 min-w-max pb-2">
                            {debts.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).map(d => {
                                const end = new Date(d.endDate);
                                const now = new Date();
                                const diff = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
                                return (
                                    <div key={d.id} className="flex flex-col items-center gap-1.5 min-w-[100px]">
                                        <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm" />
                                        <div className="h-12 w-px bg-slate-100 dark:bg-slate-800" />
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">{d.name}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500">{end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
                                            <p className={`text-[9px] font-black ${diff <= 0 ? 'text-emerald-500' : diff <= 6 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {diff <= 0 ? 'Vencida' : `em ${diff}m`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtManager;
