
import React, { useState } from 'react';
import { Account } from '../types';
import { BANKS } from '../constants';
import { Plus, Trash2, Wallet, CreditCard, Landmark, TrendingUp, ChevronDown, Check, Search } from 'lucide-react';

interface AccountManagerProps {
  accounts: Account[];
  onAddAccount: (a: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
}

const LogoImage: React.FC<{ logo?: string; bankName: string; bankColor: string }> = ({ logo, bankName, bankColor }) => {
  const [error, setError] = useState(false);

  if (!logo || error) {
    return (
      <div
        className="w-full h-full rounded-xl flex items-center justify-center text-white font-black text-2xl"
        style={{ backgroundColor: bankColor }}
      >
        {bankName.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={bankName}
      className="w-full h-full object-contain"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

const AccountManager: React.FC<AccountManagerProps> = ({ accounts, onAddAccount, onDeleteAccount }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBankSelectOpen, setIsBankSelectOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    balance: 0,
    type: 'checking',
    bankId: 'itau'
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
    setFormData({ name: '', balance: 0, type: 'checking', bankId: 'itau' });
  };

  const getBankColor = (bankId: string) => BANKS.find(b => b.id === bankId)?.color || '#64748b';
  const getBankLogo = (bankId: string) => BANKS.find(b => b.id === bankId)?.logoUrl || '';
  const getBankName = (bankId: string) => BANKS.find(b => b.id === bankId)?.name || 'Outro';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Minhas Contas</h2>
          <p className="text-slate-500 text-sm font-medium">Gerencie seus bancos, corretoras e reservas.</p>
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
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-sky-100 shadow-2xl animate-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Identificador</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                placeholder="Ex: Minha Conta Principal"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Instituição Bancária</label>

              <div
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer flex items-center justify-between group/select hover:border-sky-300"
                onClick={() => setIsBankSelectOpen(!isBankSelectOpen)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg p-1 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                    <LogoImage
                      logo={getBankLogo(formData.bankId || 'itau')}
                      bankName={getBankName(formData.bankId || 'itau')}
                      bankColor={getBankColor(formData.bankId || 'itau')}
                    />
                  </div>
                  <span className="font-bold text-slate-700">{getBankName(formData.bankId || 'itau')}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isBankSelectOpen ? 'rotate-180' : ''}`} />
              </div>

              {isBankSelectOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 max-h-80 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-2 border-b border-slate-50 mb-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar banco..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/50"
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
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${formData.bankId === bank.id ? 'bg-sky-50 text-sky-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                      >
                        <div className="w-8 h-8 bg-white rounded-lg p-1 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          <LogoImage
                            logo={bank.logoUrl}
                            bankName={bank.name}
                            bankColor={bank.color}
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
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo de Conta</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="checking">Conta Corrente</option>
                <option value="savings">Poupança</option>
                <option value="investment">Investimento / Corretora</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Saldo Inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-black text-slate-700"
                  placeholder="0,00"
                  value={formData.balance === 0 ? '' : formData.balance}
                  onChange={e => setFormData({ ...formData, balance: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                />
              </div>
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
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-xl hover:shadow-sky-100/40 hover:-translate-y-1"
            >
              {/* Barra lateral de cor da marca real */}
              <div
                className="absolute top-0 left-0 w-2.5 h-full"
                style={{ backgroundColor: bankColor }}
              ></div>

              <div className="flex justify-between items-start mb-6">
                <div
                  className="ml-3 w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-slate-100 overflow-hidden p-2.5 transition-transform group-hover:scale-110 duration-500"
                >
                  <LogoImage logo={logo} bankName={bankName} bankColor={bankColor} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => onDeleteAccount(account.id)}
                    className="p-2 text-slate-200 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50"
                    title="Excluir conta"
                  >
                    <Trash2 size={18} />
                  </button>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm ${account.type === 'investment' ? 'bg-amber-500 text-white' : 'bg-sky-600 text-white'
                    }`}>
                    {account.type === 'checking' ? 'Corrente' : account.type === 'savings' ? 'Poupança' : 'Investimento'}
                  </span>
                </div>
              </div>

              <div className="ml-3 space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {bankName}
                </p>
                <h3 className="text-xl font-black text-slate-800 leading-tight truncate">{account.name}</h3>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="p-1 bg-slate-50 rounded-md text-slate-400">
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
                <span className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">Saldo Disponível</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-sky-600">R$</span>
                  <span className="text-3xl font-black text-slate-800 tracking-tighter">
                    {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <Wallet className="absolute -bottom-8 -right-8 w-32 h-32 text-sky-500 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 -rotate-12 pointer-events-none" />
            </div>
          );
        })}

        {accounts.length === 0 && (
          <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 shadow-inner">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Landmark size={48} className="opacity-10 text-sky-600" />
            </div>
            <h3 className="text-xl font-black text-slate-700">Nenhuma conta conectada</h3>
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
    </div>
  );
};

export default AccountManager;
