
import React, { useState, useRef } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Camera, ChevronLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onLogin: (email: string) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return null;
    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${userId}/${Math.random()}.${fileExt}`;

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
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        if (data.user?.email) {
          onLogin(data.user.email);
        }
      } else if (mode === 'signup') {
        // Sign up first
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name },
            emailRedirectTo: window.location.origin
          },
        });

        if (error) throw error;
        if (!data.user) throw new Error('Erro ao criar usuário');

        // If avatar file exists, upload it and update metadata
        if (avatarFile) {
          const avatarUrl = await uploadAvatar(data.user.id);
          if (avatarUrl) {
            await supabase.auth.updateUser({
              data: { avatar_url: avatarUrl }
            });
          }
        }

        setMessage('Cadastro realizado! Verifique seu email para confirmar a conta.');
        setMode('login');
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}?type=recovery`,
        });
        if (error) throw error;
        setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-sky-100/20 dark:shadow-none ring-1 ring-black/5 dark:ring-white/5 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 dark:bg-sky-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-sky-500 to-indigo-600 mx-auto flex items-center justify-center text-white font-black text-4xl mb-6 shadow-xl shadow-sky-200 dark:shadow-sky-900/50 ring-4 ring-white dark:ring-slate-700">F</div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'login' ? 'Bem-vindo ao FinAI' :
              mode === 'signup' ? 'Crie sua conta' : 'Recuperar Acesso'}
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            {mode === 'forgot-password' ? 'Enviaremos um link para resetar sua senha.' : 'Inteligência artificial para suas finanças.'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
            <CheckCircle size={18} className="text-emerald-500 dark:text-emerald-400" />
            {message}
          </div>
        )}

        {mode === 'forgot-password' && (
          <button
            onClick={() => setMode('login')}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-sky-600 dark:hover:text-sky-400 transition-all mb-6 group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para o Login
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-sky-300 dark:hover:border-sky-500 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
                      <Camera size={24} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Adicionar Foto</span>
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
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wide italic">Foto opcional</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-4 text-slate-300 dark:text-slate-600 group-focus-within:text-sky-500 transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-slate-300 dark:text-slate-600 group-focus-within:text-sky-500 transition-colors" size={20} />
              <input
                type="email"
                required
                placeholder="exemplo@gmail.com"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {mode !== 'forgot-password' && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-slate-300 dark:text-slate-600 group-focus-within:text-sky-500 transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-slate-300 hover:text-sky-600 dark:text-slate-600 dark:hover:text-sky-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest hover:text-sky-700 dark:hover:text-sky-300 transition-all"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-sky-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 mt-4"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> :
              (mode === 'login' ? 'Entrar Agora' :
                mode === 'signup' ? 'Criar minha conta' : 'Enviar Link')}
          </button>
        </form>

        {mode !== 'forgot-password' && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-3 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest">Ou continue com</span></div>
            </div>

            <p className="text-center mt-10 text-slate-400 dark:text-slate-500 text-xs font-medium relative z-10">
              {mode === 'login' ? 'Não tem uma conta?' : 'Já possui uma conta?'}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }}
                className="ml-2 text-sky-600 dark:text-sky-400 font-black uppercase tracking-widest hover:text-sky-700 dark:hover:text-sky-300 transition-all"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
