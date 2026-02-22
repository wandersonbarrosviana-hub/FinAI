import React from 'react';
import { TrendingUp, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const Investments: React.FC = () => {
    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            {/* Icon Container with Glassmorphism */}
            <div className="relative">
                <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-sky-500/20 ring-1 ring-white/20 dark:ring-slate-800 relative z-10 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <TrendingUp size={48} className="text-sky-500 dark:text-sky-400 group-hover:scale-110 transition-transform duration-500" />
                </div>
                {/* Floating Elements */}
                <Sparkles className="absolute -top-4 -right-4 text-amber-400 animate-bounce delay-150" size={24} />
                <Zap className="absolute -bottom-2 -left-6 text-sky-400 animate-pulse" size={20} />
            </div>

            {/* Content */}
            <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 mb-4">
                    <ShieldCheck size={14} className="text-sky-500" />
                    <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em]">Funcionalidade em Desenvolvimento</span>
                </div>

                <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                    Investimentos <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">Inteligentes</span>
                </h2>

                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Estamos preparando uma experiência revolucionária para você gerenciar seu patrimônio com dados em tempo real, indicadores fundamentalistas e insights de IA.
                </p>
            </div>

            {/* Stats Preview (Aesthetic Mocks) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-lg mt-8">
                {[
                    { label: 'Ações B3', value: '450+', icon: '📈' },
                    { label: 'FIIs', value: '100+', icon: '🏙️' },
                    { label: 'IA Insights', value: 'Realtime', icon: '🧠' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-4 rounded-3xl border border-white/20 dark:border-slate-800 shadow-sm">
                        <span className="block text-xl mb-1">{item.icon}</span>
                        <span className="block text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Notification Subscription or Call to Action */}
            <div className="pt-8">
                <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center gap-4 pl-6 pr-1 shadow-inner ring-1 ring-black/5 dark:ring-white/5">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Quer ser avisado quando lançarmos?</span>
                    <button className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-sky-500/20 active:scale-95">
                        Me avise!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Investments;
