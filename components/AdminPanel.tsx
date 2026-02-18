import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Shield, Users, Calendar, Clock, Star, Search, Loader2, ChevronRight, Check, X } from 'lucide-react';

interface AdminUserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    plan_type: 'free' | 'premium';
    role: 'user' | 'admin';
    created_at: string;
}

const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<AdminUserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_users');
            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Erro ao carregar usuários. Certifique-se de que você tem permissão de administrador.');
        } finally {
            setLoading(false);
        }
    };

    const togglePlan = async (userId: string, currentPlan: string) => {
        setUpdatingUserId(userId);
        const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ plan_type: newPlan })
                .eq('id', userId);

            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, plan_type: newPlan as any } : u));
        } catch (error) {
            console.error('Error updating plan:', error);
            alert('Erro ao atualizar plano.');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const calculateUsageTime = (createdAt: string) => {
        const start = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;

        const months = Math.floor(diffDays / 30);
        if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return `${years} ${years === 1 ? 'ano' : 'anos'}${remainingMonths > 0 ? ` e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}` : ''}`;
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-sky-600" size={40} />
                <p className="text-slate-500 font-bold animate-pulse">Carregando painel administrativo...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Usuários</p>
                        <h3 className="text-3xl font-black text-slate-900">{users.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Star size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usuários Premium</p>
                        <h3 className="text-3xl font-black text-slate-900">
                            {users.filter(u => u.plan_type === 'premium').length}
                        </h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Shield size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administradores</p>
                        <h3 className="text-3xl font-black text-slate-900">
                            {users.filter(u => u.role === 'admin').length}
                        </h3>
                    </div>
                </div>
            </div>

            {/* List Control */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Gerenciamento de Usuários</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Controle de acesso e assinatura</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-700 w-full md:w-80"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Cadastro</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Tempo de Uso</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Tipo de Conta</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center overflow-hidden">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-black text-sky-600">{(u.full_name || u.email).charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 leading-tight">
                                                    {u.full_name || 'Usuário Sem Nome'}
                                                    {u.role === 'admin' && (
                                                        <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">Admin</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <Calendar size={16} className="text-slate-300 mb-1" />
                                            <span className="text-sm font-bold text-slate-600">
                                                {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <Clock size={16} className="text-slate-300 mb-1" />
                                            <span className="text-sm font-bold text-slate-600">
                                                {calculateUsageTime(u.created_at)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${u.plan_type === 'premium'
                                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                            {u.plan_type === 'premium' ? (
                                                <><Star size={12} className="mr-1 shadow-sm" /> Premium</>
                                            ) : (
                                                'Gratuita'
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => togglePlan(u.id, u.plan_type)}
                                            disabled={updatingUserId === u.id || u.role === 'admin'}
                                            className={`p-3 rounded-2xl transition-all shadow-sm ${u.plan_type === 'premium'
                                                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                                                } disabled:opacity-50`}
                                            title={u.plan_type === 'premium' ? 'Remover Premium' : 'Tornar Premium'}
                                        >
                                            {updatingUserId === u.id ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : u.plan_type === 'premium' ? (
                                                <X size={20} />
                                            ) : (
                                                <Check size={20} />
                                            )}
                                        </button>
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

export default AdminPanel;
