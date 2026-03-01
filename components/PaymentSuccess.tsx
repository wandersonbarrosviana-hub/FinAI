import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface PaymentSuccessProps {
    onContinue: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onContinue }) => {
    // Optionally clean the URL
    useEffect(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-emerald-500/10 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_2s_infinite]">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>

                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assinatura Ativa!</h1>
                <p className="text-slate-500 font-medium">
                    Seu pagamento foi confirmado com sucesso. Você já pode aproveitar todos os recursos do seu novo plano.
                </p>

                <div className="pt-6">
                    <button
                        onClick={onContinue}
                        className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/30"
                    >
                        Acessar Minha Conta <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
