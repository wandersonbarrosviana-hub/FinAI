
import React, { useState, useMemo } from 'react';
import { Account, Transaction } from '../types';
import { BANKS } from '../constants';
import { Plus, Trash2, Wallet, CreditCard, Landmark, TrendingUp, ChevronDown, Check, Search, X, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

interface AccountManagerProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: (a: Partial<Account>) => void;
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({ accounts, transactions, onAddAccount, onUpdateAccount, onDeleteAccount }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
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
    setIsFormOpen(false);
    setFormData({ name: '', balance: 0, type: 'checking', bankId: 'itau', isDefault: false });
  };

  const getBankColor = (bankId: string) => BANKS.find(b => b.id === bankId)?.color || '#64748b';
  const getBankLogo = (bankId: string) => BANKS.find(b => b.id === bankId)?.logoUrl || '';
  const getBankName = (bankId: string) => BANKS.find(b => b.id === bankId)?.name || 'Outro';

  // Filter transactions for selected account
  const accountTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    return (transactions || [])
      .filter(t => t.account === selectedAccount.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedAccount, transactions]);

  const accountStats = useMemo(() => {
    if (!selectedAccount) return { income: 0, expense: 0 };
    return accountTransactions.reduce((acc, t) => {
      // Only count paid transactions for the realized stats
      if (t.isPaid) {
        if (t.type === 'income') acc.income += t.amount;
        if (t.type === 'expense') acc.expense += t.amount;
      }
      return acc;
    }, { income: 0, expense: 0 });
  }, [accountTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Minhas Contas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Gerencie seus bancos, corretoras e reservas.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-2xl hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 font-bold"
        >
          {isFormOpen ? <span className="px-2">Fechar</span> : (
            <>
              <Plus size={20} />
              <span>Nova Conta</span>
            </>
          )}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-sky-100 dark:border-sky-900/20 shadow-2xl animate-in zoom-in duration-300 ring-1 ring-black/5 dark:ring-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Nome Identificador</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-slate-700 dark:text-white"
                placeholder="Ex: Minha Conta Principal"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Instituição Bancária</label>

              <div
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer flex items-center justify-between group/select hover:border-sky-300"
                onClick={() => setIsBankSelectOpen(!isBankSelectOpen)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={getBankLogo(formData.bankId || 'itau')}
                      alt={getBankName(formData.bankId || 'itau')}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-white">{getBankName(formData.bankId || 'itau')}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isBankSelectOpen ? 'rotate-180' : ''}`} />
              </div>

              {isBankSelectOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 max-h-80 overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-slate-900 p-2 border-b border-slate-50 dark:border-slate-800 mb-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar banco..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/50 text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {filteredBanks.map(bank => (
                      <div
                        key={bank.id}
                        onClick={() => {
                          setFormData({ ...formData, bankId: bank.id });
                          setIsBankSelectOpen(false);
                          setBankSearch('');
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${formData.bankId === bank.id ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={bank.logoUrl}
                            alt={bank.name}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <span className="font-bold text-sm">{bank.name}</span>
                        {formData.bankId === bank.id && <Check size={16} className="ml-auto text-sky-600" />}
                      </div>
                    ))}
                    {filteredBanks.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 font-medium">
                        Nenhum banco encontrado.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Tipo de Conta</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-slate-700 dark:text-white"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="checking">Conta Corrente</option>
                <option value="savings">Poupança</option>
                <option value="investment">Investimento / Corretora</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Saldo Inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-black text-slate-700 dark:text-white"
                  placeholder="0,00"
                  value={formData.balance === 0 ? '' : formData.balance}
                  onChange={e => setFormData({ ...formData, balance: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-4 md:col-span-2 lg:col-span-4">
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
                  <span className="text-[10px] text-slate-400 font-medium font-bold uppercase tracking-widest">Registros automáticos usarão esta conta</span>
                </div>
              </label>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="bg-sky-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all transform active:scale-95"
            >
              Confirmar Abertura de Conta
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const logo = getBankLogo(account.bankId);
          const bankName = getBankName(account.bankId);
          const bankColor = account.color || getBankColor(account.bankId);

          return (
            <div
              key={account.id}
              onClick={() => setSelectedAccount(account)}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden transition-all hover:shadow-xl hover:shadow-sky-100/40 dark:hover:shadow-sky-900/20 hover:-translate-y-1 cursor-pointer"
            >
              {/* Barra lateral de cor da marca real */}
              <div
                className="absolute top-0 left-0 w-2.5 h-full"
                style={{ backgroundColor: bankColor }}
              ></div>

              <div className="flex justify-between items-start mb-6">
                <div
                  className="ml-3 w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden p-2.5 transition-transform group-hover:scale-110 duration-500"
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={bankName}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full rounded-xl flex items-center justify-center text-white font-black text-2xl" style="background-color: ${bankColor}">${bankName.charAt(0)}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-xl flex items-center justify-center text-white font-black text-2xl"
                      style={{ backgroundColor: bankColor }}
                    >
                      {bankName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Tem certeza que deseja excluir esta conta? O histórico será mantido, mas a conta sumirá.')) {
                        onDeleteAccount(account.id);
                      }
                    }}
                    className="p-2 text-slate-200 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    title="Excluir conta"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="flex gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm ${account.type === 'investment' ? 'bg-amber-500 text-white' : 'bg-sky-600 text-white'
                      }`}>
                      {account.type === 'checking' ? 'Corrente' : account.type === 'savings' ? 'Poupança' : 'Investimento'}
                    </span>
                    {account.isDefault && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm bg-emerald-500 text-white flex items-center gap-1">
                        <Check size={10} /> Padrão
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="ml-3 space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {bankName}
                </p>
                <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight truncate">{account.name}</h3>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded-md text-slate-400 dark:text-slate-500">
                    {account.type === 'checking' && <CreditCard size={12} />}
                    {account.type === 'savings' && <Landmark size={12} />}
                    {account.type === 'investment' && <TrendingUp size={12} />}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                    {account.type === 'checking' ? 'Conta Movimentação' : account.type === 'savings' ? 'Reserva Poupança' : 'Carteira de Ativos'}
                  </span>
                </div>
              </div>

              <div className="ml-3 mt-8 pt-6 border-t border-slate-50 flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black mb-1 uppercase tracking-widest">Saldo Disponível</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-sky-600 dark:text-sky-400">R$</span>
                  <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                    {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <Wallet className="absolute -bottom-8 -right-8 w-32 h-32 text-sky-500 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 -rotate-12 pointer-events-none" />
            </div>
          );
        })}

        {accounts.length === 0 && (
          <div className="col-span-full py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner dark:shadow-none">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Landmark size={48} className="opacity-10 text-sky-600" />
            </div>
            <h3 className="text-xl font-black text-slate-700 dark:text-white">Nenhuma conta conectada</h3>
            <p className="text-sm mt-2 max-w-xs text-center font-medium">Cadastre seus bancos para que a FinAI possa organizar seu patrimônio automaticamente.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-8 bg-sky-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-sky-700 shadow-2xl shadow-sky-100 transition-all flex items-center gap-3 transform hover:-translate-y-1"
            >
              <Plus size={20} />
              Vincular Nova Instituição
            </button>
          </div>
        )}
      </div>

      {/* Account Details / History Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                  <img
                    src={getBankLogo(selectedAccount.bankId)}
                    alt={selectedAccount.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedAccount.name}</h3>
                    {selectedAccount.isDefault && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{getBankName(selectedAccount.bankId)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                {!selectedAccount.isDefault && (
                  <button
                    onClick={() => {
                      onUpdateAccount(selectedAccount.id, { isDefault: true });
                      setSelectedAccount({ ...selectedAccount, isDefault: true });
                    }}
                    className="text-[10px] font-black text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors uppercase tracking-widest"
                  >
                    Marcar como Padrão
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Entradas</span>
                </div>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  R$ {accountStats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownRight size={16} className="text-rose-500" />
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Saídas</span>
                </div>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                  R$ {accountStats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" /> Histórico de Transações
              </h4>

              {accountTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Wallet size={48} className="mb-4 opacity-20" />
                  <p className="font-medium text-sm">Nenhuma movimentação nesta conta.</p>
                </div>
              ) : (
                accountTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:border-sky-100 dark:hover:border-sky-900/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                        }`}>
                        {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">{tx.description}</p>
                        <div className="flex gap-2 text-xs text-slate-500">
                          <span>{new Date(tx.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{tx.category}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-black ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footer Balance Display */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Saldo Atual</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                R$ {selectedAccount.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
