import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { X, DollarSign, Calendar, Percent, AlertCircle } from 'lucide-react';

export interface PaymentData {
    paymentType: 'full' | 'partial';
    amountPaid: number; // For partial
    interest: number;
    penalty: number;
    accountingDate: string; // YYYY-MM-DD
}

interface PaymentModalProps {
    transaction: Transaction;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: PaymentData) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ transaction, isOpen, onClose, onConfirm }) => {
    const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
    const [amountPaid, setAmountPaid] = useState<number>(transaction.amount);
    const [interest, setInterest] = useState<number>(0);
    const [penalty, setPenalty] = useState<number>(0);

    // Accounting Date logic
    const txDate = new Date(transaction.date);
    const currentDate = new Date();

    // Format as YYYY-MM-DD local time to avoid timezone shifts
    const txMonthStr = transaction.date.substring(0, 7); // YYYY-MM
    const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const isDifferentMonth = txMonthStr !== currentMonthStr;

    const [accountingOption, setAccountingOption] = useState<'due' | 'current'>('current');

    useEffect(() => {
        if (isOpen) {
            setPaymentType('full');
            setAmountPaid(transaction.amount);
            setInterest(0);
            setPenalty(0);
            setAccountingOption(isDifferentMonth ? 'current' : 'due');
        }
    }, [isOpen, transaction, isDifferentMonth]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Determine the actual date string to use
        let accountingDate = transaction.date;
        if (isDifferentMonth && accountingOption === 'current') {
            accountingDate = new Date().toISOString().split('T')[0];
        }

        // Validation
        if (paymentType === 'partial' && (amountPaid <= 0 || amountPaid >= transaction.amount)) {
            alert("Para pagamento parcial, o valor deve ser maior que zero e menor que o valor total.");
            return;
        }

        onConfirm({
            paymentType,
            amountPaid: paymentType === 'full' ? transaction.amount : amountPaid,
            interest: Number(interest) || 0,
            penalty: Number(penalty) || 0,
            accountingDate
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                        Confirmar Pagamento
                    </span>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 leading-tight">
                        Detalhes da Baixa
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        {transaction.description} - R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Payment Type */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 flex items-center gap-1">
                            <DollarSign size={14} /> Tipo de Pagamento
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentType('full')}
                                className={`p-3 rounded-xl border font-bold text-sm transition-all text-center ${paymentType === 'full'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                Total
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('partial')}
                                className={`p-3 rounded-xl border font-bold text-sm transition-all text-center ${paymentType === 'partial'
                                        ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                Parcial
                            </button>
                        </div>
                    </div>

                    {/* Partial Amount */}
                    {paymentType === 'partial' && (
                        <div className="space-y-1 animate-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Valor Pago</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={transaction.amount - 0.01}
                                    required
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(parseFloat(e.target.value))}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-black text-slate-700 dark:text-white"
                                />
                            </div>
                            <p className="text-[10px] text-amber-600 font-bold ml-1 flex items-center gap-1 mt-1">
                                <AlertCircle size={10} /> O valor restante será mantido como pendente.
                            </p>
                        </div>
                    )}

                    {/* Interest & Penalty */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Juros (R$)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Percent size={14} /></span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={interest}
                                    onChange={e => setInterest(parseFloat(e.target.value))}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Multa (R$)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><AlertCircle size={14} /></span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={penalty}
                                    onChange={e => setPenalty(parseFloat(e.target.value))}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Accounting Date Selection (if different month) */}
                    {isDifferentMonth && (
                        <div className="space-y-2 p-4 bg-sky-50 dark:bg-sky-900/10 rounded-xl border border-sky-100 dark:border-sky-900/30">
                            <label className="text-xs font-black text-sky-700 dark:text-sky-400 uppercase flex items-center gap-1">
                                <Calendar size={14} /> Mês de Competência
                            </label>
                            <p className="text-[10px] text-sky-600 dark:text-sky-500 font-bold mb-2">
                                O vencimento ({transaction.date.split('-').reverse().join('/')}) é de um mês diferente do atual. Onde deseja contabilizar?
                            </p>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="accounting"
                                        value="current"
                                        checked={accountingOption === 'current'}
                                        onChange={() => setAccountingOption('current')}
                                        className="w-4 h-4 text-sky-600"
                                    />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Mês Atual (Data do Pagamento)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="accounting"
                                        value="due"
                                        checked={accountingOption === 'due'}
                                        onChange={() => setAccountingOption('due')}
                                        className="w-4 h-4 text-sky-600"
                                    />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Mês do Vencimento Original</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-emerald-900/40 transition-all transform active:scale-95 text-sm uppercase tracking-widest"
                        >
                            Confirmar Pagamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
