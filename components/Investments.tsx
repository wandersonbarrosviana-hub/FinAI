import React from 'react';
import InvestmentAnalytics from './InvestmentAnalytics';

import { Account, Transaction, Wallet } from '../types';

interface InvestmentsProps {
    accounts: Account[];
    onAddTransaction: (data: Partial<Transaction>) => Promise<void>;
    wallets: Wallet[];
}

const Investments: React.FC<InvestmentsProps> = ({ accounts, onAddTransaction, wallets }) => {
    return (
        <div className="w-full h-full animate-in fade-in duration-500">
            <InvestmentAnalytics accounts={accounts} onAddTransaction={onAddTransaction} wallets={wallets} />
        </div>
    );
};

export default Investments;
