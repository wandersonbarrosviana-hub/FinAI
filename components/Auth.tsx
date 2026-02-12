
import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onLogin: (email: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        if (data.user?.email) {
          onLogin(data.user.email);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
            },
            emailRedirectTo: window.location.origin
          },
        });

        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu email para confirmar a conta.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="bg-white w-full max-w-md p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-sky-100/20 ring-1 ring-black/5 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

        <div className="text-center mb-12 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-sky-500 to-indigo-600 mx-auto flex items-center justify-center text-white font-black text-4xl mb-6 shadow-xl shadow-sky-200 ring-4 ring-white">F</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{isLogin ? 'Bem-vindo ao FinAI' : 'Crie sua conta'}</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Inteligência artificial para suas finanças.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
            <CheckCircle size={18} className="text-emerald-500" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-4 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={20} />
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 font-bold placeholder:text-slate-300"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={20} />
              <input
                type="email"
                required
                placeholder="exemplo@gmail.com"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 font-bold placeholder:text-slate-300"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 outline-none transition-all text-slate-700 font-bold placeholder:text-slate-300"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-300 hover:text-sky-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <button type="button" className="text-xs font-black text-sky-600 uppercase tracking-widest hover:text-sky-700 transition-all">Esqueceu a senha?</button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-sky-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 mt-4"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (isLogin ? 'Entrar Agora' : 'Criar minha conta')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">Ou entre com</span></div>
        </div>

        <p className="text-center mt-10 text-slate-400 text-xs font-medium relative z-10">
          {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
            className="ml-2 text-sky-600 font-black uppercase tracking-widest hover:text-sky-700 transition-all"
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
