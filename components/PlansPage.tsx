import React, { useState, useEffect } from 'react';
import { ShieldCheck, Star, Check, Zap, Rocket, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface PlansPageProps {
    userPlan: 'free' | 'premium';
    onUpgradeSuccess: () => void;
}

const PlansPage: React.FC<PlansPageProps> = ({ userPlan, onUpgradeSuccess }) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Only load PayPal if user is not premium
        if (userPlan === 'premium') return;

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=sb&currency=BRL`; // Use 'sb' for sandbox as default
        script.async = true;
        script.onload = () => {
            if ((window as any).paypal) {
                renderPayPalButton();
            }
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [userPlan]);

    const renderPayPalButton = () => {
        const container = document.getElementById('paypal-button-container');
        if (!container) return;

        (window as any).paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'pill',
                label: 'checkout'
            },
            createOrder: (data: any, actions: any) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '11.99', // Valor atualizado
                            currency_code: 'BRL'
                        },
                        description: 'Assinatura FinAI Premium - Acesso Ilimitado e Futuras Atualizações'
                    }]
                });
            },
            onApprove: async (data: any, actions: any) => {
                setLoading(true);
                const order = await actions.order.capture();
                console.log('Payment Approved:', order);
                await handleUpgrade();
            },
            onError: (err: any) => {
                console.error('PayPal Error:', err);
                alert('Ocorreu um erro no processamento do pagamento.');
            }
        }).render('#paypal-button-container');
    };

    const handleUpgrade = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({ plan_type: 'premium' })
                .eq('id', user.id);

            if (error) throw error;
            onUpgradeSuccess();
        } catch (error) {
            console.error('Error upgrading plan:', error);
            alert('Erro ao atualizar plano no banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header Section */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-sky-100 mb-4 animate-bounce">
                    <Rocket size={14} className="mr-2" /> Eleve seu controle financeiro
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
                    Escolha o plano ideal <br />
                    <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">para o seu bolso.</span>
                </h1>
                <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    Comece grátis ou desbloqueie o poder máximo da tecnologia para gerenciar seu patrimônio com inteligência.
                </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-8">
                {/* Free Plan */}
                <div className="group bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-slate-200 transition-all duration-500 flex flex-col relative overflow-hidden">
                    <div className="space-y-4 mb-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">Básico</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-900 mt-2">R$ 0</span>
                            <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">/ mensal</span>
                        </div>
                        <p className="text-slate-500 font-medium">Ideal para quem está começando a se organizar hoje.</p>
                    </div>

                    <div className="space-y-5 mb-10 flex-1">
                        {[
                            'Até 2 contas bancárias',
                            'Até 2 cartões de crédito',
                            '3 mensagens diárias com IA',
                            'Dashboard Financeiro',
                            'Gráficos básicos de gastos',
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                <div className="w-5 h-5 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>

                    <button disabled className="w-full py-5 px-8 bg-slate-100 text-slate-400 text-sm font-black rounded-3xl uppercase tracking-widest transition-all">
                        {userPlan === 'free' ? 'Plano Atual' : 'Plano Gratuito'}
                    </button>
                </div>

                {/* Premium Plan - Highlighted */}
                <div className="group relative bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-sky-900/20 border border-slate-800 scale-105 z-10 hover:scale-[1.07] transition-all duration-500 flex flex-col overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] -mr-32 -mt-32"></div>

                    <div className="absolute top-6 right-10">
                        <div className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center gap-2">
                            <Crown size={12} /> Mais Popular
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-sky-500/30">
                            <Rocket size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-white">PRO Premium</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white mt-2">R$ 11,99</span>
                            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">/ mensal</span>
                        </div>
                        <p className="text-slate-400 font-medium font-bold">Acesso ilimitado e atualizações futuras.</p>
                    </div>

                    <div className="space-y-5 mb-10 flex-1 relative">
                        {[
                            'Contas e Cartões ilimitados',
                            'Adição de familiares à conta',
                            'Assistente IA ilimitada (Consultoria)',
                            'Gráficos e Insights Avançados',
                            'Acesso total a futuras atualizações',
                            'Suporte prioritário 24/7'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                                <div className="w-5 h-5 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-400">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {userPlan === 'premium' ? (
                            <button className="w-full py-5 px-8 bg-emerald-500 text-white text-sm font-black rounded-3xl uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
                                <ShieldCheck size={18} /> Plano Premium Ativo
                            </button>
                        ) : (
                            <div id="paypal-button-container" className="relative z-20"></div>
                        )}
                        <p className="text-[10px] text-center text-slate-500 font-black uppercase tracking-widest">Pagamento seguro via PayPal &bull; Cancele a qualquer momento</p>
                    </div>
                </div>
            </div>

            {/* Satisfaction Banner */}
            <div className="bg-slate-50 rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-100">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dúvidas sobre o Premium?</h3>
                    <p className="text-slate-500 font-medium">Fale agora mesmo com nosso suporte comercial e tire suas dúvidas.</p>
                </div>
                <button className="px-10 py-5 bg-white border border-slate-200 text-slate-900 text-sm font-black rounded-3xl uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                    Falar com Consultor
                </button>
            </div>

            {loading && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white space-y-4">
                    <Loader2 className="animate-spin text-sky-400" size={50} />
                    <p className="text-xl font-black tracking-widest uppercase">Processando seu Upgrade...</p>
                </div>
            )}
        </div>
    );
};

export default PlansPage;
