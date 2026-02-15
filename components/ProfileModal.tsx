import React, { useState, useRef } from 'react';
import { X, User, Mail, Camera, Save, Loader2, Users, Lock, Trash2, Shield } from 'lucide-react';
import { User as UserType } from '../types';
import { supabase } from '../supabaseClient';

interface ProfileModalProps {
    user: UserType;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (newName: string, newAvatarUrl?: string) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: user.name || '', avatarUrl: user.avatarUrl }); // Removed avatarPreview/file hooks here, will re-add if needed or integrate logic
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'family'>('profile');
    const [inviteEmail, setInviteEmail] = useState('');
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [foundUser, setFoundUser] = useState<{ name: string, avatar_url: string } | null>(null);
    const [isCheckingUser, setIsCheckingUser] = useState(false);

    // Security State
    const [securityData, setSecurityData] = useState({
        newPassword: '',
        confirmPassword: '',
        newEmail: ''
    });
    const [securityLoading, setSecurityLoading] = useState(false);

    // Fetch data when family tab is active
    React.useEffect(() => {
        if (activeTab === 'family') {
            fetchFamilyData();
        }
    }, [activeTab]);

    const checkUser = async () => {
        if (!inviteEmail || !inviteEmail.includes('@')) return;
        setIsCheckingUser(true);
        setFoundUser(null);
        try {
            const { data, error } = await supabase.rpc('get_user_by_email', {
                email_input: inviteEmail
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setFoundUser(data[0]);
            } else {
                alert('Usuário não encontrado. Verifique o e-mail.');
                setFoundUser(null);
            }
        } catch (error) {
            console.error('Error checking user:', error);
            alert('Erro ao buscar usuário.');
        } finally {
            setIsCheckingUser(false);
        }
    };

    const fetchFamilyData = async () => {
        setLoading(true);
        try {
            // Fetch Invites
            const { data: invitesData, error: invitesError } = await supabase
                .from('invites')
                .select('*')
                .eq('inviter_id', user.id);

            if (invitesError) throw invitesError;
            setInvites(invitesData || []);

            // Fetch Members using RPC
            const { data: membersData, error: membersError } = await supabase
                .rpc('get_family_details', { current_user_id: user.id });

            if (membersError) throw membersError;
            setFamilyMembers(membersData || []);

        } catch (error) {
            console.error('Error fetching family data:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleSendInvite = async () => {
        if (!inviteEmail) return;
        if (!foundUser) {
            alert('Por favor, valide o e-mail do usuário antes de convidar.');
            return;
        }
        setLoading(true);
        try {
            // Check limit
            if (invites.length + familyMembers.length >= 2) {
                alert('Limite de 2 membros atingido (convites + membros).');
                return;
            }

            const { error } = await supabase.from('invites').insert({
                inviter_id: user.id,
                email: inviteEmail,
                role: 'editor' // Defaulting to editor for now, could be selectable
            });

            if (error) throw error;

            alert(`Convite registrado para ${inviteEmail}. Peça para ele(a) fazer login no aplicativo para aceitar.`);
            setInviteEmail('');
            fetchFamilyData(); // Refresh list
        } catch (error) {
            console.error('Error sending invite:', error);
            alert('Erro ao enviar convite.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInvite = async (id: string) => {
        if (!confirm('Cancelar este convite?')) return;
        try {
            const { error } = await supabase.from('invites').delete().eq('id', id);
            if (error) throw error;
            fetchFamilyData();
        } catch (error) {
            console.error('Error deleting invite:', error);
        }
    };

    const handleRemoveMember = async (id: string) => {
        if (!confirm('Remover este membro da família?')) return;
        try {
            const { error } = await supabase.from('family_members').delete().eq('id', id);
            if (error) throw error;
            fetchFamilyData();
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const handleUpdatePassword = async () => {
        if (!securityData.newPassword || !securityData.confirmPassword) {
            alert('Preencha os campos de senha.');
            return;
        }
        if (securityData.newPassword !== securityData.confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }
        if (securityData.newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setSecurityLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: securityData.newPassword });
            if (error) throw error;
            alert('Senha atualizada com sucesso!');
            setSecurityData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (error: any) {
            console.error('Error updating password:', error);
            alert('Erro ao atualizar senha: ' + (error.message || error));
        } finally {
            setSecurityLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!securityData.newEmail || !securityData.newEmail.includes('@')) {
            alert('Email inválido.');
            return;
        }
        setSecurityLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: securityData.newEmail });
            if (error) throw error;
            alert('Verifique seu NOVO email (e o antigo) para confirmar a alteração.');
            setSecurityData(prev => ({ ...prev, newEmail: '' }));
        } catch (error: any) {
            console.error('Error updating email:', error);
            alert('Erro ao atualizar email: ' + (error.message || error));
        } finally {
            setSecurityLoading(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB');
                return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const uploadAvatar = async () => {
        if (!avatarFile) return user.avatarUrl;

        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const avatarUrl = await uploadAvatar();
            await onUpdate(formData.name, avatarUrl || undefined);
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-sm border border-sky-100">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Meu Perfil</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configurações de conta</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-[800px]">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 bg-slate-50 p-6 flex flex-col gap-2 border-r border-slate-100">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-left ${activeTab === 'profile'
                                ? 'bg-white text-sky-600 shadow-md ring-1 ring-slate-100'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                }`}
                        >
                            <User size={20} />
                            Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('family')}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-left ${activeTab === 'family'
                                ? 'bg-white text-sky-600 shadow-md ring-1 ring-slate-100'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                }`}
                        >
                            <Users size={20} />
                            Família
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-left ${activeTab === 'security'
                                ? 'bg-white text-sky-600 shadow-md ring-1 ring-slate-100'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                }`}
                        >
                            <Lock size={20} />
                            Segurança
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <div
                                        className="w-24 h-24 bg-sky-100 rounded-full mx-auto flex items-center justify-center text-sky-600 font-black text-3xl mb-4 relative group cursor-pointer overflow-hidden border-4 border-white shadow-lg"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {formData.avatarUrl ? (
                                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            (user.name || 'U').charAt(0).toUpperCase()
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white" size={24} />
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Alterar Foto</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                            <input
                                                type="email"
                                                value={user.email}
                                                disabled
                                                className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'family' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 mb-1">Membros da Família</h3>
                                    <p className="text-slate-500 text-sm">Adicione até 2 pessoas para gerenciar as finanças juntos.</p>
                                </div>

                                <div className="flex gap-2">
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                placeholder="Email do familiar"
                                                value={inviteEmail}
                                                onChange={e => {
                                                    setInviteEmail(e.target.value);
                                                    setFoundUser(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        checkUser();
                                                    }
                                                }}
                                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700"
                                            />
                                            <button
                                                onClick={checkUser}
                                                disabled={isCheckingUser || !inviteEmail}
                                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                {isCheckingUser ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                                            </button>
                                        </div>

                                        {foundUser && (
                                            <div className="flex items-center gap-3 p-3 bg-sky-50 border border-sky-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                                                <div className="w-12 h-12 rounded-full bg-sky-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {foundUser.avatar_url ? (
                                                        <img src={foundUser.avatar_url} alt={foundUser.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-sky-700">{(foundUser.name || 'U').charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 text-sm truncate">{foundUser.name || 'Usuário sem nome'}</p>
                                                    <p className="text-[10px] text-sky-600 font-medium truncate">Usuário encontrado</p>
                                                </div>
                                                <button
                                                    onClick={handleSendInvite}
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                                                >
                                                    {loading ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar Convite'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => {
                                                const text = `Olá! Te convidei para gerenciar as finanças comigo no FinAI. Acesse ${window.location.origin} e faça login com seu email para aceitar o convite.`;
                                                navigator.clipboard.writeText(text);
                                                alert("Texto do convite copiado!");
                                            }}
                                            className="text-xs text-sky-600 font-bold hover:underline"
                                        >
                                            Copiar mensagem de convite
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Invites List */}
                                        {invites.map((invite) => (
                                            <div key={invite.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0">
                                                        <Mail size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 truncate" title={invite.email}>{invite.email}</p>
                                                        <p className="text-xs text-amber-500 font-bold uppercase tracking-wider truncate">Convite Pendente</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteInvite(invite.id)}
                                                    className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0"
                                                    title="Cancelar convite"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Family Members List */}
                                        {familyMembers.map((member) => (
                                            <div key={member.member_id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                                                        {member.avatar_url ? (
                                                            <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 truncate" title={member.name}>
                                                            {member.name} {member.is_master && '(Organizador)'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate" title={member.email}>
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!member.is_master && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.member_id)}
                                                        className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0"
                                                        title="Remover membro"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {invites.length === 0 && familyMembers.length === 0 && (
                                            <div className="text-center py-8 text-slate-400 text-sm">
                                                Nenhum membro ou convite ainda.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 mb-1">Segurança da Conta</h3>
                                    <p className="text-slate-500 text-sm">Gerencie suas credenciais de acesso.</p>
                                </div>

                                {/* Change Password Section */}
                                <div className="space-y-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Lock size={18} className="text-sky-500" />
                                        Alterar Senha
                                    </h4>
                                    <div className="grid gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nova Senha</label>
                                            <input
                                                type="password"
                                                value={securityData.newPassword}
                                                onChange={e => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-700"
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirmar Senha</label>
                                            <input
                                                type="password"
                                                value={securityData.confirmPassword}
                                                onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-700"
                                                placeholder="Repita a nova senha"
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdatePassword}
                                            disabled={securityLoading || !securityData.newPassword}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {securityLoading ? <Loader2 size={18} className="animate-spin" /> : 'Atualizar Senha'}
                                        </button>
                                    </div>
                                </div>

                                {/* Change Email Section */}
                                <div className="space-y-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Mail size={18} className="text-sky-500" />
                                        Alterar Email
                                    </h4>
                                    <div className="grid gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Novo Email</label>
                                            <input
                                                type="email"
                                                value={securityData.newEmail}
                                                onChange={e => setSecurityData({ ...securityData, newEmail: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-700"
                                                placeholder="seu.novo@email.com"
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdateEmail}
                                            disabled={securityLoading || !securityData.newEmail}
                                            className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 hover:border-sky-500 hover:text-sky-600 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {securityLoading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar Confirmação'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Logic (Save button mainly for profile) */}
                {activeTab === 'profile' && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || (formData.name === user.name && !avatarFile)}
                            className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-200 disabled:opacity-70 flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Salvar Alterações
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


export default ProfileModal;
