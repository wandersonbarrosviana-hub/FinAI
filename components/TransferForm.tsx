
import React, { useState } from 'react';
import { Account, Transaction } from '../types';
import { ArrowRightLeft, Calendar, DollarSign, Wallet } from 'lucide-react';

interface TransferFormProps {
    accounts: Account[];
    onTransfer: (data: {
        sourceAccountId: string;
        destinationAccountId: string;
        amount: number;
        date: string;
        description: string;
    }) => void;
    onCancel: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ accounts, onTransfer, onCancel }) => {
    const [sourceAccountId, setSourceAccountId] = useState<string>(accounts[0]?.id || '');
    const [destinationAccountId, setDestinationAccountId] = useState<string>(accounts.length > 1 ? accounts[1].id : '');
    const [amount, setAmount] = useState<number>(0);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>('Transferência');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceAccountId || !destinationAccountId || sourceAccountId === destinationAccountId) {
            alert("Selecione contas de origem e destino diferentes.");
            return;
        }
        if (amount <= 0) {
            alert("O valor deve ser maior que zero.");
            return;
        }

        onTransfer({
            sourceAccountId,
            destinationAccountId,
            amount,
            date,
            description
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl mx-auto ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex items-center gap-2 mb-8 text-sky-600 dark:text-sky-400">
                <ArrowRightLeft size={24} />
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Nova Transferência</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Account */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Conta Origem</label>
                    <div className="relative">
                        <Wallet className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                        <select
                            required
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none text-slate-700 dark:text-white font-medium"
                            value={sourceAccountId}
                            onChange={e => setSourceAccountId(e.target.value)}
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Destination Account */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Conta Destino</label>
                    <div className="relative">
                        <Wallet className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                        <select
                            required
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none text-slate-700 dark:text-white font-medium"
                            value={destinationAccountId}
                            onChange={e => setDestinationAccountId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {accounts.filter(a => a.id !== sourceAccountId).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Valor (R$)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                        <input
                            type="number"
                            step="0.01"
                            required
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-black text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder="0.00"
                            value={amount || ''}
                            onChange={e => setAmount(parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Data</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                        <input
                            type="date"
                            required
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-700 dark:text-white font-medium"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Descrição</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-700 dark:text-white font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Ex: Transferência para poupança"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-8 py-3 bg-sky-600 dark:bg-sky-600 hover:bg-sky-700 dark:hover:bg-sky-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-sky-100 dark:shadow-sky-900/30 transition-all"
                >
                    Confirmar Transferência
                </button>
            </div>
        </form>
    );
};

export default TransferForm;
