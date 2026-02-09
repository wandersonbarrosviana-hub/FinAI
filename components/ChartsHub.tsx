import React from 'react';
import { BarChart2 } from 'lucide-react';

const ChartsHub: React.FC = () => {
    return (
        <div className="p-4 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart2 size={32} className="text-sky-600" />
                <h2 className="text-2xl font-bold text-slate-800">Central de Gráficos</h2>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-400">
                <p>Área de Gráficos consolidados em desenvolvimento.</p>
            </div>
        </div>
    );
};

export default ChartsHub;
