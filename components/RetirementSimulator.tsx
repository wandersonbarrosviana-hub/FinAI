import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Bar, ReferenceDot, Label, ReferenceLine, ReferenceArea } from 'recharts';
import { Calculator, Table, Calendar, TrendingUp, DollarSign, Info, Umbrella } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { Budget } from '../types';
import { CATEGORIES } from '../constants';

interface RetirementSimulatorProps {
    transactions: Transaction[];
    budgets?: Budget[];
    simulationParams?: {
        desiredIncome?: number;
        currentPatrimony?: number;
        monthlyContribution?: number;
        years?: number;
    } | null;
}

const RetirementSimulator: React.FC<RetirementSimulatorProps> = ({ transactions, budgets, simulationParams }) => {
    // Inputs
    const [desiredIncome, setDesiredIncome] = useState(5000);
    const [currentPatrimony, setCurrentPatrimony] = useState(0);
    const [monthlyContribution, setMonthlyContribution] = useState(1000);
    const [annualRate, setAnnualRate] = useState(10); // 10% a.a
    const [annualInflation, setAnnualInflation] = useState(4); // 4% a.a

    // View State
    const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('annual');
    const [showRealValues, setShowRealValues] = useState(false);
    const [applyBudgetSurplus, setApplyBudgetSurplus] = useState(false);
    const [yearsToSimulate, setYearsToSimulate] = useState(60); // Default to 60 years

    // Effect to update state from AI params
    React.useEffect(() => {
        if (simulationParams) {
            if (simulationParams.desiredIncome) setDesiredIncome(simulationParams.desiredIncome);
            if (simulationParams.currentPatrimony) setCurrentPatrimony(simulationParams.currentPatrimony);
            if (simulationParams.monthlyContribution) setMonthlyContribution(simulationParams.monthlyContribution);
            if (simulationParams.years) setYearsToSimulate(simulationParams.years);
        }
    }, [simulationParams]);

    // Budget Surplus Calculation - Refined with failover and CATEGORIES defaults
    const budgetSurplus = useMemo(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        let income = transactions
            .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        // If no income this month, look for the most recent month with income
        if (income === 0 && transactions.length > 0) {
            const incomeTransactions = transactions.filter(t => t.type === 'income');
            if (incomeTransactions.length > 0) {
                // Sort by date descending
                const sortedIncomes = [...incomeTransactions].sort((a, b) => b.date.localeCompare(a.date));
                const lastMonth = sortedIncomes[0].date.slice(0, 7);
                income = transactions
                    .filter(t => t.type === 'income' && t.date.startsWith(lastMonth))
                    .reduce((sum, t) => sum + t.amount, 0);
            }
        }

        // Use CATEGORIES to calculate total budget
        const totalBudgeted = CATEGORIES.reduce((sum, category) => {
            const persisted = budgets?.find(b => b.category === category && (!b.month || b.month === currentMonth));
            const amount = persisted ? persisted.amount : (income > 0 ? income * 0.1 : 500);
            return sum + amount;
        }, 0);

        return Math.max(0, income - totalBudgeted);
    }, [transactions, budgets]);

    const calculateSimulation = (extraMonthly: number) => {
        const data = [];
        let currentBalance = currentPatrimony;
        let totalInvested = currentPatrimony;
        let totalRealInvested = currentPatrimony;

        const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
        const monthlyInflation = Math.pow(1 + annualInflation / 100, 1 / 12) - 1;

        const baseMonthlyContribution = monthlyContribution + extraMonthly;
        const baseTarget = (desiredIncome / monthlyRate);

        let cumulativeInflationFactor = 1;

        for (let i = 0; i <= 70 * 12; i++) {
            const interestEarned = currentBalance * monthlyRate;

            // On month 0, we just show the initial state
            if (i === 0) {
                data.push({
                    month: 0,
                    year: 0,
                    yearLabel: new Date().getFullYear(),
                    invested: currentPatrimony,
                    realInvested: currentPatrimony,
                    interest: 0,
                    total: currentPatrimony,
                    passiveIncome: 0,
                    requiredIncomeNominal: desiredIncome,
                    realTotal: currentPatrimony,
                    realPassiveIncome: 0,
                    requiredIncomeReal: desiredIncome,
                    inflationLoss: 0,
                    target: baseTarget,
                    contributionNeeded: baseMonthlyContribution
                });
                continue;
            }

            currentBalance += interestEarned + baseMonthlyContribution;
            totalInvested += baseMonthlyContribution;

            cumulativeInflationFactor *= (1 + monthlyInflation);

            // For real investment, we accumulate the present value of each contribution
            totalRealInvested += (baseMonthlyContribution / cumulativeInflationFactor);

            const currentTarget = baseTarget * cumulativeInflationFactor;

            const realValue = currentBalance / cumulativeInflationFactor;
            const inflationLoss = currentBalance - realValue;
            const realInterest = interestEarned / cumulativeInflationFactor;

            const adjustedContribution = baseMonthlyContribution * cumulativeInflationFactor;

            data.push({
                month: i,
                year: Math.floor(i / 12),
                yearLabel: new Date().getFullYear() + Math.floor(i / 12),
                invested: totalInvested,
                realInvested: totalRealInvested,
                interest: interestEarned,
                total: currentBalance,
                passiveIncome: interestEarned,
                requiredIncomeNominal: desiredIncome * cumulativeInflationFactor,
                realTotal: realValue,
                realPassiveIncome: realInterest,
                requiredIncomeReal: desiredIncome,
                inflationLoss: inflationLoss,
                target: currentTarget,
                contributionNeeded: adjustedContribution
            });
        }
        return data;
    };

    const simulationData = useMemo(() => {
        const extra = applyBudgetSurplus ? budgetSurplus : 0;
        return calculateSimulation(extra);
    }, [desiredIncome, currentPatrimony, monthlyContribution, annualRate, annualInflation, applyBudgetSurplus, budgetSurplus]);

    const baselineSimulationData = useMemo(() => {
        return calculateSimulation(0);
    }, [desiredIncome, currentPatrimony, monthlyContribution, annualRate, annualInflation]);

    const displayData = useMemo(() => {
        let processedData = simulationData;

        if (viewMode === 'annual') {
            const annualData: any[] = [];
            const years = Array.from(new Set(simulationData.map(d => d.year)));

            years.forEach(y => {
                const monthsOfYear = simulationData.filter(d => d.year === y);
                const lastMonthOfYear = monthsOfYear[monthsOfYear.length - 1];
                const yearInterest = monthsOfYear.reduce((sum, m) => sum + m.interest, 0);
                const yearRealInterest = monthsOfYear.reduce((sum, m) => sum + m.realPassiveIncome, 0);
                const yearRequiredNominal = monthsOfYear.reduce((sum, m) => sum + m.requiredIncomeNominal, 0);
                const yearRequiredReal = monthsOfYear.reduce((sum, m) => sum + m.requiredIncomeReal, 0);

                if (lastMonthOfYear) {
                    annualData.push({
                        ...lastMonthOfYear,
                        yearLabel: y,
                        interest: yearInterest, // Total accumulated interest in year
                        // User requested Annual Passive Income / 12 for the annual chart
                        // Currently 'yearInterest' is the SUM of interest/passive income of all months.
                        // So dividing by 12 gives the average monthly passive income for that year.
                        realPassiveIncome: yearRealInterest / 12,
                        passiveIncome: yearInterest / 12,
                        // Required income is also monthly target, but summed up? 
                        // Let's check logic. `requiredIncomeNominal` in monthly data is the monthly required.
                        // Ideally we show the Monthly Required Target vs Monthly Passive Income Average.
                        requiredIncomeNominal: yearRequiredNominal / 12,
                        requiredIncomeReal: yearRequiredReal / 12,
                    });
                }
            });
            processedData = annualData;
        }

        return processedData.map(d => {
            const displayTotal = showRealValues ? (d.realTotal || 0) : (d.total || 0);
            const displayInvested = showRealValues ? (d.realInvested || 0) : (d.invested || 0);

            return {
                ...d,
                displayTotal,
                displayInvested,
                displayPassiveIncome: showRealValues ? (d.realPassiveIncome || 0) : (d.passiveIncome || 0),
                displayRequiredIncome: showRealValues ? (d.requiredIncomeReal || 0) : (d.requiredIncomeNominal || 0),
                displayAccumulatedInterest: displayTotal - displayInvested
            };
        }).filter(d => d.year <= yearsToSimulate);
    }, [simulationData, viewMode, showRealValues, yearsToSimulate]);

    // Find Freedom Point (First time Passive Income > Required)
    // We calculate this from the full simulation data so the header remains constant regardless of zoom
    const freedomPoint = useMemo(() => {
        // We need a non-filtered version of display mapping for this
        const fullDisplayData = simulationData.map(d => ({
            ...d,
            displayPassiveIncome: showRealValues ? (d.realPassiveIncome || 0) : (d.passiveIncome || 0),
            displayRequiredIncome: showRealValues ? (d.requiredIncomeReal || 0) : (d.requiredIncomeNominal || 0),
        }));
        return fullDisplayData.find(d => d.displayPassiveIncome >= d.displayRequiredIncome);
    }, [simulationData, showRealValues]);

    const baselineFreedomPoint = useMemo(() => {
        // Calculate based on the full baseline simulation
        const fullBaselineDisplayData = baselineSimulationData.map(d => ({
            ...d,
            displayPassiveIncome: showRealValues ? (d.realPassiveIncome || 0) : (d.passiveIncome || 0),
            displayRequiredIncome: showRealValues ? (d.requiredIncomeReal || 0) : (d.requiredIncomeNominal || 0),
        }));
        return fullBaselineDisplayData.find(d => d.displayPassiveIncome >= d.displayRequiredIncome);
    }, [baselineSimulationData, showRealValues]);

    const timeReduction = useMemo(() => {
        if (!freedomPoint || !baselineFreedomPoint || !applyBudgetSurplus) return null;
        const m1 = baselineFreedomPoint.month;
        const m2 = freedomPoint.month;
        const diff = m1 - m2;
        if (diff <= 0) return null;
        return {
            years: Math.floor(diff / 12),
            months: diff % 12
        };
    }, [freedomPoint, baselineFreedomPoint, applyBudgetSurplus]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            <div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-sky-600 dark:text-sky-400" size={40} />
                    Simulador de Aposentadoria
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Planeje sua liberdade financeira com base em juros compostos.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 ring-1 ring-black/5 dark:ring-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Renda Desejada</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-slate-300 dark:text-slate-600 font-black">R$</span>
                            <input
                                type="number"
                                value={desiredIncome}
                                onChange={(e) => setDesiredIncome(Number(e.target.value))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 dark:text-white font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Patrimônio Inicial</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-slate-300 dark:text-slate-600 font-black">R$</span>
                            <input
                                type="number"
                                value={currentPatrimony}
                                onChange={(e) => setCurrentPatrimony(Number(e.target.value))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 dark:text-white font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Aporte Mensal</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-slate-300 dark:text-slate-600 font-black">R$</span>
                            <input
                                type="number"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 dark:text-white font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Rentabilidade (%)</label>
                        <input
                            type="number"
                            value={annualRate}
                            onChange={(e) => setAnnualRate(Number(e.target.value))}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 dark:text-white font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Inflação (%)</label>
                        <input
                            type="number"
                            value={annualInflation}
                            onChange={(e) => setAnnualInflation(Number(e.target.value))}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 dark:text-white font-bold"
                        />
                    </div>
                </div>

                <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl flex items-center justify-between border border-indigo-100 dark:border-indigo-900/20 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors" onClick={() => setApplyBudgetSurplus(!applyBudgetSurplus)}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${applyBudgetSurplus ? 'bg-indigo-500 dark:bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-indigo-300 dark:text-indigo-400'}`}>
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-indigo-900 dark:text-indigo-200">Acelerar com Saldo do Orçamento</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                Adicionar <span className="font-bold">R$ {budgetSurplus.toLocaleString('pt-BR')}</span> extras todo mês (sobra do orçamento atual).
                            </p>
                        </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${applyBudgetSurplus ? 'bg-indigo-500 dark:bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <div className={`h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${applyBudgetSurplus ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Projeção de Longo Prazo</h3>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">Simulação nominal vs real pelos próximos {yearsToSimulate} anos.</p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            {[5, 10, 20, 30, 40, 50, 60].map((y) => (
                                <button
                                    key={y}
                                    onClick={() => setYearsToSimulate(y)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${yearsToSimulate === y ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    {y}A
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setShowRealValues(false)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${!showRealValues ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                NOMINAL
                            </button>
                            <button
                                onClick={() => setShowRealValues(true)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${showRealValues ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                REAL
                            </button>
                        </div>

                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                MENSAL
                            </button>
                            <button
                                onClick={() => setViewMode('annual')}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${viewMode === 'annual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                ANUAL
                            </button>
                        </div>
                    </div>
                </div>

                {freedomPoint && (
                    <div className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 flex flex-col items-center justify-center gap-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-3 md:gap-4">
                                <span className="text-2xl md:text-3xl">🏖️</span>
                                <p className="text-emerald-700 dark:text-emerald-400 font-black text-base md:text-lg tracking-tight">
                                    No ano <span className="font-extrabold">{freedomPoint.yearLabel}</span> você alcançará a sua liberdade financeira, ou seja, faltam apenas <span className="text-emerald-900 dark:text-emerald-300 underline decoration-emerald-200 dark:decoration-emerald-700 underline-offset-4">{Math.floor(freedomPoint.month / 12)} anos{freedomPoint.month % 12 > 0 ? ` e ${freedomPoint.month % 12} meses` : ''}</span>!
                                </p>
                            </div>
                            <p className="text-[10px] md:text-xs font-bold text-emerald-600/70 dark:text-emerald-400/60 uppercase tracking-widest">(Considerando rentabilidade real)</p>
                        </div>
                        {timeReduction && (
                            <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-100/50 dark:bg-emerald-900/30 px-6 py-3 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-700 max-w-2xl">
                                👏 Parabéns! Ao seguir seu orçamento, você antecipou sua independência em <span className="text-emerald-800 dark:text-white font-black">{timeReduction.years > 0 ? `${timeReduction.years} anos` : ''}{timeReduction.years > 0 && timeReduction.months > 0 ? ' e ' : ''}{timeReduction.months > 0 ? `${timeReduction.months} meses` : ''}</span>. Continue firme no planejamento!
                            </div>
                        )}
                    </div>
                )}

                {!freedomPoint && (
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed flex flex-col items-center justify-center gap-2 text-center">
                        <div className="flex items-center gap-4">
                            <span className="text-3xl grayscale opacity-50">⏳</span>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg tracking-tight">
                                Independência Financeira não atingida em {yearsToSimulate} anos.
                            </p>
                        </div>
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            Tente aumentar seus aportes mensais, a rentabilidade ou o prazo da simulação.
                        </p>
                    </div>
                )}

                <div className="w-full overflow-x-auto pb-4 mt-4">
                    <div className="h-[300px] md:h-[450px] min-w-[600px]">
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
                                {freedomPoint && (
                                    <>
                                        {/* Destaque (Preenchimento) no Eixo X - Simulado com Linha Larga */}
                                        <ReferenceLine
                                            x={viewMode === 'annual' ? freedomPoint.yearLabel : freedomPoint.month}
                                            stroke="#ef4444"
                                            strokeWidth={50}
                                            strokeOpacity={0.1}
                                            yAxisId="left"
                                        />

                                        {/* Linha Vertical Vermelha da base até o meio do gráfico */}
                                        <ReferenceLine
                                            x={viewMode === 'annual' ? freedomPoint.yearLabel : freedomPoint.month}
                                            stroke="#ef4444"
                                            strokeWidth={3}
                                            isFront={true}
                                            yAxisId="left"
                                            segment={[
                                                { x: viewMode === 'annual' ? freedomPoint.yearLabel : freedomPoint.month, y: 0 },
                                                { x: viewMode === 'annual' ? freedomPoint.yearLabel : freedomPoint.month, y: (Math.max(...displayData.map(d => d.displayTotal), 1) / 2) }
                                            ]}
                                        />

                                        {/* Símbolo da Barraca de Praia e Tempo exatamente no topo da linha (meio do gráfico) */}
                                        <ReferenceDot
                                            x={viewMode === 'annual' ? freedomPoint.yearLabel : freedomPoint.month}
                                            y={Math.max(...displayData.map(d => d.displayTotal), 1) / 2}
                                            yAxisId="left"
                                            r={0}
                                            isFront={true}
                                        >
                                            <Label
                                                value="🏖️"
                                                position="top"
                                                fontSize={40}
                                                offset={10}
                                            />
                                            <Label
                                                value={viewMode === 'annual' ? `ANO ${freedomPoint.yearLabel}` : `MÊS ${freedomPoint.month}`}
                                                position="top"
                                                fill="#ef4444"
                                                fontSize={14}
                                                fontWeight="900"
                                                offset={55}
                                            />
                                        </ReferenceDot>
                                    </>
                                )}


                                <XAxis
                                    dataKey={viewMode === 'annual' ? "yearLabel" : "month"}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={30}
                                    dy={15}
                                    tick={(props: any) => {
                                        const { x, y, payload } = props;
                                        const isFreedom = freedomPoint && (
                                            viewMode === 'annual'
                                                ? payload.value === freedomPoint.yearLabel
                                                : payload.value === freedomPoint.month
                                        );
                                        if (isFreedom) {
                                            return (
                                                <g transform={`translate(${x},${y})`}>
                                                    <rect x={-22} y={-4} width={44} height={22} rx={6} fill="#ef4444" />
                                                    <text x={0} y={12} textAnchor="middle" fill="white" fontSize={10} fontWeight={900}>
                                                        {payload.value}
                                                    </text>
                                                </g>
                                            );
                                        }
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text x={0} y={12} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={700}>
                                                    {payload.value}
                                                </text>
                                            </g>
                                        );
                                    }}
                                />

                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#d97706' }}
                                    tickFormatter={(value) => `R$${(value / 1000).toLocaleString()} k`}
                                    dx={-10}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, (dataMax: number) => dataMax * 3]}
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
                                    animationDuration={1500}
                                    animationEasing="ease-in-out"
                                />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="displayInvested"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorInvested)"
                                    name="Valor Investido"
                                    animationDuration={1500}
                                    animationEasing="ease-in-out"
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
                                    animationDuration={1500}
                                    animationEasing="ease-in-out"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-2xl">
                        <Table size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Detalhamento Numérico</h3>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Evolução detalhada período a período.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 uppercase font-black text-[10px] tracking-widest">
                            <tr>
                                <th className="px-8 py-5 sticky left-0 bg-slate-50 dark:bg-slate-800 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Período</th>
                                <th className="px-8 py-5">Investido</th>
                                <th className="px-8 py-5">Juros Acum.</th>
                                <th className="px-8 py-5">Perda Inflação</th>
                                <th className="px-8 py-5">Patrimônio Final</th>
                                <th className="px-8 py-5">Renda Passiva</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {displayData.filter((_, idx) => viewMode === 'annual' || idx % 12 === 0 || idx === displayData.length - 1).map((row) => {
                                const isFreedom = freedomPoint && (viewMode === 'annual' ? row.year === freedomPoint.year : row.month === freedomPoint.month);
                                return (
                                    <tr key={row.month} className={`group transition-all ${isFreedom ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                                        <td className={`px-8 py-5 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-all ${isFreedom ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800'}`}>
                                            <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${isFreedom ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                                {viewMode === 'annual' ? `ANO ${row.yearLabel}` : `MÊS ${row.month}`}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-600 dark:text-slate-300 font-bold">
                                            R$ {row.displayInvested.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-8 py-5 text-emerald-500 dark:text-emerald-400 font-bold">
                                            + R$ {row.displayAccumulatedInterest.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-8 py-5 text-rose-500 dark:text-rose-400 font-bold">
                                            R$ {row.inflationLoss.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-8 py-5 text-slate-900 dark:text-white font-black">
                                            R$ {row.displayTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-emerald-700 dark:text-emerald-400 font-black">R$ {row.displayPassiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RetirementSimulator;
