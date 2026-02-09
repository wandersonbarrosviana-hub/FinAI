import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Bar, ReferenceDot, Label } from 'recharts';
import { Calculator, Table, Calendar, TrendingUp, DollarSign, Info, Umbrella } from 'lucide-react';

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
    const [yearsToSimulate, setYearsToSimulate] = useState(30);

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
        const months = yearsToSimulate * 12;

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
    }, [desiredIncome, currentPatrimony, monthlyContribution, annualRate, annualInflation, yearsToSimulate]);

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

                if (lastMonthOfYear) {
                    annualData.push({
                        ...lastMonthOfYear,
                        // Override monthly values with annual sums for the "flow" metrics
                        interest: yearInterest,
                        realPassiveIncome: yearRealInterest,
                        passiveIncome: yearInterest, // Nominal Annual Sum
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
        }));

    }, [simulationData, viewMode, showRealValues]);

    // Find Freedom Point (First time Passive Income > Required)
    const freedomPoint = useMemo(() => {
        return displayData.find(d => d.displayPassiveIncome >= d.displayRequiredIncome);
    }, [displayData]);

    // Generate Goal Trajectory (Visual Parabola)
    // "Line starts at 0, parabola up, then falls showing where it hits the target"
    const goalTrajectoryData = useMemo(() => {
        if (!freedomPoint) return displayData;

        const freedomIndex = displayData.indexOf(freedomPoint);
        if (freedomIndex <= 0) return displayData;

        const startX = 0;
        const startY = 0;
        const endX = freedomIndex;
        const endY = freedomPoint.displayRequiredIncome;

        // Parabola passing through (0,0) and (endX, endY)
        // With a "jump" effect: Vertex height > endY.
        // Let's set vertex X at 50% of the way, and vertex Y at 1.5x the target.
        const midX = endX / 2;
        const midY = endY * 1.5;

        // Solve y = ax^2 + bx (since c=0)
        // Eq 1: midY = a(midX^2) + b(midX)
        // Eq 2: endY = a(endX^2) + b(endX)

        // From Eq 2: b = (endY - a*endX^2) / endX = endY/endX - a*endX
        // Subst into Eq 1:
        // midY = a*midX^2 + (endY/endX - a*endX)*midX
        // midY = a*midX^2 + midX*endY/endX - a*endX*midX
        // midY - midX*endY/endX = a (midX^2 - endX*midX)
        // a = (midY - midX*endY/endX) / (midX^2 - endX*midX)

        const term1 = midY - (midX * endY / endX);
        const term2 = (midX * midX) - (endX * midX);

        // Safety check for divide by zero
        if (Math.abs(term2) < 0.0001) return displayData;

        const a = term1 / term2;
        const b = (endY / endX) - (a * endX);

        return displayData.map((d, i) => {
            let trajectoryValue = null;
            if (i <= freedomIndex) {
                trajectoryValue = a * i * i + b * i;
                // Ensure it doesn't go below 0 visually
                if (trajectoryValue < 0) trajectoryValue = 0;
            }

            return {
                ...d,
                goalTrajectory: trajectoryValue
            };
        });

    }, [displayData, freedomPoint]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-sky-600" size={32} />
                    Simulador de Aposentadoria
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Planeje sua liberdade financeira com base em juros compostos.</p>
            </div>

            {/* Inputs Grid */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Renda Mensal Desejada</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                            <input
                                type="number"
                                value={desiredIncome}
                                onChange={(e) => setDesiredIncome(Number(e.target.value))}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
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
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
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
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
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
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
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
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anos de Simulação</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={yearsToSimulate}
                                onChange={(e) => setYearsToSimulate(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-black text-slate-800">Projeção Patrimonial</h3>

                    <div className="flex items-center gap-4">
                        {/* Legend */}
                        <div className="flex gap-2 hidden sm:flex">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Total
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Renda
                            </div>
                        </div>

                        {/* Inflation Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setShowRealValues(false)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showRealValues ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Nominal
                            </button>
                            <button
                                onClick={() => setShowRealValues(true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showRealValues ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Real (IPCA)
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'monthly' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Mensal
                            </button>
                            <button
                                onClick={() => setViewMode('annual')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'annual' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Anual
                            </button>
                        </div>
                    </div>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={goalTrajectoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'goalTrajectory') return [null, null]; // Hide trajectory from tooltip values
                                    return [
                                        `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
                                        name === 'displayPassiveIncome' ? 'Renda Passiva' :
                                            name === 'displayRequiredIncome' ? 'Meta de Renda' :
                                                name === 'displayTotal' ? 'Patrimônio Total' : name
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

                            {/* Required Income Line (Parabola/Line) */}
                            {/* Required Income Trajectory (Parabola) */}
                            <Line
                                yAxisId="right"
                                type="natural"
                                dataKey="goalTrajectory"
                                stroke="#f59e0b" // Amber
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Meta de Renda"
                                isAnimationActive={true}
                                connectNulls={true}
                            />

                            {/* Freedom Point (Umbrella) */}
                            {freedomPoint && (
                                <ReferenceDot
                                    yAxisId="right"
                                    x={viewMode === 'annual' ? freedomPoint.yearLabel : freedomPoint.month}
                                    y={freedomPoint.displayRequiredIncome}
                                    r={20}
                                    fill="transparent"
                                    stroke="none"
                                >
                                    <Label
                                        content={({ x, y }) => (
                                            <text x={x} y={y} dy={-10} dx={-10} fontSize={24} textAnchor="middle">
                                                🏖️
                                            </text>
                                        )}
                                    />
                                </ReferenceDot>
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800">Detalhamento da Evolução</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">{viewMode === 'annual' ? 'Ano' : 'Mês'}</th>
                                <th className="px-6 py-4">Total Investido</th>
                                <th className="px-6 py-4">Juros (Período)</th>
                                <th className="px-6 py-4 text-indigo-600">Patrimônio Total</th>
                                <th className="px-6 py-4 text-rose-500">Perda Inflação</th>
                                <th className="px-6 py-4 text-emerald-600">Renda Passiva</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {displayData.map((row) => (
                                <tr key={row.month} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        {viewMode === 'annual' ? row.yearLabel : row.month}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        R$ {row.invested.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        R$ {row.interest.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-4 font-black text-indigo-600">
                                        R$ {row.displayTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-rose-500">
                                        - R$ {row.inflationLoss.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-600 bg-emerald-50/30">
                                        R$ {row.displayPassiveIncome.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RetirementSimulator;
