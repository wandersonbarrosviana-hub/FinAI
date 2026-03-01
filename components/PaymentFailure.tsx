import React, { useEffect } from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface PaymentFailureProps {
    onRetry: () => void;
    onBack: () => void;
}

const PaymentFailure: React.FC<PaymentFailureProps> = ({ onRetry, onBack }) => {
    // Optionally clean the URL
    useEffect(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-rose-500/10 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={48} strokeWidth={2.5} />
                </div>

                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pagamento Recusado</h1>
                <p className="text-slate-500 font-medium">
                    Infelizmente não conseguimos processar o seu pagamento. Por favor, verifique os dados do cartão ou escolha outra forma de pagamento.
                </p>

                <div className="pt-6 space-y-3">
                    <button
                        onClick={onRetry}
                        className="w-full py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all shadow-lg shadow-rose-500/30"
                    >
                        Tentar Novamente <RefreshCw size={18} />
                    </button>

                    <button
                        onClick={onBack}
                        className="w-full py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all"
                    >
                        <ArrowLeft size={18} /> Voltar ao Início
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailure;
