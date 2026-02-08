import React, { useState } from 'react';
import { Bell, MessageSquare, Check, X, Plus } from 'lucide-react';
import { Transaction } from '../types';
import { generateContent } from '../aiService';

interface NotificationCenterProps {
    onAddTransaction: (t: Partial<Transaction>) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onAddTransaction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [smsText, setSmsText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [detectedTransaction, setDetectedTransaction] = useState<Partial<Transaction> | null>(null);

    const handleParseSMS = async () => {
        if (!smsText.trim()) return;

        setIsProcessing(true);
        setDetectedTransaction(null);

        try {
            // Analyze with ChatGPT
            const prompt = `
        Analise a seguinte notificação de SMS bancário e extraia os dados para uma transação financeira (JSON):
        Texto: "${smsText}"
        
        Retorne APENAS um JSON com:
        {
          "description": "Nome do estabelecimento ou descrição",
          "amount": 0.00 (número, use positivo para receitas, negativo para despesas se for débito/compra),
          "type": "expense" ou "income",
          "category": "Sugira uma categoria baseada no texto",
          "date": "YYYY-MM-DD" (data de hoje ou a data encontrada no texto)
        }
      `;

            const response = await generateContent(prompt);
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            setDetectedTransaction(data);
        } catch (error) {
            console.error("Erro ao analisar SMS", error);
            alert("Não foi possível identificar a transação no texto.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = () => {
        if (detectedTransaction) {
            onAddTransaction({
                ...detectedTransaction,
                paymentMethod: 'Outros', // Default
                isPaid: true
            });
            setDetectedTransaction(null);
            setSmsText('');
            setIsOpen(false);
        }
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
            >
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/10 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-sky-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Bell size={16} className="text-sky-600" />
                                Notificações
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-slate-500">
                                <X size={16} />
                            </button>
                        </div>

                        {/* SMS Import Section */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                <MessageSquare size={14} />
                                Importar de SMS/Notificação
                            </div>

                            <textarea
                                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 resize-none h-20"
                                placeholder="Cole aqui o texto do SMS do banco... (ex: Compra aprovada R$ 50,00 Padaria Estrela)"
                                value={smsText}
                                onChange={(e) => setSmsText(e.target.value)}
                            />

                            {!detectedTransaction ? (
                                <button
                                    onClick={handleParseSMS}
                                    disabled={isProcessing || !smsText}
                                    className="w-full py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? 'Analisando...' : 'Analisar Texto'}
                                </button>
                            ) : (
                                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm animate-in zoom-in">
                                    <div className="text-xs space-y-1 mb-3">
                                        <p className="font-bold text-slate-700">{detectedTransaction.description}</p>
                                        <p className={`font-black ${detectedTransaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            R$ {detectedTransaction.amount}
                                        </p>
                                        <p className="text-slate-400">{detectedTransaction.category} • {detectedTransaction.date}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setDetectedTransaction(null)}
                                            className="flex-1 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1"
                                        >
                                            <Check size={12} /> Confirmar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 text-center text-[10px] text-slate-400">
                            Nenhuma nova notificação do sistema.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;
