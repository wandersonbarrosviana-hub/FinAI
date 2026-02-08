import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { Calculator, Table, Calendar, TrendingUp, DollarSign, Info } from 'lucide-react';

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
                    contributionNeeded: monthlyContribution
                });
                continue;
            }

            const interestEarned = currentBalance * monthlyRate;
            // Inflation erosion calculation: How much 'value' is lost compared to start?
            // Actually, usually we track "Nominal" vs "Real".
            // Let's track Nominal Balance.

            currentBalance += interestEarned + monthlyContribution;
            totalInvested += monthlyContribution;

            cumulativeInflationFactor *= (1 + monthlyInflation);
            currentTarget = baseTarget * cumulativeInflationFactor; // Target grows to maintain purchasing power

            // "Preço corroído pela inflação" usually means "What is this nominal amount worth in today's money?"
            const realValue = currentBalance / cumulativeInflationFactor;
            const inflationLoss = currentBalance - realValue;

            // "Aporte corrigido" - Extra contribution needed? 
            // Usually means indexing contribution by inflation.
            // Let's assume the user increases contribution by inflation annually?
            // For now, let's keep contribution fixed nominal in input, but show what it *should* be?
            // The prompt says "quando precisa aportar a mais no proximo mes para compensar a inflacao".
            // Meaning: Inflation Adjustment for Contribution.
            const adjustedContribution = monthlyContribution * cumulativeInflationFactor;

            data.push({
                month: i,
                year: Math.floor(i / 12),
                yearLabel: new Date().getFullYear() + Math.floor(i / 12),
                invested: totalInvested,
                interest: interestEarned, // This month's interest
                total: currentBalance,
                inflationLoss: inflationLoss,
                target: currentTarget,
                contributionNeeded: adjustedContribution
            });
        }
        return data;
    }, [desiredIncome, currentPatrimony, monthlyContribution, annualRate, annualInflation, yearsToSimulate]);

    // Aggregate for Table/Chart if Annual
    const displayData = useMemo(() => {
        if (viewMode === 'monthly') return simulationData;

        // Group by Year (take the last month of each year)
        // Except for Year 0
        const annualData = [];
        // Map of years
        const years = new Set(simulationData.map(d => d.year));

        years.forEach(y => {
            const lastMonthOfYear = simulationData.filter(d => d.year === y).pop();
            if (lastMonthOfYear) {
                // Approximate interest sum for the year?
                // The logical "Total" is the end of year balance.
                // "Invested" is end of year invested.
                annualData.push(lastMonthOfYear);
            }
        });
        return annualData;
    }, [simulationData, viewMode]);

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
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800">Projeção Patrimonial</h3>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Total Acumulado
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className="w-3 h-3 rounded-full bg-slate-300"></span> Investido
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Meta Necessária
                        </div>
                    </div>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, '']}
                                labelFormatter={(label) => viewMode === 'annual' ? `Ano ${label}` : `Mês ${label}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                name="Patrimônio Final"
                            />
                            <Area
                                type="monotone"
                                dataKey="invested"
                                stroke="#cbd5e1"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="url(#colorInvested)"
                                name="Valor Investido"
                            />
                            {/* Target Curve */}
                            <Line
                                type="monotone"
                                dataKey="target"
                                stroke="#34d399"
                                strokeWidth={2}
                                dot={false}
                                name="Meta Necessária"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800">Detalhamento da Evolução</h3>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'monthly' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setViewMode('annual')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'annual' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Anual
                        </button>
                    </div>
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
                                <th className="px-6 py-4 text-emerald-600">Aporte Necessário</th>
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
                                        R$ {row.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-rose-500">
                                        - R$ {row.inflationLoss.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-emerald-600 bg-emerald-50/30">
                                        R$ {row.contributionNeeded.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
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
