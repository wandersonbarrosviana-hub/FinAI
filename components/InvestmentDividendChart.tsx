import React, { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

interface DividendData {
    date: string;
    dividends: number;
}

interface InvestmentDividendChartProps {
    dividends: DividendData[];
    currentPrice: number;
}

const InvestmentDividendChart: React.FC<InvestmentDividendChartProps> = ({ dividends, currentPrice }) => {
    const [view, setView] = useState<'annual' | 'monthly'>('annual');

    const chartData = useMemo(() => {
        if (!dividends || dividends.length === 0) return [];

        const groups: Record<string, number> = {};

        dividends.forEach(d => {
            const date = new Date(d.date);
            const key = view === 'annual'
                ? date.getFullYear().toString()
                : `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            groups[key] = (groups[key] || 0) + d.dividends;
        });

        return Object.entries(groups)
            .map(([key, value]) => ({
                label: view === 'annual' ? key : key.split('-').reverse().join('/'),
                value: value,
                yield: ((value / currentPrice) * 100).toFixed(2),
                sortKey: key
            }))
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
            .slice(-72); // Limit to last 72 months if monthly, or all if annual
    }, [dividends, view, currentPrice]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
                    <p className="text-xs font-black text-slate-500 uppercase mb-1">{payload[0].payload.label}</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ {payload[0].value.toFixed(4)}</p>
                    <p className="text-[10px] font-medium text-slate-400">DY: {payload[0].payload.yield}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setView('annual')}
                        className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${view === 'annual'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Anual
                    </button>
                    <button
                        onClick={() => setView('monthly')}
                        className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${view === 'monthly'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Mensal
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                            interval={view === 'monthly' ? 5 : 0}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={view === 'annual' ? 40 : 12}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#10B981" fillOpacity={0.8} />
                            ))}
                            <LabelList
                                dataKey="value"
                                position="top"
                                content={(props: any) => {
                                    const { x, y, width, value } = props;
                                    return (
                                        <text x={x + width / 2} y={y - 10} fill="#64748B" fontSize={9} fontWeight={800} textAnchor="middle">
                                            R$ {Number(value).toFixed(2)}
                                        </text>
                                    );
                                }}
                            />
                            <LabelList
                                dataKey="yield"
                                position="insideBottom"
                                content={(props: any) => {
                                    const { x, y, width, height, value } = props;
                                    if (height < 20) return null;
                                    return (
                                        <text x={x + width / 2} y={y + height - 10} fill="#FFF" fontSize={8} fontWeight={900} textAnchor="middle">
                                            {value}%
                                        </text>
                                    );
                                }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default InvestmentDividendChart;
