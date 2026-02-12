import React, { useState } from 'react';
import { CreditCard, Plus, Wallet, CheckCircle, X } from 'lucide-react';
import { Account } from '../types';
import { BANKS } from '../constants'; // Using existing BANKS constants

interface CreditCardManagerProps {
    accounts: Account[];
    onAddAccount: (account: Partial<Account>) => void;
}

const CreditCardManager: React.FC<CreditCardManagerProps> = ({ accounts, onAddAccount }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
    const [selectedBank, setSelectedBank] = useState<any | null>(null);

    // Form State
    const [cardName, setCardName] = useState('');
    const [limit, setLimit] = useState('');
    const [closingDay, setClosingDay] = useState('');
    const [dueDay, setDueDay] = useState('');

    const handleSelectBank = (bank: any) => {
        setSelectedBank(bank);
        setCardName(bank.name); // Pre-fill name
        setActiveTab('create');
    };

    const handleCreateCard = () => {
        if (!cardName) return;

        const newAccount: Partial<Account> = {
            name: cardName,
            balance: 0, // Initial balance (could be limit, but balance usually means current debt/available?) 
            // In FinAI, 'balance' for credit card usually means "Current Invoice" (negative) or "Available Limit"?
            // Let's assume balance = 0 (no debt yet).
            type: 'credit', // specialized type if supported, or 'checking' with is_credit flag
            is_credit: true,
            bank_id: selectedBank ? selectedBank.id : 'outro',
            color: selectedBank ? selectedBank.color : '#64748b'
        };

        onAddAccount(newAccount);
        setActiveTab('list');
        resetForm();
    };

    const resetForm = () => {
        setCardName('');
        setLimit('');
        setClosingDay('');
        setDueDay('');
        setSelectedBank(null);
    };

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreditCard size={32} className="text-sky-600" />
                    <h2 className="text-2xl font-bold text-slate-200">Meus Cartões</h2>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Meus Cartões
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Novo Cartão
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 shadow-lg min-h-[400px]">
                {activeTab === 'list' ? (
                    <div className="space-y-4">
                        {accounts.filter(a => a.isCredit).length === 0 ? (
                            <div className="text-center py-20">
                                <CreditCard size={48} className="mx-auto text-slate-700 mb-4" />
                                <p className="text-slate-500 font-medium mb-4">Você ainda não possui cartões cadastrados.</p>
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-900/20"
                                >
                                    Adicionar Cartão
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {accounts.filter(a => a.isCredit || a.type === 'credit').map(acc => {
                                    const bank = BANKS.find(b => b.id === acc.bankId) || BANKS.find(b => b.id === 'outro');
                                    return (
                                        <div key={acc.id} className="relative group overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 transition-all hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-900/10">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                                            <div className="relative z-10 flex justify-between items-start mb-8">
                                                {bank?.logoUrl && (
                                                    <img src={bank.logoUrl} alt={bank.name} className="w-12 h-12 rounded-lg bg-white p-1 object-contain shadow-sm" />
                                                )}
                                                <div className="bg-slate-950/50 px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-slate-400">
                                                    CRÉDITO
                                                </div>
                                            </div>

                                            <div className="relative z-10">
                                                <h3 className="text-lg font-bold text-white mb-1">{acc.name}</h3>
                                                <p className="text-slate-400 text-sm mb-4">**** **** **** ****</p>

                                                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                                    <div>
                                                        <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Fatura Atual</p>
                                                        <p className={`text-lg font-black ${acc.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                            R$ {Math.abs(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    // CREATE TAB
                    <div className="max-w-4xl mx-auto">
                        {!selectedBank ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-white mb-2">Escolha o Emissor</h3>
                                    <p className="text-slate-400 text-sm">Selecione seu banco para preenchimento automático</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {BANKS.map(bank => (
                                        <button
                                            key={bank.id}
                                            onClick={() => handleSelectBank(bank)}
                                            className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all group"
                                        >
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm group-hover:scale-110 transition-transform">
                                                <img src={bank.logoUrl} alt={bank.name} className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-300 group-hover:text-white text-center">{bank.name}</span>
                                        </button>
                                    ))}
                                    {/* Generic Option */}
                                    <button
                                        onClick={() => handleSelectBank({ id: 'outro', name: 'Outro Cartão', color: '#64748b' })}
                                        className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all group border-dashed"
                                    >
                                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                                            <Plus size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white text-center">Outro</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // FORM
                            <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-4 mb-6">
                                    <button onClick={() => setSelectedBank(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        {selectedBank.logoUrl && <img src={selectedBank.logoUrl} alt="" className="w-8 h-8 rounded bg-white p-1" />}
                                        <h3 className="text-lg font-bold text-white">Configurar {selectedBank.name}</h3>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome do Cartão</label>
                                        <input
                                            type="text"
                                            value={cardName}
                                            onChange={e => setCardName(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                                            placeholder="Ex: Nubank Platinum"
                                        />
                                    </div>

                                    {/* Additional fields hidden for MVP (Limit, Days) as they are not in Account type yet.
                                        We store them in generic fields or just 'name' for now until user requests Schema update.
                                        User asked for visual presets, did not ask for Limit features yet.
                                    */}

                                    <button
                                        onClick={handleCreateCard}
                                        disabled={!cardName}
                                        className="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-900/20 mt-4 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        Criar Cartão
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreditCardManager;
