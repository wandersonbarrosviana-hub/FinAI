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

    // Fetch data when family tab is active
    React.useEffect(() => {
        if (activeTab === 'family') {
            fetchFamilyData();
        }
    }, [activeTab]);

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

            // Fetch Members
            const { data: membersData, error: membersError } = await supabase
                .from('family_members')
                .select('*')
                .eq('master_user_id', user.id);

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

            alert(`Convite enviado para ${inviteEmail}`);
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

    const handleSubmit = async (e: React.FormEvent) => {
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
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300"
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

                <div className="flex flex-col md:flex-row h-[500px]">
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
                                    <input
                                        type="email"
                                        placeholder="Email do familiar"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700"
                                    />
                                    <button
                                        onClick={handleSendInvite}
                                        disabled={loading}
                                        className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-sky-200 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Convidar'}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {/* Invites List */}
                                    {invites.map((invite) => (
                                        <div key={invite.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                                    <Mail size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{invite.email}</p>
                                                    <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Convite Pendente</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteInvite(invite.id)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                                title="Cancelar convite"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Family Members List */}
                                    {familyMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">Membro da Família</p>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{member.role === 'editor' ? 'Editor' : 'Visualizador'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                                title="Remover membro"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}

                                    {invites.length === 0 && familyMembers.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            Nenhum membro ou convite ainda.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                                <Shield size={48} className="text-slate-300" />
                                <div>
                                    <p className="font-bold text-slate-800">Em Breve</p>
                                    <p className="text-sm text-slate-500">Alteração de senha e 2FA.</p>
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
