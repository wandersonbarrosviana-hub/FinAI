
import React, { useState } from 'react';
import { Account } from '../types';
import { BANKS } from '../constants';
import { Plus, Wallet, ChevronDown, Check, Search, X } from 'lucide-react';

interface AccountModalProps {
    onClose: () => void;
    onAddAccount: (a: Partial<Account>) => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ onClose, onAddAccount }) => {
    const [isBankSelectOpen, setIsBankSelectOpen] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const [formData, setFormData] = useState<Partial<Account>>({
        name: '',
        balance: 0,
        type: 'checking',
        bankId: 'itau',
        isDefault: false
    });

    const filteredBanks = BANKS.filter(b =>
        b.name.toLowerCase().includes(bankSearch.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const bank = BANKS.find(b => b.id === formData.bankId);
        onAddAccount({
            ...formData,
            balance: formData.balance || 0,
            color: bank?.color
        });
        onClose();
    };

    const getBankLogo = (bankId: string) => BANKS.find(b => b.id === bankId)?.logoUrl || '';
    const getBankName = (bankId: string) => BANKS.find(b => b.id === bankId)?.name || 'Outro';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-300 max-h-[98vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex items-center justify-center text-sky-600">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Criar Nova Conta</h3>
                            <p className="text-sm text-slate-500 font-medium">Você precisa de uma conta para registrar transações.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome da Conta</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                                placeholder="Ex: Minha Conta Corrente"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1 relative">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Instituição</label>
                            <div
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer flex items-center justify-between"
                                onClick={() => setIsBankSelectOpen(!isBankSelectOpen)}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={getBankLogo(formData.bankId || 'itau')} className="w-6 h-6 object-contain" alt="" />
                                    <span className="font-bold">{getBankName(formData.bankId || 'itau')}</span>
                                </div>
                                <ChevronDown size={16} />
                            </div>

                            {isBankSelectOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border p-2 z-[110] max-h-60 overflow-y-auto">
                                    <div className="sticky top-0 bg-white dark:bg-slate-900 p-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Buscar banco..."
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm"
                                            value={bankSearch}
                                            onChange={(e) => setBankSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    {filteredBanks.map(bank => (
                                        <div
                                            key={bank.id}
                                            onClick={() => { setFormData({ ...formData, bankId: bank.id }); setIsBankSelectOpen(false); }}
                                            className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                        >
                                            <img src={bank.logoUrl} className="w-6 h-6 object-contain" alt="" />
                                            <span className="font-bold text-sm">{bank.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="checking">Corrente</option>
                                    <option value="savings">Poupança</option>
                                    <option value="investment">Investimento</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Saldo Inicial</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black"
                                    placeholder="0,00"
                                    value={formData.balance || ''}
                                    onChange={e => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer group/check">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isDefault}
                                        onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 dark:text-white group-hover/check:text-sky-600 transition-colors">Definir como conta padrão</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Novos lançamentos usarão esta conta automaticamente.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-sky-600 text-white py-4 rounded-2xl font-black hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all transform active:scale-95">
                        Criar Conta e Prosseguir
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;
