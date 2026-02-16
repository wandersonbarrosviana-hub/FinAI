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
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xl ring-1 ring-black/5">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-slate-900 font-black text-lg tracking-tight">
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
        <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Histórico de Proventos</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Últimos 10 Anos</p>
                </div>
                <div className="flex bg-slate-100 rounded-2xl p-1.5 border border-slate-200/50">
                    <button
                        onClick={() => setMode('value')}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'value'
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Valor (R$)
                    </button>
                    <button
                        onClick={() => setMode('yield')}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'yield'
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Yield (%)
                    </button>
                </div>
            </div>

            <div className="w-full overflow-x-auto pb-4">
                <div className="h-[350px] min-w-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="year"
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => mode === 'value' ? `R$${val >= 1000 ? (val / 1000) + 'k' : val}` : `${val}%`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 4 }} />
                            <Bar dataKey={mode} radius={[6, 6, 6, 6]} barSize={32}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={mode === 'value' ? '#10b981' : '#6366f1'} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-8 flex justify-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${mode === 'value' ? 'bg-emerald-500' : 'bg-indigo-500 shadow-sm shadow-indigo-200'}`}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {mode === 'value' ? 'Total Pago (R$)' : 'Dividend Yield (%)'}
                        </span>
                    </div>
                </div>
            </div>
            );
};

            export default DividendChart;
