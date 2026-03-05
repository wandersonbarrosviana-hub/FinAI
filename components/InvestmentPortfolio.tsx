import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, TrendingUp, DollarSign, Calendar, Calculator, Info, Wallet as WalletIcon, ChevronRight, AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Wallet, WalletAsset } from '../types';

export default function InvestmentPortfolio() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');
    const [isAddingAsset, setIsAddingAsset] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [assetForm, setAssetForm] = useState({
        symbol: '',
        quantity: '',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
        asset_type: 'acao' as 'acao' | 'fii',
        tax: '0'
    });
    const [allDividends, setAllDividends] = useState<any[]>([]);

    useEffect(() => {
        fetchWallets();
    }, []);

    useEffect(() => {
        if (selectedWalletId) {
            fetchAssets(selectedWalletId);
        }
    }, [selectedWalletId]);

    const fetchWallets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching wallets:', error);
        } else {
            setWallets(data || []);
            if (data && data.length > 0 && !selectedWalletId) {
                setSelectedWalletId(data[0].id);
            }
        }
        setLoading(false);
    };

    const fetchAssets = async (walletId: string) => {
        setLoading(true);
        try {
            const { data: walletAssets, error } = await supabase
                .from('wallet_assets')
                .select('*')
                .eq('wallet_id', walletId);

            if (error) throw error;

            if (!walletAssets || walletAssets.length === 0) {
                setAssets([]);
                setLoading(false);
                return;
            }

            // Fetch current market data and historical analysis per asset via Yahoo Finance Proxy
            const enrichedAssets = await Promise.all(walletAssets.map(async (asset) => {
                let currentPrice = asset.purchase_price;
                let assetDividends: any[] = [];
                let historicalPrices: any[] = [];
                let longName = asset.name || asset.symbol;

                try {
                    // Call our Yahoo Finance Proxy for robust data
                    const { data: yfData, error: yfError } = await supabase.functions.invoke('yahoo-finance-proxy', {
                        body: { ticker: asset.symbol }
                    });

                    if (!yfError && yfData) {
                        const quoteSummary = yfData.quoteSummary || {};
                        const priceData = quoteSummary.price || {};
                        const summaryDetail = quoteSummary.summaryDetail || {};

                        // Yahoo Finance 2 quoteSummary.price.regularMarketPrice can be a number or an object { raw, fmt }
                        const rawPrice = typeof priceData.regularMarketPrice === 'object'
                            ? priceData.regularMarketPrice.raw
                            : priceData.regularMarketPrice;

                        const rawAsk = typeof summaryDetail.ask === 'object' ? summaryDetail.ask.raw : summaryDetail.ask;
                        const rawBid = typeof summaryDetail.bid === 'object' ? summaryDetail.bid.raw : summaryDetail.bid;

                        currentPrice = rawPrice || rawAsk || rawBid || priceData.regularMarketPrice || asset.purchase_price;
                        longName = priceData.longName || longName;
                        assetDividends = yfData.dividends || [];
                        historicalPrices = yfData.prices || [];
                    }
                } catch (e) {
                    console.error(`Error fetching Yahoo data for ${asset.symbol}:`, e);
                }

                // Calculate Dividends paid AFTER purchase date
                const purchaseDateStr = asset.purchase_date || asset.created_at;
                const purchaseDateTime = new Date(purchaseDateStr).getTime();

                const relevantDividendsRate = assetDividends
                    ?.filter((d: any) => {
                        const dDate = new Date(d.paymentDate || d.date).getTime();
                        return dDate >= purchaseDateTime;
                    })
                    ?.reduce((sum: number, d: any) => sum + (d.rate || d.dividends || 0), 0) || 0;

                const totalDividendsValue = relevantDividendsRate * asset.quantity;

                // Variation from purchase price (user input) to current price
                const appreciationValue = (currentPrice - asset.purchase_price) * asset.quantity;
                const totalReturn = appreciationValue + totalDividendsValue - (asset.tax || 0);

                // Profitability = (Current Price + Accrued Dividends - Purchase Price) / Purchase Price
                const profitabilityValue = asset.purchase_price > 0
                    ? ((currentPrice + (totalDividendsValue / asset.quantity) - asset.purchase_price) / asset.purchase_price) * 100
                    : 0;

                const filteredDividendsForSidebar = assetDividends
                    ?.filter((d: any) => new Date(d.paymentDate || d.date).getTime() >= purchaseDateTime)
                    .sort((a: any, b: any) => new Date(b.paymentDate || b.date).getTime() - new Date(a.date).getTime());

                return {
                    ...asset,
                    currentPrice,
                    variation: appreciationValue,
                    totalDividends: totalDividendsValue,
                    totalReturn,
                    profitability: profitabilityValue,
                    name: longName,
                    receivedDividends: filteredDividendsForSidebar.map((d: any) => ({
                        ticker: asset.symbol,
                        date: d.paymentDate || d.date,
                        amount: (d.rate || d.dividends) * asset.quantity,
                        type: d.type || 'Provento'
                    }))
                };
            }));

            setAssets(enrichedAssets);

            // Consolidate all dividends for the sidebar
            const consolidatedDivs = enrichedAssets
                .flatMap(a => (a as any).receivedDividends || [])
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setAllDividends(consolidatedDivs);
        } catch (err) {
            console.error('Error fetching assets:', err);
            setError('Falha ao carregar ativos da carteira.');
        } finally {
            setLoading(false);
        }
    };

    const createWallet = async () => {
        if (!newWalletName.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('wallets')
            .insert([{ name: newWalletName, user_id: user.id }])
            .select();

        if (error) {
            setError('Erro ao criar carteira.');
        } else {
            setWallets([...wallets, data[0]]);
            setSelectedWalletId(data[0].id);
            setNewWalletName('');
            setIsCreatingWallet(false);
        }
    };

    const addAsset = async () => {
        if (!selectedWalletId || !assetForm.symbol) return;

        const { error } = await supabase
            .from('wallet_assets')
            .insert([{
                wallet_id: selectedWalletId,
                symbol: assetForm.symbol.toUpperCase().trim(),
                quantity: parseFloat(assetForm.quantity),
                purchase_price: parseFloat(assetForm.purchase_price),
                purchase_date: assetForm.purchase_date,
                asset_type: assetForm.asset_type,
                tax: parseFloat(assetForm.tax) || 0
            }]);

        if (error) {
            console.error('Add asset error:', error);
            if (error.message?.includes('purchase_date')) {
                setError('Erro: A coluna purchase_date não foi encontrada. Certifique-se de aplicar a migração SQL no seu painel Supabase.');
            } else {
                setError('Erro ao adicionar ativo. Verifique os dados ou o console.');
            }
        } else {
            fetchAssets(selectedWalletId);
            setIsAddingAsset(false);
            setAssetForm({ symbol: '', quantity: '', purchase_price: '', purchase_date: new Date().toISOString().split('T')[0], asset_type: 'acao', tax: '0' });
        }
    };

    const deleteWallet = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta carteira e todos os seus ativos?')) return;
        const { error } = await supabase.from('wallets').delete().eq('id', id);
        if (!error) {
            const updated = wallets.filter(w => w.id !== id);
            setWallets(updated);
            if (selectedWalletId === id) {
                setSelectedWalletId(updated.length > 0 ? updated[0].id : null);
            }
        }
    };

    const deleteAsset = async (id: string) => {
        const { error } = await supabase.from('wallet_assets').delete().eq('id', id);
        if (!error && selectedWalletId) {
            fetchAssets(selectedWalletId);
        }
    };

    const totalInvested = assets.reduce((sum, a) => sum + (a.purchase_price * a.quantity) + (a.tax || 0), 0);
    const currentEquity = assets.reduce((sum, a) => sum + (a.currentPrice * a.quantity), 0);
    const totalDividendsValue = assets.reduce((sum, a) => sum + (a.totalDividends || 0), 0);
    const totalVar = currentEquity - totalInvested + totalDividendsValue;
    const totalProfit = totalInvested > 0 ? (totalVar / totalInvested) * 100 : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    function StatsCard({ title, value, icon, color = 'text-slate-900 dark:text-white' }: { title: string, value: string, icon: React.ReactNode, color?: string }) {
        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl">
                        {icon}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
                </div>
                <p className={`text-xl font-black ${color}`}>{value}</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Header & Wallet Management */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <WalletIcon className="text-sky-600" />
                        Minha Carteira
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Gerencie seus ativos e acompanhe a rentabilidade total.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isCreatingWallet ? (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                            <input
                                type="text"
                                value={newWalletName}
                                onChange={(e) => setNewWalletName(e.target.value)}
                                placeholder="Nome da Carteira..."
                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                            />
                            <button onClick={createWallet} className="bg-sky-600 text-white p-2 rounded-xl hover:bg-sky-700">
                                <Plus size={20} />
                            </button>
                            <button onClick={() => setIsCreatingWallet(false)} className="text-slate-400 hover:text-slate-600">
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreatingWallet(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition-all"
                        >
                            <Plus size={18} /> Nova Carteira
                        </button>
                    )}
                </div>
            </div>

            {/* Wallet Selector Tabs */}
            {wallets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {wallets.map(w => (
                        <div key={w.id} className="group relative">
                            <button
                                onClick={() => setSelectedWalletId(w.id)}
                                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${selectedWalletId === w.id
                                    ? 'bg-white dark:bg-slate-900 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                                    }`}
                            >
                                {w.name}
                            </button>
                            <button
                                onClick={() => deleteWallet(w.id)}
                                className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!selectedWalletId ? (
                <div className="p-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-6">
                        <WalletIcon size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-400 mb-2">Nenhuma Carteira Encontrada</h3>
                    <p className="text-sm text-slate-500 max-w-xs">Crie uma carteira para começar a cadastrar seus ativos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Market Summary Widgets */}
                    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatsCard title="Patrimônio Atual" value={formatCurrency(currentEquity)} icon={<DollarSign className="text-emerald-500" />} />
                        <StatsCard
                            title="Lucro/Prejuízo Total"
                            value={`${totalVar >= 0 ? '+' : ''}${formatCurrency(totalVar)}`}
                            icon={<Activity className={`${totalVar >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />}
                            color={totalVar >= 0 ? 'text-emerald-500' : 'text-rose-500'}
                        />
                        <StatsCard title="Proventos Recebidos" value={formatCurrency(totalDividendsValue)} icon={<Calculator className="text-indigo-500" />} />
                        <StatsCard
                            title="Rentabilidade"
                            value={`${totalProfit.toFixed(2)}%`}
                            icon={<TrendingUp className={`${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />}
                            color={totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}
                        />
                    </div>

                    {/* Assets Table Area */}
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity size={18} className="text-sky-500" /> Ativos na Carteira
                            </h3>
                            <button
                                onClick={() => setIsAddingAsset(true)}
                                className="flex items-center gap-2 text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest hover:bg-sky-50 dark:hover:bg-sky-500/10 px-4 py-2 rounded-xl transition-colors"
                            >
                                <Plus size={16} /> Adicionar Ativo
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-[10px] uppercase font-black text-slate-400 tracking-widest px-8">
                                        <th className="py-4 px-8">Ativo</th>
                                        <th className="py-4 px-4">Qtd</th>
                                        <th className="py-4 px-4">Preço Médio</th>
                                        <th className="py-4 px-4">Cotação Atual</th>
                                        <th className="py-4 px-4 text-right">Rentabilidade</th>
                                        <th className="py-4 px-8 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center text-slate-400 font-bold">
                                                Nenhum ativo cadastrado nesta carteira.
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map((asset) => (
                                            <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                <td className="py-5 px-8">
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white tracking-tight">{asset.symbol}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{asset.name}</p>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4 font-bold text-slate-700 dark:text-slate-300">{asset.quantity}</td>
                                                <td className="py-5 px-4 font-bold text-slate-700 dark:text-slate-300">R$ {asset.purchase_price.toFixed(2)}</td>
                                                <td className="py-5 px-4">
                                                    <span className="font-bold text-slate-900 dark:text-white">R$ {asset.currentPrice?.toFixed(2)}</span>
                                                </td>
                                                <td className="py-5 px-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`font-black text-sm ${asset.profitability >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {asset.profitability >= 0 ? '+' : ''}{asset.profitability?.toFixed(2)}%
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">Total: {formatCurrency(asset.totalReturn)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-8 text-center">
                                                    <button onClick={() => deleteAsset(asset.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Proventos Widget Area */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full max-h-[600px]">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                                <Calendar size={16} className="text-indigo-500" /> Proventos Pagos
                            </h3>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                {allDividends.length === 0 ? (
                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase py-12">Nenhum provento recebido desde a compra.</p>
                                ) : (
                                    allDividends.map((div, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-emerald-500">
                                                    <ArrowUpRight size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{div.ticker} • {div.type}</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(div.amount)}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{new Date(div.date).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-sky-600/20">
                            <Calculator size={32} className="mb-4 opacity-50" />
                            <h3 className="text-xl font-black tracking-tight mb-2">Simulador de Meta</h3>
                            <p className="text-xs text-sky-100 font-medium leading-relaxed">
                                Saiba quanto você receberia se reinvestisse todos os seus proventos acumulados neste período.
                            </p>
                            <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                                Ver Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Adição de Ativo */}
            {isAddingAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-8 pb-0 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Novo Lançamento</h3>
                            <button onClick={() => setIsAddingAsset(false)} className="text-slate-400 hover:text-rose-500">
                                <ChevronRight size={20} className="rotate-90" />
                            </button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tipo</label>
                                    <select
                                        value={assetForm.asset_type}
                                        onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value as 'acao' | 'fii' })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                                    >
                                        <option value="acao">Ação</option>
                                        <option value="fii">FII</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ticker</label>
                                    <input
                                        type="text"
                                        value={assetForm.symbol}
                                        onChange={(e) => setAssetForm({ ...assetForm, symbol: e.target.value.toUpperCase() })}
                                        placeholder="EX: ITUB4"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none placeholder:text-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Quantidade</label>
                                    <input
                                        type="number"
                                        value={assetForm.quantity}
                                        onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Preço Compra</label>
                                    <input
                                        type="number"
                                        value={assetForm.purchase_price}
                                        onChange={(e) => setAssetForm({ ...assetForm, purchase_price: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data da Compra</label>
                                    <input
                                        type="date"
                                        value={assetForm.purchase_date}
                                        onChange={(e) => setAssetForm({ ...assetForm, purchase_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Taxas (B3, etc) em R$</label>
                                    <input
                                        type="number"
                                        value={assetForm.tax}
                                        onChange={(e) => setAssetForm({ ...assetForm, tax: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={addAsset}
                                className="w-full py-4 bg-sky-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-sky-600/20 hover:bg-sky-700 transition-all mt-4"
                            >
                                Confirmar Lançamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
