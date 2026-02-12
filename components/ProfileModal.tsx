import React, { useState, useRef } from 'react';
import { X, User, Mail, Save, Loader2, Camera } from 'lucide-react';
import { User as UserType } from '../types';
import { supabase } from '../supabaseClient';

interface ProfileModalProps {
    user: UserType;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (newName: string, newAvatarUrl?: string) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
            await onUpdate(name, avatarUrl || undefined);
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Avatar Upload Selection */}
                    <div className="flex flex-col items-center mb-2">
                        <div
                            className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-100 flex items-center justify-center relative group cursor-pointer hover:border-sky-200 transition-all overflow-hidden"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-slate-300 flex flex-col items-center gap-1">
                                    <Camera size={28} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Alterar Foto</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-600 transition-colors" size={18} />
                            <input
                                type="text"
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/30 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                        <div className="relative opacity-60 cursor-not-allowed">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="email"
                                readOnly
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none cursor-not-allowed font-medium text-slate-500"
                                value={user.email}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 border border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (name === user.name && !avatarFile)}
                            className="flex-1 py-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-sky-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span className="hidden sm:inline">Salvar Alterações</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
