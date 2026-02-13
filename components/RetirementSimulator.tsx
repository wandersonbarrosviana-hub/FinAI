import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Bar, ReferenceDot, Label, ReferenceLine } from 'recharts';
import { Calculator, Table, Calendar, TrendingUp, DollarSign, Info, Umbrella } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { Budget } from '../types';

interface RetirementSimulatorProps {
    transactions: Transaction[];
    budgets?: Budget[];
}

const RetirementSimulator: React.FC<RetirementSimulatorProps> = ({ transactions, budgets }) => {
    // Inputs
    const [desiredIncome, setDesiredIncome] = useState(5000);
    const [currentPatrimony, setCurrentPatrimony] = useState(0);
    const [monthlyContribution, setMonthlyContribution] = useState(1000);
    const [annualRate, setAnnualRate] = useState(10); // 10% a.a
    const [annualInflation, setAnnualInflation] = useState(4); // 4% a.a
    // const [yearsToSimulate, setYearsToSimulate] = useState(30); // Removed per user request, fixed to 70

    // View State
    const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('annual');
    const [showRealValues, setShowRealValues] = useState(false);
    const [applyBudgetSurplus, setApplyBudgetSurplus] = useState(false);

    // Budget Surplus Calculation
    const budgetSurplus = useMemo(() => {
        if (!budgets || budgets.length === 0) return 0;
        const currentMonth = new Date().toISOString().slice(0, 7);
        const income = transactions
            .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);
        const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
        return Math.max(0, income - totalBudgeted);
    }, [transactions, budgets]);

    // Calculations
    const simulationData = useMemo(() => {
        const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
        const monthlyInflation = Math.pow(1 + annualInflation / 100, 1 / 12) - 1;

        // Target Patrimony (Fire Number)
        // Usually: Desired Income * 12 / Safe Withdrawal Rate (e.g. 4% Real)
        // Or specific target inputs. Let's use 4% Rule (300x monthly income) as a baseline target line.
        // But since we are modelling Nominal values (with inflation), the Target Nominal Amount grows.
        const baseTarget = desiredIncome * 300;

        let currentBalance = currentPatrimony;
        let totalInvested = currentPatrimony;
        let cumulativeInflationFactor = 1;
        let currentTarget = baseTarget;

        const data = [];
        const yearsFixed = 60; // Fixed 60 years per user request
        const months = yearsFixed * 12;

        for (let i = 0; i <= months; i++) {
            // Logic:
            // 1. Add Contribution
            // 2. Apply Interest
            // 3. Apply Inflation to Target

            // For Month 0 (Start)
            if (i === 0) {
                data.push({
                    month: 0,
                    year: 0,
                    yearLabel: new Date().getFullYear(),
                    invested: currentPatrimony,
                    interest: 0,
                    total: currentPatrimony,
                    inflationLoss: 0,
                    target: baseTarget,
                    contributionNeeded: monthlyContribution,
                    // Init new fields
                    passiveIncome: 0,
                    requiredIncomeNominal: desiredIncome,
                    realTotal: currentPatrimony,
                    realPassiveIncome: 0,
                    requiredIncomeReal: desiredIncome
                });
                continue;
            }

            const effectiveContribution = monthlyContribution + (applyBudgetSurplus ? budgetSurplus : 0);

            const interestEarned = currentBalance * monthlyRate;

            currentBalance += interestEarned + effectiveContribution;
            totalInvested += effectiveContribution;

            cumulativeInflationFactor *= (1 + monthlyInflation);
            currentTarget = baseTarget * cumulativeInflationFactor; // Target grows to maintain purchasing power

            // "Preço corroído pela inflação" usually means "What is this nominal amount worth in today's money?"
            const realValue = currentBalance / cumulativeInflationFactor;
            const inflationLoss = currentBalance - realValue;

            // Real Interest (Passive Income in today's money)
            const realInterest = interestEarned / cumulativeInflationFactor;

            const adjustedContribution = monthlyContribution * cumulativeInflationFactor;

            data.push({
                month: i,
                year: Math.floor(i / 12),
                yearLabel: new Date().getFullYear() + Math.floor(i / 12),
                invested: totalInvested,

                // Nominal
                interest: interestEarned,
                total: currentBalance,
                passiveIncome: interestEarned,
                requiredIncomeNominal: desiredIncome * cumulativeInflationFactor,

                // Real
                realTotal: realValue,
                realPassiveIncome: realInterest,
                requiredIncomeReal: desiredIncome, // Constant in real terms

                inflationLoss: inflationLoss,
                target: currentTarget,
                contributionNeeded: adjustedContribution
            });
        }
        return data;
    }, [desiredIncome, currentPatrimony, monthlyContribution, annualRate, annualInflation]);

    // Aggregate for Table/Chart if Annual
    // Aggregate for Table/Chart if Annual
    const displayData = useMemo(() => {
        let processedData = simulationData;

        // 1. Filter/Group by ViewMode (Monthly vs Annual)
        if (viewMode === 'annual') {
            const annualData: any[] = [];
            const years = Array.from(new Set(simulationData.map(d => d.year)));

            years.forEach(y => {
                const monthsOfYear = simulationData.filter(d => d.year === y);
                const lastMonthOfYear = monthsOfYear[monthsOfYear.length - 1];

                // Sums for the year
                const yearInterest = monthsOfYear.reduce((sum, m) => sum + m.interest, 0);
                const yearRealInterest = monthsOfYear.reduce((sum, m) => sum + m.realPassiveIncome, 0);
                const yearRequiredNominal = monthsOfYear.reduce((sum, m) => sum + m.requiredIncomeNominal, 0);
                const yearRequiredReal = monthsOfYear.reduce((sum, m) => sum + m.requiredIncomeReal, 0);

                if (lastMonthOfYear) {
                    annualData.push({
                        ...lastMonthOfYear,
                        // Override monthly values with annual sums for the "flow" metrics
                        interest: yearInterest,
                        realPassiveIncome: yearRealInterest,
                        passiveIncome: yearInterest, // Nominal Annual Sum
                        requiredIncomeNominal: yearRequiredNominal,
                        requiredIncomeReal: yearRequiredReal,
                    });
                }
            });
            processedData = annualData;
        }

        // 2. Map based on ShowRealValues
        return processedData.map(d => ({
            ...d,
            // Displayed Values (Dynamic)
            // Fallback to 0 if undefined to avoid chart errors during hot-reload transitional states
            displayTotal: showRealValues ? (d.realTotal || 0) : (d.total || 0),
            displayPassiveIncome: showRealValues ? (d.realPassiveIncome || 0) : (d.passiveIncome || 0),
            displayRequiredIncome: showRealValues ? (d.requiredIncomeReal || 0) : (d.requiredIncomeNominal || 0),
            // New Calculation: Interest Earned (Total - Invested)
            // If showing Real Values: Real Total - Invested (Real Invested is roughly the same if we assume contribution matches inflation, but simpler: Real Total - Sum(Real Contributions))
            // Actually, "Invested" is usually Nominal sum.
            // But let's stick to the user request: "History 60 years and interest obtained is entire final patrimony value minus invested value".
            // So: displayTotal - invested.
            displayAccumulatedInterest: (showRealValues ? (d.realTotal || 0) : (d.total || 0)) - d.invested
        }));

    }, [simulationData, viewMode, showRealValues]);

    // Find Freedom Point (First time Passive Income > Required)
    // We search displayData directly so it respects the current view mode's aggregation
    // (Annual View: Sum vs Sum, Monthly View: Value vs Value)
    const freedomPoint = useMemo(() => {
        return displayData.find(d => d.displayPassiveIncome >= d.displayRequiredIncome);
    }, [displayData]);

    // -------------------------------------------------------------------------
    // RENDER HELPERS
    // -------------------------------------------------------------------------

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-sky-600" size={40} />
                    Simulador de Aposentadoria
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Planeje sua liberdade financeira com base em juros compostos.</p>
            </div>

            {/* Inputs Grid */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 ring-1 ring-black/5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Renda Desejada</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-slate-300 font-black">R$</span>
                            <input
                                type="number"
                                value={desiredIncome}
                                onChange={(e) => setDesiredIncome(Number(e.target.value))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Patrimônio Inicial</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-slate-300 font-black">R$</span>
                            <input
                                type="number"
                                value={currentPatrimony}
                                onChange={(e) => setCurrentPatrimony(Number(e.target.value))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Aporte Mensal</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-slate-300 font-black">R$</span>
                            <input
                                type="number"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Rentabilidade (%)</label>
                        <input
                            type="number"
                            value={annualRate}
                            onChange={(e) => setAnnualRate(Number(e.target.value))}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Inflação (%)</label>
                        <input
                            type="number"
                            value={annualInflation}
                            onChange={(e) => setAnnualInflation(Number(e.target.value))}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 font-bold"
                        />
                    </div>
                </div>

                {/* Budget Integration Toggle - Always visible now */}
                <div className="mt-6 bg-indigo-50 p-4 rounded-2xl flex items-center justify-between border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => setApplyBudgetSurplus(!applyBudgetSurplus)}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${applyBudgetSurplus ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-300'}`}>
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-indigo-900">Acelerar com Saldo do Orçamento</p>
                            <p className="text-xs text-indigo-600 font-medium">
                                Adicionar <span className="font-bold">R$ {budgetSurplus.toLocaleString('pt-BR')}</span> extras todo mês (sobra do orçamento atual).
                            </p>
                        </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${applyBudgetSurplus ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                        <div className={`h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${applyBudgetSurplus ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                </div>

            </div>

            {/* Chart Area */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm ring-1 ring-black/5">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Projeção de Longo Prazo</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">Simulação nominal vs real pelos próximos 60 anos.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => setShowRealValues(false)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${!showRealValues ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                NOMINAL
                            </button>
                            <button
                                onClick={() => setShowRealValues(true)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${showRealValues ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                REAL
                            </button>
                        </div>

                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                MENSAL
                            </button>
                            <button
                                onClick={() => setViewMode('annual')}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${viewMode === 'annual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                ANUAL
                            </button>
                        </div>
                    </div>
                </div>

                {freedomPoint && (
                    <div className="mb-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-center gap-4">
                        <span className="text-3xl">🏖️</span>
                        <p className="text-emerald-700 font-black text-lg tracking-tight">
                            Independência Financeira em <span className="text-emerald-900 underline decoration-emerald-200 underline-offset-4">{Math.floor(freedomPoint.month / 12)} anos e {freedomPoint.month % 12} meses</span>!
                        </p>
                    </div>
                )}

                <div className="h-[450px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayData} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPassive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey={viewMode === 'annual' ? "yearLabel" : "month"}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                minTickGap={30}
                                dy={15}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#d97706' }}
                                tickFormatter={(value) => `R$${(value / 1000).toLocaleString()}k`}
                                dx={-10}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                // Scale to keep the line visually below the main area (approx bottom 1/3)
                                domain={[0, (dataMax: number) => dataMax * 3]}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#10b981' }}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#10b981' }}
                                tickFormatter={(value) => `R$${value.toLocaleString()}`}
                                dx={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: '#0f172a', padding: '16px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                                labelStyle={{ color: '#64748b', fontWeight: 700, marginBottom: '8px' }}
                                labelFormatter={(label) => viewMode === 'annual' ? `Ano ${label}` : `Mês ${label}`}
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="displayTotal"
                                stroke="#d97706"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                name="Patrimônio Final"
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="invested"
                                stroke="#0ea5e9"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorInvested)"
                                name="Valor Investido"
                            />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="displayPassiveIncome"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorPassive)"
                                name="Renda Passiva Mensal"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden ring-1 ring-black/5">
                <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                    <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                        <Table size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Detalhamento Numérico</h3>
                        <p className="text-xs font-medium text-slate-400">Evolução detalhada período a período.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[10px] tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Período</th>
                                <th className="px-8 py-5">Investido</th>
                                <th className="px-8 py-5">Juros Acum.</th>
                                <th className="px-8 py-5">Perda Inflação</th>
                                <th className="px-8 py-5">Patrimônio Final</th>
                                <th className="px-8 py-5">Renda Passiva</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {displayData.filter((_, idx) => viewMode === 'annual' || idx % 12 === 0 || idx === displayData.length - 1).map((row) => {
                                const isFreedom = freedomPoint && (viewMode === 'annual' ? row.year === freedomPoint.year : row.month === freedomPoint.month);
                                return (
                                    <tr key={row.month} className={`group transition-all ${isFreedom ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}>
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${isFreedom ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}`}>
                                                {viewMode === 'annual' ? `ANO ${row.yearLabel}` : `MÊS ${row.month}`}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-600 font-bold">
                                            R$ {row.invested.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-8 py-5 text-emerald-500 font-bold">
                                            + R$ {row.displayAccumulatedInterest.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-8 py-5 text-rose-500 font-bold">
                                            R$ {row.inflationLoss.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-8 py-5 text-slate-900 font-black">
                                            R$ {row.displayTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-emerald-700 font-black">R$ {row.displayPassiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};

export default RetirementSimulator;
