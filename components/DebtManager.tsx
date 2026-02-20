import React, { useState, useMemo } from 'react';
import {
    Plus, X, Landmark, AlertTriangle, TrendingDown, Clock,
    DollarSign, Calendar, Target, Zap, Save,
    Edit2, Trash2, Info, CheckCircle, ArrowRight, Receipt, CreditCard
} from 'lucide-react';
import { Debt, DebtType, AmortizationType, DebtReason, DebtClassification, Transaction, Account } from '../types';
import { CATEGORIES_MAP } from '../constants';

interface DebtManagerProps {
    debts: Debt[];
    onAddDebt: (debt: Partial<Debt>) => void;
    onUpdateDebt: (id: string, updates: Partial<Debt>) => void;
    onDeleteDebt: (id: string) => void;
    onCreateExpense?: (data: Partial<Transaction>) => Promise<void> | void;
    accounts?: Account[];
    monthlyIncome?: number;
}

const defaultForm = (): Partial<Debt> & { createExpense?: boolean } => ({
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
    createExpense: false,
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
    const val = payment / (payment - balance * r);
    if (val <= 0) return 999;
    const months = Math.log(val) / Math.log(1 + r);
    return isFinite(months) && months > 0 ? Math.ceil(months) : 999;
}

// Calcula economia ao antecipar N parcelas (pagando N*installment agora e reduzindo saldo + prazo)
function calcAnticipationByInstallments(debt: Debt, nInstallments: number) {
    const rate = (debt.interestRateMonthly || 0) / 100;
    const payment = debt.installmentValue;
    const balance = debt.currentBalance;
    const remaining = debt.remainingInstallments;

    const n = Math.max(0, Math.min(nInstallments, remaining));
    const anticipationValue = n * payment;

    // Novo saldo após amortização
    let newBalance = Math.max(0, balance - anticipationValue);
    const newRemaining = Math.max(0, remaining - n);

    // Custo total original (sem antecipação): parcelas * valor
    const totalOriginal = remaining * payment;
    // Custo total após antecipação: valor antecipado agora + parcelas restantes
    const totalNew = anticipationValue + newRemaining * payment;
    const totalSaved = Math.max(0, totalOriginal - totalNew);

    // Economia em juros (diferença de encargos futuros)
    let interestSaved = 0;
    if (rate > 0) {
        // juros totais sem antecipação
        const interestOriginal = remaining * payment - balance;
        // juros totais com antecipação
        const interestNew = newRemaining * payment - newBalance;
        interestSaved = Math.max(0, interestOriginal - interestNew);
    }

    const newEndDate = (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + newRemaining);
        return d;
    })();

    return {
        nInstallments: n,
        anticipationValue,
        newBalance,
        newRemaining,
        monthsReduced: n,
        interestSaved,
        newEndDate,
    };
}

// Calcula economia ao aportar valor extra
function calcAnticipationByValue(debt: Debt, extraValue: number) {
    const rate = (debt.interestRateMonthly || 0) / 100;
    const payment = debt.installmentValue;
    const balance = debt.currentBalance;
    const remaining = debt.remainingInstallments;

    const extra = Math.max(0, Math.min(extraValue, balance));
    const newBalance = balance - extra;

    const originalMonths = remaining;
    const newMonths = payment > 0
        ? calcMonthsToQuit(newBalance, debt.interestRateMonthly || 0, payment)
        : 0;
    const monthsReduced = Math.max(0, originalMonths - newMonths);

    let interestSaved = 0;
    if (rate > 0) {
        const interestOriginal = Math.max(0, originalMonths * payment - balance);
        const interestNew = Math.max(0, newMonths * payment - newBalance);
        interestSaved = Math.max(0, interestOriginal - interestNew);
    }

    const newEndDate = (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + newMonths);
        return d;
    })();

    return { extra, newBalance, newMonths, monthsReduced, interestSaved, newEndDate };
}

// Formatação de moeda
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Campo monetário com prefixo R$
const MoneyInput: React.FC<{ label: string; value: number | undefined; onChange: (v: number) => void; required?: boolean; placeholder?: string }> = ({ label, value, onChange, required, placeholder }) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">{label}{required ? ' *' : ''}</label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">R$</span>
            <input
                required={required}
                type="number"
                min="0"
                step="0.01"
                placeholder={placeholder || "0,00"}
                value={value || ''}
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-900 dark:text-white"
            />
        </div>
    </div>
);

const DebtManager: React.FC<DebtManagerProps> = ({ debts, onAddDebt, onUpdateDebt, onDeleteDebt, onCreateExpense, accounts = [], monthlyIncome = 0 }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Debt> & { createExpense?: boolean }>(defaultForm());
    const [simulateDebt, setSimulateDebt] = useState<string | null>(null);
    const [simMode, setSimMode] = useState<'installments' | 'value'>('installments');
    const [simInstallments, setSimInstallments] = useState<number>(1);
    const [simExtra, setSimExtra] = useState<number>(0);
    const [expenseLaunched, setExpenseLaunched] = useState<string | null>(null);

    // Modal de lançamento de despesa
    const categoriesList = Object.keys(CATEGORIES_MAP);
    const [expenseModal, setExpenseModal] = useState<null | Partial<Transaction>>(null);
    const [expenseInstallmentType, setExpenseInstallmentType] = useState<'total' | 'installment'>('installment');

    const openExpenseModal = (debt: Debt) => {
        setExpenseModal({
            description: `Parcela – ${debt.name} / ${debt.creditor}`,
            amount: debt.installmentValue,
            type: 'expense',
            category: 'Outros',
            subCategory: 'Diversos',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Débito Automático',
            isPaid: true,
            recurrence: 'installment',
            installmentCount: debt.remainingInstallments,
            installmentTotal: debt.remainingInstallments,
            account: accounts[0]?.id,
            tags: [],
        });
        setExpenseInstallmentType('installment');
    };

    const handleLaunchExpense = async () => {
        if (!expenseModal || !onCreateExpense) return;
        let finalAmount = expenseModal.amount || 0;
        let finalInstallmentTotal: number | undefined;
        if (expenseModal.recurrence === 'installment' && (expenseModal.installmentCount || 0) > 1) {
            if (expenseInstallmentType === 'total') {
                finalInstallmentTotal = finalAmount;
                finalAmount = finalAmount / (expenseModal.installmentCount || 1);
            } else {
                finalInstallmentTotal = finalAmount * (expenseModal.installmentCount || 1);
            }
        }
        await onCreateExpense({ ...expenseModal, amount: finalAmount, installmentTotal: finalInstallmentTotal });
        setExpenseModal(null);
        setExpenseLaunched(expenseModal.description || '');
        setTimeout(() => setExpenseLaunched(null), 3000);
    };

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
            return s + Math.max(0, d.currentBalance * Math.pow(1 + r, n) - d.currentBalance);
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
            if (d.interestRateMonthly && d.interestRateMonthly > 4)
                list.push(`🔴 "${d.name}" possui juros de ${d.interestRateMonthly}% a.m. (acima de 4% — cuidado!)`);
            if (d.type === 'credit_card' && d.installmentValue < d.currentBalance * 0.03)
                list.push(`💳 "${d.name}": você pode estar pagando apenas o mínimo do cartão`);
        });
        return list;
    }, [debts, summary]);

    const sortedAvalanche = useMemo(() => [...debts].sort((a, b) => (b.interestRateMonthly || 0) - (a.interestRateMonthly || 0)), [debts]);
    const sortedSnowball = useMemo(() => [...debts].sort((a, b) => a.currentBalance - b.currentBalance), [debts]);

    const handleEdit = (debt: Debt) => {
        setForm({ ...debt, createExpense: false });
        setEditingId(debt.id);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { createExpense, ...debtData } = form;
        if (editingId) {
            onUpdateDebt(editingId, debtData);
            setEditingId(null);
        } else {
            onAddDebt(debtData);
            // Se marcou a opção, abre o modal de despesa pré-preenchido
            if (createExpense) {
                openExpenseModal(debtData as Debt);
            }
        }
        setForm(defaultForm());
        setIsFormOpen(false);
    };

    const getProgressPercent = (d: Debt) => {
        if (!d.totalContracted || d.totalContracted === 0) return 0;
        return Math.min(100, ((d.totalContracted - d.currentBalance) / d.totalContracted) * 100);
    };

    const thermometerColor = summary.percentRenda < 30 ? 'bg-emerald-500' : summary.percentRenda < 50 ? 'bg-amber-500' : 'bg-rose-500';
    const thermometerLabel = summary.percentRenda < 30 ? '✅ Saudável' : summary.percentRenda < 50 ? '⚠️ Alerta' : '🔴 Crítico';

    const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-900 dark:text-white";
    const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1";

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
                            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" /> {alert}
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
                    { label: 'Prazo Máximo', value: `${summary.maxMonths}m`, sub: 'para quitar tudo', icon: <Clock size={18} />, color: 'violet' },
                ].map(card => (
                    <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                        <div className={`w-8 h-8 rounded-xl bg-${card.color}-50 dark:bg-${card.color}-900/20 flex items-center justify-center text-${card.color}-600 dark:text-${card.color}-400 mb-3`}>{card.icon}</div>
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
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${summary.percentRenda < 30 ? 'bg-emerald-50 text-emerald-700' : summary.percentRenda < 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{thermometerLabel}</span>
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
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-6">
                        {editingId ? <Edit2 size={14} /> : <Plus size={14} />}
                        {editingId ? 'Editar Dívida' : 'Cadastrar Nova Dívida'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className={labelClass}>Nome da Dívida *</label>
                            <input required type="text" placeholder="Ex: Empréstimo Caixa" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Tipo *</label>
                            <select required value={form.type || 'personal_loan'} onChange={e => setForm({ ...form, type: e.target.value as DebtType })} className={inputClass}>
                                {Object.entries(DEBT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Credor *</label>
                            <input required type="text" placeholder="Ex: Banco do Brasil" value={form.creditor || ''} onChange={e => setForm({ ...form, creditor: e.target.value })} className={inputClass} />
                        </div>

                        <MoneyInput label="Valor Total Contratado" required value={form.totalContracted} onChange={v => setForm({ ...form, totalContracted: v })} />
                        <MoneyInput label="Saldo Atual" required value={form.currentBalance} onChange={v => setForm({ ...form, currentBalance: v })} />

                        <div className="space-y-1">
                            <label className={labelClass}>Taxa Juros Mensal (%)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">%</span>
                                <input type="number" min="0" step="0.01" placeholder="Ex: 2,5" value={form.interestRateMonthly || ''} onChange={e => setForm({ ...form, interestRateMonthly: parseFloat(e.target.value) || undefined })} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className={labelClass}>Total de Parcelas *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">#</span>
                                <input required type="number" min="1" placeholder="12" value={form.totalInstallments || ''} onChange={e => setForm({ ...form, totalInstallments: parseInt(e.target.value) || 1 })} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className={labelClass}>Parcelas Restantes *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">#</span>
                                <input required type="number" min="0" placeholder="6" value={form.remainingInstallments || ''} onChange={e => setForm({ ...form, remainingInstallments: parseInt(e.target.value) || 0 })} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-slate-900 dark:text-white" />
                            </div>
                        </div>

                        <MoneyInput label="Valor da Parcela" required value={form.installmentValue} onChange={v => setForm({ ...form, installmentValue: v })} />

                        <div className="space-y-1">
                            <label className={labelClass}>Data de Início *</label>
                            <input required type="date" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Data Prevista de Término *</label>
                            <input required type="date" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Tipo de Amortização</label>
                            <select value={form.amortizationType || 'unknown'} onChange={e => setForm({ ...form, amortizationType: e.target.value as AmortizationType })} className={inputClass}>
                                {Object.entries(AMORTIZATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Motivo</label>
                            <select value={form.reason || ''} onChange={e => setForm({ ...form, reason: (e.target.value || undefined) as DebtReason | undefined })} className={inputClass}>
                                <option value="">Não informado</option>
                                {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Classificação</label>
                            <select value={form.classification || ''} onChange={e => setForm({ ...form, classification: (e.target.value || undefined) as DebtClassification | undefined })} className={inputClass}>
                                <option value="">Não informada</option>
                                <option value="productive">Produtiva</option>
                                <option value="passive">Passiva</option>
                            </select>
                        </div>
                    </div>

                    {/* Checkbox: Criar despesa recorrente */}
                    {!editingId && (
                        <div className="mt-6 p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900 rounded-2xl">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={!!form.createExpense}
                                        onChange={e => setForm({ ...form, createExpense: e.target.checked })}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.createExpense ? 'bg-sky-600 border-sky-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                        {form.createExpense && <CheckCircle size={12} className="text-white" />}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-sky-800 dark:text-sky-200 flex items-center gap-1.5">
                                        <Receipt size={14} /> Lançar parcela nas Despesas
                                    </p>
                                    <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
                                        Ao salvar, você será direcionado para a aba de Despesas com os dados da parcela
                                        {form.installmentValue ? ` (${fmt(form.installmentValue)})` : ''} pré-preenchidos.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-rose-100 transition-all uppercase tracking-widest text-xs">
                            <Save size={18} /> {editingId ? 'Atualizar' : form.createExpense ? 'Salvar e Lançar Despesa →' : 'Salvar Dívida'}
                        </button>
                    </div>
                </form>
            )}

            {/* Empty State */}
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

            {/* Debt List */}
            {debts.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suas Dívidas ({debts.length})</h3>
                    {debts.map(debt => {
                        const progress = getProgressPercent(debt);
                        const isSimulating = simulateDebt === debt.id;
                        const monthsLeft = calcMonthsToQuit(debt.currentBalance, debt.interestRateMonthly || 0, debt.installmentValue);

                        // Calc simulation result
                        const simByInstallments = isSimulating ? calcAnticipationByInstallments(debt, simInstallments) : null;
                        const simByValue = isSimulating ? calcAnticipationByValue(debt, simExtra) : null;
                        const simResult = simMode === 'installments' ? simByInstallments : simByValue;

                        return (
                            <div key={debt.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-black text-slate-900 dark:text-white text-base">{debt.name}</h4>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 uppercase">{DEBT_TYPE_LABELS[debt.type]}</span>
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

                                    {/* Progress */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
                                            <span>{progress.toFixed(1)}% quitado</span>
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
                                        <button onClick={() => { setSimulateDebt(isSimulating ? null : debt.id); setSimInstallments(1); setSimExtra(0); }}
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
                                        <button onClick={() => openExpenseModal(debt)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors">
                                            <Receipt size={12} /> Lançar Despesa
                                        </button>
                                    </div>

                                    {/* Simulation Panel */}
                                    {isSimulating && (
                                        <div className="mt-4 p-5 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-900">
                                            <h5 className="text-xs font-black text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <Zap size={12} /> Simulador de Antecipação
                                            </h5>

                                            {/* Mode Tabs */}
                                            <div className="flex gap-2 mb-4">
                                                {(['installments', 'value'] as const).map(mode => (
                                                    <button key={mode} onClick={() => setSimMode(mode)}
                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${simMode === mode ? 'bg-sky-600 text-white shadow' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                        {mode === 'installments' ? '# Antecipar Parcelas' : 'R$ Amortizar Valor'}
                                                    </button>
                                                ))}
                                            </div>

                                            {simMode === 'installments' ? (
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Quantas parcelas deseja antecipar?</label>
                                                        <p className="text-[9px] text-sky-500 dark:text-sky-400">Máximo: {debt.remainingInstallments} parcelas restantes × {fmt(debt.installmentValue)} = {fmt(debt.remainingInstallments * debt.installmentValue)}</p>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 font-bold text-sm pointer-events-none">#</span>
                                                            <input type="number" min="1" max={debt.remainingInstallments} step="1" value={simInstallments}
                                                                onChange={e => setSimInstallments(Math.min(parseInt(e.target.value) || 1, debt.remainingInstallments))}
                                                                className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded-xl font-bold text-sky-700 dark:text-sky-300 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
                                                        </div>
                                                    </div>
                                                    {simByInstallments && simInstallments > 0 && (
                                                        <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-sky-100 dark:border-sky-900">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">📊 Resultado da Simulação</p>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500 font-medium">Valor a pagar agora:</span>
                                                                    <span className="font-black text-rose-600">{fmt(simByInstallments.anticipationValue)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500 font-medium">Novo saldo devedor:</span>
                                                                    <span className="font-black text-slate-800 dark:text-slate-200">{fmt(simByInstallments.newBalance)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500 font-medium">Parcelas restantes:</span>
                                                                    <span className="font-black text-slate-800 dark:text-slate-200">{simByInstallments.newRemaining}x</span>
                                                                </div>
                                                                {(debt.interestRateMonthly || 0) > 0 && (
                                                                    <div className="flex justify-between pt-2 border-t border-sky-100 dark:border-sky-900">
                                                                        <span className="text-emerald-600 font-bold">✅ Economia em juros:</span>
                                                                        <span className="font-black text-emerald-600">{fmt(simByInstallments.interestSaved)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between">
                                                                    <span className="text-violet-600 font-bold">⚡ Prazo reduzido em:</span>
                                                                    <span className="font-black text-violet-600">{simByInstallments.monthsReduced} meses</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500 font-medium">Nova quitação estimada:</span>
                                                                    <span className="font-black text-slate-700 dark:text-slate-300">{simByInstallments.newEndDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Valor extra para amortizar o saldo</label>
                                                        <p className="text-[9px] text-sky-500 dark:text-sky-400">Saldo atual: {fmt(debt.currentBalance)} — Esse valor será abatido diretamente do saldo devedor</p>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 font-bold text-sm pointer-events-none">R$</span>
                                                            <input type="number" min="0" max={debt.currentBalance} step="100" value={simExtra || ''}
                                                                onChange={e => setSimExtra(parseFloat(e.target.value) || 0)}
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded-xl font-bold text-sky-700 dark:text-sky-300 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
                                                        </div>
                                                    </div>
                                                    {simByValue && simExtra > 0 && (
                                                        <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-sky-100 dark:border-sky-900">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">📊 Resultado da Simulação</p>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500 font-medium">Novo saldo devedor:</span>
                                                                    <span className="font-black text-slate-800 dark:text-slate-200">{fmt(simByValue.newBalance)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500 font-medium">Novo prazo estimado:</span>
                                                                    <span className="font-black text-slate-800 dark:text-slate-200">{simByValue.newMonths} meses</span>
                                                                </div>
                                                                {(debt.interestRateMonthly || 0) > 0 && (
                                                                    <div className="flex justify-between pt-2 border-t border-sky-100 dark:border-sky-900">
                                                                        <span className="text-emerald-600 font-bold">✅ Economia em juros:</span>
                                                                        <span className="font-black text-emerald-600">{fmt(simByValue.interestSaved)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between">
                                                                    <span className="text-violet-600 font-bold">⚡ Prazo reduzido em:</span>
                                                                    <span className="font-black text-violet-600">{simByValue.monthsReduced} meses</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500 font-medium">Nova quitação estimada:</span>
                                                                    <span className="font-black text-slate-700 dark:text-slate-300">{simByValue.newEndDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-rose-600" /> Método Avalanche</h3>
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
                        {sortedAvalanche[0] && <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2"><Info size={12} className="shrink-0 mt-0.5" /><span>Priorize <strong>{sortedAvalanche[0].name}</strong> — maiores juros. Maximize a economia com menor custo financeiro.</span></div>}
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-1"><Target size={16} className="text-sky-600" /> Bola de Neve</h3>
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
                        {sortedSnowball[0] && <div className="mt-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl text-[11px] text-sky-700 dark:text-sky-300 font-medium flex items-start gap-2"><Info size={12} className="shrink-0 mt-0.5" /><span>Quite <strong>{sortedSnowball[0].name}</strong> primeiro para liberar {fmt(sortedSnowball[0].installmentValue)}/mês no fluxo de caixa.</span></div>}
                    </div>
                </div>
            )}

            {/* Timeline */}
            {debts.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4"><Calendar size={16} className="text-violet-600" /> Linha do Tempo das Quitações</h3>
                    <div className="overflow-x-auto">
                        <div className="flex gap-6 min-w-max pb-2">
                            {[...debts].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).map(d => {
                                const end = new Date(d.endDate);
                                const now = new Date();
                                const diff = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
                                return (
                                    <div key={d.id} className="flex flex-col items-center gap-1.5 min-w-[110px]">
                                        <div className={`w-3 h-3 rounded-full shadow-sm ${diff <= 0 ? 'bg-emerald-400' : diff <= 6 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                                        <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">{d.name}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500">{end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
                                            <p className={`text-[9px] font-black ${diff <= 0 ? 'text-emerald-500' : diff <= 6 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {diff <= 0 ? '✅ Quitada' : `em ${diff} meses`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            {/* ===== MODAL DE LANÇAMENTO DE DESPESA ===== */}
            {expenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setExpenseModal(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                    <Receipt size={20} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white">Lançar Despesa</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Revise e confirme o lançamento</p>
                                </div>
                            </div>
                            <button onClick={() => setExpenseModal(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Descrição */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Descrição *</label>
                                <input type="text" value={expenseModal.description || ''}
                                    onChange={e => setExpenseModal({ ...expenseModal, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 dark:text-white" />
                            </div>

                            {/* Valor */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Valor da Parcela (R$) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                    <input type="number" min="0" step="0.01" value={expenseModal.amount || ''}
                                        onChange={e => setExpenseModal({ ...expenseModal, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-900 dark:text-white" />
                                </div>
                            </div>

                            {/* Categoria e Subcategoria */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Categoria</label>
                                    <select value={expenseModal.category || 'Outros'}
                                        onChange={e => setExpenseModal({ ...expenseModal, category: e.target.value, subCategory: CATEGORIES_MAP[e.target.value]?.[0] || 'Diversos' })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 dark:text-white">
                                        {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Subcategoria</label>
                                    <select value={expenseModal.subCategory || ''}
                                        onChange={e => setExpenseModal({ ...expenseModal, subCategory: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 dark:text-white">
                                        {(CATEGORIES_MAP[expenseModal.category || 'Outros'] || ['Diversos']).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Data e Conta */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Data *</label>
                                    <input type="date" value={expenseModal.date || ''}
                                        onChange={e => setExpenseModal({ ...expenseModal, date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 dark:text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Conta</label>
                                    <select value={expenseModal.account || ''}
                                        onChange={e => setExpenseModal({ ...expenseModal, account: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 dark:text-white">
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Método e Status */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Método de Pagamento</label>
                                    <select value={expenseModal.paymentMethod || 'Débito Automático'}
                                        onChange={e => setExpenseModal({ ...expenseModal, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 dark:text-white">
                                        {['Débito Automático', 'PIX', 'Débito', 'Boleto', 'Cartão de Crédito', 'Transferência', 'Dinheiro'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Status</label>
                                    <select value={expenseModal.isPaid ? 'paid' : 'pending'}
                                        onChange={e => setExpenseModal({ ...expenseModal, isPaid: e.target.value === 'paid' })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 dark:text-white">
                                        <option value="paid">✅ Pago</option>
                                        <option value="pending">🕐 Pendente</option>
                                    </select>
                                </div>
                            </div>

                            {/* Recorrência e Parcelas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Recorrência</label>
                                    <select value={expenseModal.recurrence || 'installment'}
                                        onChange={e => setExpenseModal({ ...expenseModal, recurrence: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 dark:text-white">
                                        <option value="one_time">Única</option>
                                        <option value="fixed">Mensal (Fixa)</option>
                                        <option value="installment">Parcelada</option>
                                    </select>
                                </div>
                                {expenseModal.recurrence === 'installment' && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1"># de Parcelas</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</span>
                                            <input type="number" min="1" value={expenseModal.installmentCount || 1}
                                                onChange={e => setExpenseModal({ ...expenseModal, installmentCount: parseInt(e.target.value) || 1 })}
                                                className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-900 dark:text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Resumo */}
                            {expenseModal.recurrence === 'installment' && (expenseModal.installmentCount || 0) > 1 && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-sm">
                                    <p className="text-emerald-700 dark:text-emerald-300 font-bold">
                                        💳 <strong>{expenseModal.installmentCount}x</strong> de <strong>R$ {(expenseModal.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                        {' = '}Total: <strong>R$ {((expenseModal.amount || 0) * (expenseModal.installmentCount || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </p>
                                    <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">⚡ Serão criadas {expenseModal.installmentCount} transações mensais automáticas a partir de hoje.</p>
                                </div>
                            )}

                            {/* Botões */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setExpenseModal(null)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleLaunchExpense}
                                    className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2">
                                    <CheckCircle size={16} /> Confirmar Lançamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtManager;
