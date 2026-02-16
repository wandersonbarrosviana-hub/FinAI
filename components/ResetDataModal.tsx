import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Shield, Lock, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface ResetDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: {
        keepCategories: boolean;
        keepCreditCards: boolean;
        keepAccounts: boolean;
        keepGoals: boolean;
    }) => Promise<void>;
}

const ResetDataModal: React.FC<ResetDataModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'options' | 'confirm'>('options');

    // Options State
    const [keepCategories, setKeepCategories] = useState(false);
    const [keepCreditCards, setKeepCreditCards] = useState(false);
    const [keepAccounts, setKeepAccounts] = useState(false);
    const [keepGoals, setKeepGoals] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm({
                keepCategories,
                keepCreditCards,
                keepAccounts,
                keepGoals
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-rose-50 p-6 border-b border-rose-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-rose-900">Resetar Dados</h3>
                        <p className="text-rose-600/80 text-xs font-bold uppercase tracking-widest leading-none mt-1">
                            Zona de Perigo
                        </p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-rose-300 hover:text-rose-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {step === 'options' ? (
                    <div className="p-6 space-y-6">
                        <p className="text-slate-600 font-medium">
                            Você está prestes a apagar seus dados financeiros. <br />
                            Escolha o que deseja <b>MANTER</b> salvo:
                        </p>

                        <div className="space-y-3">
                            <OptionToggle
                                label="Manter Categorias Personalizadas"
                                checked={keepCategories}
                                onChange={setKeepCategories}
                            />
                            <OptionToggle
                                label="Manter Cartões de Crédito"
                                checked={keepCreditCards}
                                onChange={setKeepCreditCards}
                            />
                            <OptionToggle
                                label="Manter Contas Bancárias"
                                checked={keepAccounts}
                                onChange={setKeepAccounts}
                            />
                            <OptionToggle
                                label="Manter Metas e Objetivos"
                                checked={keepGoals}
                                onChange={setKeepGoals}
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setStep('confirm')}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 space-y-6 text-center">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                            <Trash2 size={32} />
                        </div>

                        <h4 className="text-lg font-black text-slate-900">Tem certeza absoluta?</h4>

                        <p className="text-slate-500 text-sm">
                            Esta ação é <span className="font-bold text-rose-600 uppercase">irreversível</span>.
                            Os dados não selecionados serão perdidos permanentemente.
                        </p>

                        {/* Summary of what will be KEPT */}
                        <div className="bg-slate-50 p-4 rounded-xl text-left text-sm border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Resumo da ação:</p>
                            <ul className="space-y-1">
                                <li className="flex items-center gap-2 text-emerald-600 font-bold">
                                    <Check size={14} />
                                    {keepCategories ? 'Manter Categorias' : 'Apagar Categorias'}
                                </li>
                                <li className="flex items-center gap-2 text-emerald-600 font-bold">
                                    <Check size={14} />
                                    {keepCreditCards ? 'Manter Cartões' : 'Apagar Cartões'}
                                </li>
                                <li className="flex items-center gap-2 text-emerald-600 font-bold">
                                    <Check size={14} />
                                    {keepAccounts ? 'Manter Contas' : 'Apagar Contas'}
                                </li>
                                <li className="flex items-center gap-2 text-emerald-600 font-bold">
                                    <Check size={14} />
                                    {keepGoals ? 'Manter Metas' : 'Apagar Metas'}
                                </li>
                                <li className="flex items-center gap-2 text-rose-600 font-bold mt-2 pt-2 border-t border-slate-200">
                                    <Trash2 size={14} />
                                    Transações e Orçamentos serão apagados.
                                </li>
                            </ul>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={() => setStep('options')}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Apagar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const OptionToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div
        onClick={() => onChange(!checked)}
        className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${checked
                ? 'bg-sky-50 border-sky-200 shadow-sm'
                : 'bg-white border-slate-100 hover:bg-slate-50'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${checked ? 'bg-sky-500 border-sky-500' : 'bg-white border-slate-300'
                }`}>
                {checked && <Check size={12} className="text-white" />}
            </div>
            <span className={`font-bold ${checked ? 'text-sky-700' : 'text-slate-600'}`}>{label}</span>
        </div>
        <div className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-sky-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-5' : 'left-1'}`} />
        </div>
    </div>
);

export default ResetDataModal;
