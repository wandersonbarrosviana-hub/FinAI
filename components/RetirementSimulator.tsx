import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Bar, ReferenceDot, Label, ReferenceLine } from 'recharts';
import { Calculator, Table, Calendar, TrendingUp, DollarSign, Info, Umbrella } from 'lucide-react';
import ChartContainer from './ChartContainer';

interface RetirementSimulatorProps {
    transactions: Transaction[]; // passed to calculate "suggested" essential expenses if needed
}

const RetirementSimulator: React.FC<RetirementSimulatorProps> = ({ transactions }) => {
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

            const interestEarned = currentBalance * monthlyRate;

            currentBalance += interestEarned + monthlyContribution;
            totalInvested += monthlyContribution;

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
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-sky-600" size={32} />
                    Simulador de Aposentadoria
                </h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Planeje sua liberdade financeira com base em juros compostos.</p>
            </div>

            {/* Inputs Grid */}
            <div className="bg-slate-900/50 p-6 rounded-[2rem] shadow-sm border border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Renda Mensal Desejada</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                            <input
                                type="number"
                                value={desiredIncome}
                                onChange={(e) => setDesiredIncome(Number(e.target.value))}
                                className="w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-800 font-bold text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Info size={10} /> Baseado em despesas essenciais
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patrimônio Atual</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                            <input
                                type="number"
                                value={currentPatrimony}
                                onChange={(e) => setCurrentPatrimony(Number(e.target.value))}
                                className="w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-800 font-bold text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aporte Mensal</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                            <input
                                type="number"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                className="w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-800 font-bold text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rentabilidade Anual (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={annualRate}
                                onChange={(e) => setAnnualRate(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 font-bold text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inflação Anual (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={annualInflation}
                                onChange={(e) => setAnnualInflation(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 font-bold text-slate-200 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ChartContainer title="Projeção Patrimonial" className="bg-slate-900/50">
                <div className="mb-6 flex flex-col xl:flex-row justify-between items-center gap-4">
                    {/* Legend */}
                    <div className="flex gap-2 flex-wrap justify-center">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Total
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Renda
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                        {/* Inflation Toggle */}
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setShowRealValues(false)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showRealValues ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Nominal
                            </button>
                            <button
                                onClick={() => setShowRealValues(true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showRealValues ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Real (IPCA)
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'monthly' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Mensal
                            </button>
                            <button
                                onClick={() => setViewMode('annual')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'annual' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Anual
                            </button>
                        </div>
                    </div>
                </div>

                {/* Freedom Point Summary */}
                {freedomPoint && (
                    <div className="mb-4 p-4 bg-emerald-900/20 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-center">
                        <p className="text-emerald-400 font-bold text-sm sm:text-base">
                            🎉 Liberdade Financeira em <span className="text-emerald-300 font-black">{Math.floor(freedomPoint.month / 12)} anos</span> e <span className="text-emerald-300 font-black">{freedomPoint.month % 12} meses</span>!
                        </p>
                    </div>
                )}

                <div className="h-64 sm:h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis
                                dataKey={viewMode === 'annual' ? "yearLabel" : "month"}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                minTickGap={30}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#34d399' }}
                                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', color: '#fff' }}
                                formatter={(value: number, name: string) => {
                                    return [
                                        `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
                                        name === 'displayPassiveIncome' ? 'Renda Passiva' :
                                            name === 'displayRequiredIncome' ? 'Aposentadoria' :
                                                name === 'displayTotal' ? 'Patrimônio Total' :
                                                    name === 'displayAccumulatedInterest' ? 'Juros Acumulados' : name
                                    ];
                                }}
                                labelFormatter={(label) => viewMode === 'annual' ? `Ano ${label}` : `Mês ${label}`}
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="displayTotal"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                name="Patrimônio Final"
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="invested"
                                stroke="#cbd5e1"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="url(#colorInvested)"
                                name="Valor Investido"
                            />
                            {/* Passive Income Bar */}
                            <Bar
                                yAxisId="right"
                                dataKey="displayPassiveIncome"
                                fill="#34d399"
                                name="Renda Passiva"
                                barSize={20}
                                radius={[4, 4, 0, 0]}
                            />
                            {/* Interest Earned Line (Requested separately) */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="displayAccumulatedInterest"
                                stroke="#f472b6" // Pink
                                strokeWidth={2}
                                dot={false}
                                name="Juros Acumulados"
                            />

                            {/* Freedom Point (Vertical Line + Umbrella) */}
                            {freedomPoint && (
                                <ReferenceLine
                                    yAxisId="right"
                                    segment={[
                                        { x: viewMode === 'annual' ? freedomPoint.yearLabel : freedomPoint.month, y: 0 },
                                        { x: viewMode === 'annual' ? freedomPoint.yearLabel : freedomPoint.month, y: freedomPoint.displayPassiveIncome }
                                    ]}
                                    stroke="#f59e0b" // Amber
                                    strokeDasharray="3 3"
                                    strokeWidth={2}
                                    ifOverflow="extendDomain"
                                    isFront={true}
                                >
                                    <Label
                                        position="top"
                                        content={({ viewBox }) => {
                                            const { x, y } = viewBox as any;
                                            return (
                                                <text x={x} y={y} dy={-10} fontSize={24} textAnchor="middle">
                                                    🏖️
                                                </text>
                                            );
                                        }}
                                    />
                                </ReferenceLine>
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </ChartContainer>

            {/* Detailed Table */}
            <div className="bg-slate-900/50 rounded-[2rem] border border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-black text-white">Detalhamento da Evolução</h3>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-slate-950 text-slate-500 uppercase font-bold text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">{viewMode === 'annual' ? 'Ano' : 'Mês'}</th>
                                <th className="px-6 py-4">Total Investido</th>
                                <th className="px-6 py-4">Juros (Período)</th>
                                <th className="px-6 py-4 text-indigo-400">Patrimônio Total</th>
                                <th className="px-6 py-4 text-rose-400">Perda Inflação</th>
                                <th className="px-6 py-4 text-emerald-400">Renda Passiva</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {displayData.map((row) => {
                                const isFreedomPoint = freedomPoint && (viewMode === 'annual' ? row.year === freedomPoint.year : row.month === freedomPoint.month);
                                return (
                                    <tr key={row.month} className={`transition-colors ${isFreedomPoint ? 'bg-emerald-900/20 border-l-4 border-emerald-500' : 'hover:bg-slate-800/50'}`}>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {viewMode === 'annual' ? row.yearLabel : row.month}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            R$ {row.invested.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            R$ {row.interest.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 font-black text-indigo-400">
                                            R$ {row.displayTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-rose-400">
                                            - R$ {row.inflationLoss.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-400 bg-emerald-500/5">
                                            R$ {row.displayPassiveIncome.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
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
