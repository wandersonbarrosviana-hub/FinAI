import React, { useState, useEffect } from 'react';
import { ShieldCheck, Star, Check, Zap, Rocket, Shield, Crown, ArrowRight, Loader2, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface PlansPageProps {
    userPlan: 'free' | 'pro' | 'premium';
    onUpgradeSuccess: () => void;
}

type BillingCycle = 'monthly' | 'annual';

const PlansPage: React.FC<PlansPageProps> = ({ userPlan, onUpgradeSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [selectedPlanId, setSelectedPlanId] = useState<'pro' | 'premium' | null>(null);

    const plans = {
        pro: {
            id: 'pro' as const,
            name: 'Plano PRO',
            monthlyPrice: '8,99',
            annualPrice: '90,99',
            monthlyPriceInAnnual: '7,58',
            description: 'Para quem busca controle total individual.',
            features: [
                'Contas e Cartões ilimitados',
                'Assistente IA ilimitada',
                'Gráficos e Insights Avançados',
                'Dashboards Customizáveis',
                'Acesso total a atualizações',
                'Suporte prioritário 24/7'
            ],
            color: 'blue'
        },
        premium: {
            id: 'premium' as const,
            name: 'PRO Premium',
            monthlyPrice: '13,99',
            annualPrice: '143,99',
            monthlyPriceInAnnual: '12,00',
            description: 'Gestão compartilhada com herança para sua família.',
            features: [
                'Tudo do Plano PRO',
                'Herança Familiar (Até 5 membros)',
                'Controle de Gastos da Família',
                'Membros herdam benefícios Premium',
                'Sincronização em tempo real',
                'Suporte VIP Dedicado'
            ],
            color: 'indigo'
        }
    };

    useEffect(() => {
        // Only load PayPal if user is not yet the max plan or needs upgrade
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=sb&currency=BRL`;
        script.async = true;
        script.onload = () => {
            // PayPal will be rendered only when a plan is selected or container is ready
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (selectedPlanId) {
            renderPayPalButton(selectedPlanId);
        }
    }, [selectedPlanId, billingCycle]);

    const renderPayPalButton = (planId: 'pro' | 'premium') => {
        const containerId = `paypal-button-${planId}`;
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear existing button if any
        container.innerHTML = '';

        const plan = plans[planId];
        const amount = billingCycle === 'monthly' ? plan.monthlyPrice.replace(',', '.') : plan.annualPrice.replace(',', '.');

        (window as any).paypal.Buttons({
            style: {
                layout: 'vertical',
                color: planId === 'premium' ? 'gold' : 'blue',
                shape: 'pill',
                label: 'checkout'
            },
            createOrder: (data: any, actions: any) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: amount,
                            currency_code: 'BRL'
                        },
                        description: `Assinatura FinAI ${plan.name} - ${billingCycle === 'monthly' ? 'Mensal' : 'Anual'}`
                    }]
                });
            },
            onApprove: async (data: any, actions: any) => {
                setLoading(true);
                const order = await actions.order.capture();
                console.log('Payment Approved:', order);
                await handleUpgrade(planId);
            },
            onError: (err: any) => {
                console.error('PayPal Error:', err);
                alert('Ocorreu um erro no processamento do pagamento.');
            }
        }).render(`#${containerId}`);
    };

    const handleUpgrade = async (planId: 'pro' | 'premium') => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({ plan_type: planId })
                .eq('id', user.id);

            if (error) throw error;
            onUpgradeSuccess();
        } catch (error) {
            console.error('Error upgrading plan:', error);
            alert('Erro ao atualizar plano no banco de dados.');
        } finally {
            setLoading(false);
            setSelectedPlanId(null);
        }
    };

    const getSavingsPercent = (planId: 'pro' | 'premium') => {
        const plan = plans[planId];
        const monthlyTotal = parseFloat(plan.monthlyPrice.replace(',', '.')) * 12;
        const annualTotal = parseFloat(plan.annualPrice.replace(',', '.'));
        const savings = ((monthlyTotal - annualTotal) / monthlyTotal) * 100;
        return Math.floor(savings);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header Section */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-sky-100 mb-2">
                    <Rocket size={14} className="mr-2" /> Eleve seu controle financeiro
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                    Escolha o plano ideal <br />
                    <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">para o seu bolso.</span>
                </h1>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 pt-4">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Mensal</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                        className="w-14 h-7 bg-slate-200 rounded-full p-1 relative transition-colors duration-300"
                    >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-7 bg-sky-500' : 'translate-x-0'}`}></div>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>Anual</span>
                        <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                            Até {getSavingsPercent('premium')}% OFF
                        </span>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Free Plan */}
                <div className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
                    <div className="space-y-4 mb-8">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">Básico</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">R$ 0</span>
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ mês</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">Fundamental para iniciar sua organização financeira.</p>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        {[
                            'Até 2 contas bancárias',
                            'Até 2 cartões de crédito',
                            '3 mensagens diárias com IA',
                            'Dashboard Financeiro',
                            'Gráficos básicos de gastos',
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                                <div className="w-5 h-5 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                                    <Check size={10} strokeWidth={4} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>

                    <button disabled className="w-full py-4 px-6 bg-slate-100 text-slate-400 text-[11px] font-black rounded-2xl uppercase tracking-widest">
                        {userPlan === 'free' ? 'Plano Atual' : 'Plano Gratuito'}
                    </button>
                </div>

                {/* PRO Plan */}
                <div className={`group bg-white rounded-[2.5rem] p-8 border-2 ${userPlan === 'pro' ? 'border-sky-500 ring-4 ring-sky-50' : 'border-slate-100'} shadow-2xl shadow-slate-200/50 flex flex-col relative overflow-hidden transition-all duration-300 hover:border-sky-200`}>
                    <div className="space-y-4 mb-8">
                        <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500">
                            <Rocket size={28} />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900">{plans.pro.name}</h3>
                            {billingCycle === 'annual' && (
                                <span className="bg-sky-100 text-sky-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                    Economia de {getSavingsPercent('pro')}%
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1 text-sky-600">
                                <span className="text-4xl font-black">R$ {billingCycle === 'monthly' ? plans.pro.monthlyPrice : plans.pro.monthlyPriceInAnnual}</span>
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ mês</span>
                            </div>
                            {billingCycle === 'annual' && (
                                <span className="text-slate-400 text-xs font-bold font-mono">Total de R$ {plans.pro.annualPrice} / ano</span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{plans.pro.description}</p>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        {plans.pro.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                                <div className="w-5 h-5 bg-sky-50 rounded-full flex items-center justify-center text-sky-400 shrink-0">
                                    <Check size={10} strokeWidth={4} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {userPlan === 'pro' ? (
                            <div className="w-full py-4 px-6 bg-sky-500 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2">
                                <ShieldCheck size={16} /> Plano Ativo
                            </div>
                        ) : userPlan === 'premium' ? (
                            <div className="w-full py-4 px-6 bg-slate-100 text-slate-400 text-[11px] font-black rounded-2xl uppercase tracking-widest text-center">
                                Já possui plano superior
                            </div>
                        ) : (
                            <>
                                {selectedPlanId === 'pro' ? (
                                    <div id="paypal-button-pro" className="paypal-container"></div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedPlanId('pro')}
                                        className="w-full py-4 px-6 bg-slate-900 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                                    >
                                        Upgrade para PRO
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Premium Plan - Most Recommended */}
                <div className={`group bg-slate-900 rounded-[2.5rem] p-8 border-2 ${userPlan === 'premium' ? 'border-amber-400' : 'border-slate-800'} shadow-[0_20px_50px_rgba(8,112,184,0.3)] flex flex-col relative overflow-hidden scale-[1.03] z-10 transition-all duration-500 hover:scale-[1.05]`}>
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] -mr-32 -mt-32"></div>

                    <div className="absolute top-6 right-8">
                        <div className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center gap-2">
                            <Crown size={12} /> Sugerido
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
                            <Users size={28} />
                        </div>
                        <div className="flex items-center justify-between pr-1">
                            <h3 className="text-2xl font-black text-white">{plans.premium.name}</h3>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1 text-amber-400">
                                <span className="text-4xl font-black">R$ {billingCycle === 'monthly' ? plans.premium.monthlyPrice : plans.premium.monthlyPriceInAnnual}</span>
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">/ mês</span>
                            </div>
                            {billingCycle === 'annual' && (
                                <span className="text-slate-500 text-xs font-bold font-mono">Total de R$ {plans.premium.annualPrice} / ano</span>
                            )}
                        </div>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">{plans.premium.description}</p>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        {plans.premium.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                                <div className={`w-5 h-5 ${feature.includes('Herança') ? 'bg-amber-400' : 'bg-sky-500/20'} rounded-full flex items-center justify-center text-white shrink-0`}>
                                    <Check size={10} strokeWidth={4} />
                                </div>
                                <span className={feature.includes('Herança') ? 'text-amber-400 font-bold' : ''}>{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {userPlan === 'premium' ? (
                            <div className="w-full py-4 px-6 bg-amber-400 text-slate-900 text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2">
                                <ShieldCheck size={16} /> Suporte Familiar Ativo
                            </div>
                        ) : (
                            <>
                                {selectedPlanId === 'premium' ? (
                                    <div id="paypal-button-premium" className="paypal-container"></div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedPlanId('premium')}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:shadow-2xl transition-all"
                                    >
                                        Upgrade para Premium
                                    </button>
                                )}
                            </>
                        )}
                        <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-widest">Pagamento seguro &bull; Cancele a qualquer momento</p>
                    </div>
                </div>
            </div>

            {/* Anchoring Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="bg-sky-50/50 rounded-3xl p-10 border border-sky-100 flex items-start gap-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-sky-500 shadow-sm shrink-0">
                        <Users size={32} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-black text-slate-900">Como funciona o Plano Familiar?</h4>
                        <p className="text-slate-600 font-medium leading-relaxed">
                            Ao assinar o **Premium**, você cria um grupo familiar. Ao convidar membros, eles herdam todos os benefícios PRO na conta deles **sem pagar nada a mais**. É a economia perfeita para casais e famílias.
                        </p>
                    </div>
                </div>
                <div className="bg-amber-50/50 rounded-3xl p-10 border border-amber-100 flex items-start gap-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                        <Star size={32} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-black text-slate-900">Por que escolher o Anual?</h4>
                        <p className="text-slate-600 font-medium leading-relaxed">
                            O plano anual garante o menor preço mantendo seu acesso por 12 meses ininterruptos. Você protege seu valor contra reajustes e economiza até **R$ 30,00 reais** por ano comparado ao mensal.
                        </p>
                    </div>
                </div>
            </div>

            {/* Satisfaction Banner */}
            <div className="bg-slate-50 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-100">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dúvidas sobre os novos planos?</h3>
                    <p className="text-slate-500 font-medium">Nosso suporte está pronto para ajudar você a escolher a melhor opção.</p>
                </div>
                <button className="px-10 py-4 bg-white border border-slate-200 text-slate-900 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                    Falar com Suporte
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
