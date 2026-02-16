
import React, { useState } from 'react';
import ExpenseManager from './ExpenseManager';
import TransferForm from './TransferForm';
import TransactionStatement from './TransactionStatement';
import { Transaction, Account, Tag } from '../types';
import { TrendingUp, TrendingDown, ArrowRightLeft, FileText } from 'lucide-react';

interface TransactionManagerProps {
    transactions: Transaction[];
    accounts: Account[];
    tags: Tag[];
    onAddTransaction: (t: Partial<Transaction>) => void;
    onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
    onDeleteTransaction: (id: string) => void;
    onTransfer: (data: any) => void;
}

const TransactionManager: React.FC<TransactionManagerProps> = ({
    transactions,
    accounts,
    tags,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
    onTransfer
}) => {
    const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'transfer' | 'statement'>('expense');

    // Sub-navigation Tabs
    const tabs = [
        { id: 'expense', label: 'Despesas', icon: <TrendingDown size={18} /> },
        { id: 'income', label: 'Receitas', icon: <TrendingUp size={18} /> },
        { id: 'transfer', label: 'Transferências', icon: <ArrowRightLeft size={18} /> },
        { id: 'statement', label: 'Extrato', icon: <FileText size={18} /> },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-col gap-2">
                {/* Mobile Dropdown */}
                <div className="md:hidden">
                    <div className="relative">
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value as any)}
                            className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-sky-500 font-bold text-sm uppercase tracking-wide shadow-sm"
                        >
                            {tabs.map(tab => (
                                <option key={tab.id} value={tab.id}>
                                    {tab.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <TrendingDown size={16} className="transform rotate-0" />
                        </div>
                    </div>
                </div>

                {/* Desktop Tabs */}
                <div className="hidden md:flex p-1 bg-white rounded-2xl w-full max-w-full overflow-x-auto border border-slate-100 shadow-sm custom-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest flex-shrink-0 ${activeTab === tab.id
                                ? 'bg-slate-50 text-sky-600 shadow-sm ring-1 ring-slate-100'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {activeTab === 'expense' && (
                    <ExpenseManager
                        type="expense"
                        transactions={transactions}
                        tags={tags}
                        onAddTransaction={onAddTransaction}
                        onUpdateTransaction={onUpdateTransaction}
                        onDeleteTransaction={onDeleteTransaction}
                        accounts={accounts}
                    />
                )}

                {activeTab === 'income' && (
                    <ExpenseManager
                        type="income"
                        transactions={transactions}
                        tags={tags}
                        onAddTransaction={onAddTransaction}
                        onUpdateTransaction={onUpdateTransaction}
                        onDeleteTransaction={onDeleteTransaction}
                        accounts={accounts}
                    />
                )}

                {activeTab === 'transfer' && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Transferência entre Contas</h2>
                            <p className="text-slate-500 font-medium">Mova dinheiro entre suas contas de forma simples.</p>
                        </div>
                        <TransferForm
                            accounts={accounts}
                            onTransfer={(data) => {
                                onTransfer(data);
                                setActiveTab('statement'); // Redirect to statement after transfer
                            }}
                            onCancel={() => setActiveTab('statement')}
                        />
                    </div>
                )}

                {activeTab === 'statement' && (
                    <TransactionStatement transactions={transactions} accounts={accounts} />
                )}
            </div>
        </div>
    );
};

export default TransactionManager;
