
import React, { useState } from 'react';
import {
    Settings as SettingsIcon,
    Moon,
    Sun,
    Bell,
    Shield,
    Database,
    Download,
    Trash2,
    LogOut,
    ChevronRight,
    Globe,
    CreditCard,
    HelpCircle,
    Info,
    Smartphone
} from 'lucide-react';
import { Account, Transaction, Budget, Goal } from '../types';

import ResetDataModal from './ResetDataModal';

interface SettingsProps {
    user: { name: string; email: string; avatarUrl?: string };
    onLogout: () => void;
    onExportData: () => void;
    onResetData: (options: {
        keepCategories: boolean;
        keepCreditCards: boolean;
        keepAccounts: boolean;
        keepGoals: boolean;
    }) => Promise<void>;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout, onExportData, onResetData, theme, onToggleTheme }) => {
    // Theme state is now managed by parent (App.tsx)
    const [notifications, setNotifications] = useState(true);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Configurações</h2>
                <p className="text-slate-500 text-sm font-medium">Personalize sua experiência no FinAI.</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-black text-2xl shadow-inner">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        user.name.charAt(0).toUpperCase()
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900">{user.name}</h3>
                    <p className="text-slate-400 font-medium">{user.email}</p>
                    <button className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 uppercase tracking-widest">
                        Editar Perfil
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <SettingsIcon size={20} className="text-sky-600" />
                        Geral
                    </h3>

                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        {/* Appearance */}
                        <div className="p-5 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Tema do App</p>
                                    <p className="text-xs text-slate-400 font-medium">Alternar entre Claro e Escuro</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={theme === 'dark'} onChange={onToggleTheme} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                            </label>
                        </div>

                        {/* Notifications */}
                        <div className="p-5 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Notificações</p>
                                    <p className="text-xs text-slate-400 font-medium">Alertas de contas e metas</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                            </label>
                        </div>

                        {/* Currency (Fixed) */}
                        <div className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Moeda Principal</p>
                                    <p className="text-xs text-slate-400 font-medium">Real Brasileiro (BRL)</p>
                                </div>
                            </div>
                            <span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md">FIXO</span>
                        </div>
                    </div>
                </div>

                {/* Data & Security */}
                <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Database size={20} className="text-sky-600" />
                        Dados e Segurança
                    </h3>

                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        {/* Export Data */}
                        <button onClick={onExportData} className="w-full p-5 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <Download size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">Exportar Dados</p>
                                    <p className="text-xs text-slate-400 font-medium">Baixar backup em JSON</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </button>

                        {/* Privacy Policy (Mock) */}
                        <button className="w-full p-5 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                                    <Shield size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">Privacidade</p>
                                    <p className="text-xs text-slate-400 font-medium">Política de dados</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                        </button>

                        {/* Reset Data (Danger) */}
                        <button onClick={() => setIsResetModalOpen(true)} className="w-full p-5 flex items-center justify-between hover:bg-rose-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
                                    <Trash2 size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-rose-600">Resetar Informações</p>
                                    <p className="text-xs text-rose-400 font-medium">Apagar finanças, manter perfil</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-rose-300 group-hover:text-rose-500 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>

            {/* About & Info */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-sky-500/20 rounded-xl backdrop-blur-sm">
                                <Info size={24} className="text-sky-400" />
                            </div>
                            <h4 className="text-2xl font-black">FinAI Mobile</h4>
                        </div>
                        <p className="text-slate-400 font-medium max-w-sm">
                            Versão 1.2.0 (Beta)<br />
                            Desenvolvido com IA e React.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors">
                            Suporte
                        </button>
                        <button className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold transition-colors">
                            Avaliar App
                        </button>
                    </div>
                </div>
                {/* Decorative */}
                <Smartphone className="absolute -bottom-12 -right-12 w-64 h-64 text-slate-800 opacity-50 rotate-12 pointer-events-none" />
            </div>

            {/* Logout Button */}
            <div className="flex justify-center pt-8">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-rose-50 text-rose-600 font-black hover:bg-rose-100 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <LogOut size={20} />
                    SAIR DA CONTA
                </button>
            </div>

            <ResetDataModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={onResetData}
            />
        </div>
    );
};

export default Settings;
