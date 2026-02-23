
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
    familyMembers?: Record<string, { name: string, avatar: string }>;
    onOpenAccountModal?: () => void;
}

const TransactionManager: React.FC<TransactionManagerProps> = ({
    transactions,
    accounts,
    tags,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
    onTransfer,
    familyMembers,
    onOpenAccountModal
}) => {
    const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'transfer' | 'statement'>('expense');

    // Sub-navigation Tabs
    const tabs = [
        { id: 'expense', label: 'Despesas', icon: TrendingDown },
        { id: 'income', label: 'Receitas', icon: TrendingUp },
        { id: 'transfer', label: 'Transferências', icon: ArrowRightLeft },
        { id: 'statement', label: 'Extrato', icon: FileText },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation - Mobile Fluid & Tactile */}
            <div className="flex flex-col gap-3">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-fit overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            <span className="hidden xs:inline">{tab.label}</span>
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
                        familyMembers={familyMembers}
                        onOpenAccountModal={onOpenAccountModal}
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
                        familyMembers={familyMembers}
                        onOpenAccountModal={onOpenAccountModal}
                    />
                )}

                {activeTab === 'transfer' && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Transferência entre Contas</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Mova dinheiro entre suas contas de forma simples.</p>
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
                    <TransactionStatement transactions={transactions} accounts={accounts} familyMembers={familyMembers} />
                )}
            </div>
        </div>
    );
};

export default TransactionManager;
