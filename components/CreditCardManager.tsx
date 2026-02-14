
import React, { useState } from 'react';
import { CreditCard, Plus, Wallet, CheckCircle, X, Upload, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { Account, Transaction } from '../types';
import { BANKS, CARD_NETWORKS } from '../constants';
import InvoiceUploader from './InvoiceUploader';

interface CreditCardManagerProps {
    accounts: Account[];
    transactions: Transaction[]; // Needed to calculate current invoice and future installments
    onAddAccount: (account: Partial<Account>) => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

const CreditCardManager: React.FC<CreditCardManagerProps> = ({ accounts, transactions, onAddAccount, onAddTransaction }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'details'>('list');
    const [selectedBank, setSelectedBank] = useState<any | null>(null);
    const [importingCardId, setImportingCardId] = useState<string | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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
            balance: 0,
            type: 'credit',
            isCredit: true,
            bankId: selectedBank ? selectedBank.id : 'outro',
            color: selectedBank ? selectedBank.color : '#64748b',
            creditLimit: parseFloat(limit) || 0,
            closingDay: parseInt(closingDay) || 1,
            dueDay: parseInt(dueDay) || 10
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

    // --- IMPORT INVOICE LOGIC ---
    const handleInvoiceConfirm = (items: any[]) => {
        if (!importingCardId) return;

        // Process items
        items.forEach(item => {
            // 1. Create main transaction
            const baseTransaction = {
                description: item.description,
                amount: item.amount,
                date: item.date,
                category: 'Cartão de Crédito', // Default category
                type: 'expense' as const,
                account: importingCardId,
                isPaid: false,
                paymentMethod: 'credit_card'
            };

            if (item.installmentTotal > 1) {
                // HANDLE INSTALLMENTS
                // Calculate Start Date based on installment number if detected (e.g. 02/10)
                // We assume the invoice date matches the current installment month roughly
                // For simplicity: We launch current and future installments now
                // FUTURE IMPROVEMENT: Adjust dates accurately based on closing day

                const remaining = item.installmentTotal - item.installmentCurrent + 1;
                const startDate = new Date(item.date);

                for (let i = 0; i < remaining; i++) {
                    const futureDate = new Date(startDate);
                    futureDate.setMonth(startDate.getMonth() + i);

                    const installmentNum = item.installmentCurrent + i;

                    onAddTransaction({
                        ...baseTransaction,
                        date: futureDate.toISOString().split('T')[0],
                        description: `${item.description} (${installmentNum}/${item.installmentTotal})`,
                        recurrence: 'installment',
                        installmentNumber: installmentNum,
                        installmentCount: item.installmentTotal,
                        installmentTotal: item.amount * item.installmentTotal // Approx total
                    });
                }

            } else {
                // Single transaction
                onAddTransaction({
                    ...baseTransaction,
                    recurrence: 'one_time'
                });
            }
        });

        setImportingCardId(null);
    };

    // Filter transactions for the selected card
    const cardTransactions = transactions.filter(t => t.account === selectedCardId);

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (activeTab === 'details') {
                                setActiveTab('list');
                                setSelectedCardId(null);
                            }
                        }}
                        className={`p-2 rounded-xl transition-colors ${activeTab === 'details' ? 'hover:bg-slate-100 text-slate-500' : 'pointer-events-none'}`}
                    >
                        <CreditCard size={32} className="text-sky-600" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Meus Cartões</h2>
                        <p className="text-slate-500 text-sm font-medium">Controle de limites e faturas</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => { setActiveTab('list'); setSelectedCardId(null); }}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'list' ? 'bg-white text-sky-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'} `}
                    >
                        Cartões
                    </button>
                    <button
                        onClick={() => { setActiveTab('create'); setSelectedCardId(null); }}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'create' ? 'bg-white text-sky-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'} `}
                    >
                        Novo Cartão
                    </button>
                </div>
            </div>

            {/* IMPORT MODAL OVERLAY */}
            {importingCardId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <InvoiceUploader
                            onConfirm={handleInvoiceConfirm}
                            onCancel={() => setImportingCardId(null)}
                        />
                    </div>
                </div>
            )}

            {/* CONTENT */}
            <div className="min-h-[400px]">
                {activeTab === 'list' ? (
                    <div className="space-y-4">
                        {accounts.filter(a => a.isCredit).length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                                <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 font-medium mb-4">Nenhum cartão de crédito cadastrado.</p>
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-900/20"
                                >
                                    Adicionar Primeiro Cartão
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {accounts.filter(a => a.isCredit || a.type === 'credit').map(acc => {
                                    const bank = BANKS.find(b => b.id === acc.bankId) || BANKS.find(b => b.id === 'outro');
                                    // Calculate Invoice Total (Transactions for this account)
                                    // Note: Real credit card logic is complex. Simplified: check non-paid expenses.
                                    const currentInvoice = transactions
                                        .filter(t => t.account === acc.id && t.type === 'expense' && !t.isPaid)
                                        .reduce((sum, t) => sum + Number(t.amount), 0);

                                    const limit = acc.creditLimit || 0;
                                    const available = limit - currentInvoice;
                                    const progress = limit > 0 ? (currentInvoice / limit) * 100 : 0;

                                    return (
                                        <div key={acc.id} className="relative group overflow-hidden bg-white rounded-[2rem] border border-slate-200 p-6 transition-all hover:shadow-xl hover:-translate-y-1">

                                            {/* Card Header */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    {bank?.logoUrl && (
                                                        <img src={bank.logoUrl} alt={bank.name} className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-100 p-1" />
                                                    )}
                                                    <div>
                                                        <h3 className="font-black text-slate-900 tracking-tight leading-tight">{acc.name}</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            Final ****
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-slate-50 rounded-lg">
                                                    <CreditCard size={16} className="text-slate-400" />
                                                </div>
                                            </div>

                                            {/* Limit Progress */}
                                            <div className="mb-6">
                                                <div className="flex justify-between text-xs font-bold mb-1">
                                                    <span className="text-slate-500">Fatura Atual</span>
                                                    <span className="text-rose-500">R$ {currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-widest">
                                                    <span>Disponível: R$ {available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    <span>Limite: R$ {limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setImportingCardId(acc.id)}
                                                    className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-slate-200 uppercase tracking-widest"
                                                >
                                                    <Upload size={14} />
                                                    Importar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedCardId(acc.id);
                                                        setActiveTab('details');
                                                    }}
                                                    className="flex items-center justify-center gap-2 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all uppercase tracking-widest"
                                                >
                                                    Ver Fatura
                                                </button>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'details' && selectedCardId ? (
                    // DETAILS TAB
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => { setActiveTab('list'); setSelectedCardId(null); }}
                                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <X size={16} />
                                </div>
                                <span>Voltar para Cartões</span>
                            </button>
                            <div className="text-right">
                                <h3 className="text-xl font-black text-slate-900">
                                    {accounts.find(a => a.id === selectedCardId)?.name}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalhes da Fatura</p>
                            </div>
                        </div>

                        {/* Transaction List */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                            {cardTransactions.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <p className="font-medium">Nenhuma transação encontrada nesta fatura.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cardTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-400 font-bold text-xs uppercase">
                                                    {new Date(t.date).getDate()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{t.description}</h4>
                                                    <p className="text-xs text-slate-500">{t.category} {t.installmentNumber ? `(${t.installmentNumber}/${t.installmentCount})` : ''}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900">R$ {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${t.isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {t.isPaid ? 'Pago' : 'Pendente'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // CREATE TAB
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        {!selectedBank ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-10">
                                    <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-600">
                                        <Wallet size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Escolha a Instituição</h3>
                                    <p className="text-slate-500 text-sm font-medium">Selecione o emissor do seu cartão de crédito</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {CARD_NETWORKS.map(bank => (
                                        <button
                                            key={bank.id}
                                            onClick={() => handleSelectBank(bank)}
                                            className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 hover:border-sky-500 hover:bg-white hover:shadow-xl hover:shadow-sky-100 transition-all group"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm group-hover:scale-110 transition-all border border-slate-100">
                                                <img src={bank.logoUrl} alt={bank.name} className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-xs font-black text-slate-500 group-hover:text-slate-900 text-center uppercase tracking-tighter">{bank.name}</span>
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
                                <div className="flex items-center gap-4 mb-8">
                                    <button onClick={() => setSelectedBank(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                    <div className="flex items-center gap-4">
                                        {selectedBank.logoUrl && <img src={selectedBank.logoUrl} alt="" className="w-12 h-12 rounded-xl bg-white p-2 border border-slate-100 shadow-sm object-contain" />}
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Adicionar {selectedBank.name}</h3>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block pl-2">Nome do Cartão (Apelido)</label>
                                        <input
                                            type="text"
                                            value={cardName}
                                            onChange={e => setCardName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                                            placeholder="Ex: Nubank Principal"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block pl-2">Limite Total</label>
                                        <div className="relative">
                                            <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                value={limit}
                                                onChange={e => setLimit(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-700 font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block pl-2">Dia Fechamento</label>
                                            <div className="relative">
                                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="number"
                                                    min="1" max="31"
                                                    value={closingDay}
                                                    onChange={e => setClosingDay(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-700 font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300"
                                                    placeholder="Dia"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block pl-2">Dia Vencimento</label>
                                            <div className="relative">
                                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="number"
                                                    min="1" max="31"
                                                    value={dueDay}
                                                    onChange={e => setDueDay(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-700 font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300"
                                                    placeholder="Dia"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={handleCreateCard}
                                            disabled={!cardName}
                                            className="w-full py-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            Criar Cartão
                                        </button>
                                    </div>
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
