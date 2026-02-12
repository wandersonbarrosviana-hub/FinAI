import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DividendChartItem } from '../types';

interface DividendChartProps {
    data: DividendChartItem[];
}

const DividendChart: React.FC<DividendChartProps> = ({ data }) => {
    const [mode, setMode] = useState<'value' | 'yield'>('value');

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const val = payload[0].value;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="text-slate-300 font-bold mb-1">{label}</p>
                    <p className="text-white text-sm">
                        {mode === 'value'
                            ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`
                        }
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 bg-[#1A1B1E] rounded-xl border border-[#2C2D33]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Histórico de Proventos (10 Anos)</h3>
                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setMode('value')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'value'
                                ? 'bg-[#00D084] text-slate-900 shadow-lg'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Valor (R$)
                    </button>
                    <button
                        onClick={() => setMode('yield')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'yield'
                                ? 'bg-[#00D084] text-slate-900 shadow-lg'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Yield (%)
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="year"
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => mode === 'value' ? `R$${val}` : `${val}%`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                        <Bar dataKey={mode} radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={mode === 'value' ? '#00D084' : '#3B82F6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${mode === 'value' ? 'bg-[#00D084]' : 'bg-[#3B82F6]'}`}></div>
                    <span className="text-xs text-slate-400">
                        {mode === 'value' ? 'Total Pago no Ano' : 'Dividend Yield Médio'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DividendChart;
