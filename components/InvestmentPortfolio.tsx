import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TrendingUp, DollarSign, Calendar, Calculator, Info, Wallet as WalletIcon, ChevronRight, AlertCircle, ArrowUpRight, ArrowDownRight, Activity, Settings as SettingsIcon, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../supabaseClient';
import { Wallet, WalletAsset, Account, Transaction } from '../types';
import { db } from '../db';

interface PortfolioProps {
    accounts: Account[];
    onAddTransaction: (data: Partial<Transaction>) => Promise<void>;
    wallets: Wallet[];
}

export default function InvestmentPortfolio({ accounts, onAddTransaction, wallets }: PortfolioProps) {
    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
    const [rawAssets, setRawAssets] = useState<any[]>([]);
    const [marketDataCache, setMarketDataCache] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');
    const [newWalletAccountId, setNewWalletAccountId] = useState('');
    const [isEditingWallet, setIsEditingWallet] = useState(false);
    const [editWalletName, setEditWalletName] = useState('');
    const [editWalletAccountId, setEditWalletAccountId] = useState('');
    const [isAddingAsset, setIsAddingAsset] = useState(false);
    const [error, setError] = useState('');
    const [assetFilter, setAssetFilter] = useState<'all' | 'acao' | 'fii' | 'renda_fixa'>('all');

    // Form states
    const [assetForm, setAssetForm] = useState({
        symbol: '',
        quantity: '',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
        asset_type: 'acao' as 'acao' | 'fii',
        tax: '0',
        account_id: ''
    });
    const [gordonSettings, setGordonSettings] = useState({ requiredReturn: 9, expectedGrowth: 2 });

    const selectedWallet = wallets.find(w => w.id === selectedWalletId);

    useEffect(() => {
        if (!selectedWalletId && wallets.length > 0) {
            setSelectedWalletId(wallets[0].id);
        }
    }, [wallets, selectedWalletId]);

    useEffect(() => {
        if (selectedWalletId) {
            fetchAssets(selectedWalletId);
        }
    }, [selectedWalletId]);


    const fetchAssets = async (walletId: string) => {
        setLoading(true);
        try {
            const { data: walletAssets, error } = await supabase
                .from('wallet_assets')
                .select('*')
                .eq('wallet_id', walletId);

            if (error) throw error;

            if (!walletAssets || walletAssets.length === 0) {
                setRawAssets([]);
                setLoading(false);
                return;
            }

            setRawAssets(walletAssets);

            // Fetch market data for missing tickers
            const missingTickers = walletAssets.filter(a => !marketDataCache[a.symbol]);

            if (missingTickers.length > 0) {
                // Fetch each missing ticker (could be optimized further with Promise.all and a smarter proxy)
                await Promise.all(missingTickers.map(async (asset) => {
                    try {
                        const { data: yfData, error: yfError } = await supabase.functions.invoke('yahoo-finance-proxy', {
                            body: { ticker: asset.symbol }
                        });

                        if (!yfError && yfData) {
                            setMarketDataCache(prev => ({
                                ...prev,
                                [asset.symbol]: yfData
                            }));
                        }
                    } catch (e) {
                        console.error(`Error fetching Yahoo data for ${asset.symbol}:`, e);
                    }
                }));
            }
        } catch (err) {
            console.error('Error fetching assets:', err);
            setError('Falha ao carregar ativos da carteira.');
        } finally {
            setLoading(false);
        }
    };

    const enrichedAssets = useMemo(() => {
        const now = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 12);

        return rawAssets.map(asset => {
            const yfData = marketDataCache[asset.symbol];
            let currentPrice = asset.purchase_price;
            let longName = asset.name || asset.symbol;
            let assetDividends = [];

            if (yfData) {
                const quoteSummary = yfData.quoteSummary || {};
                const priceData = quoteSummary.price || {};
                const summaryDetail = quoteSummary.summaryDetail || {};

                const rawPrice = typeof priceData.regularMarketPrice === 'object'
                    ? priceData.regularMarketPrice.raw
                    : priceData.regularMarketPrice;

                const rawAsk = typeof summaryDetail.ask === 'object' ? summaryDetail.ask.raw : summaryDetail.ask;
                const rawBid = typeof summaryDetail.bid === 'object' ? summaryDetail.bid.raw : summaryDetail.bid;

                currentPrice = rawPrice || rawAsk || rawBid || priceData.regularMarketPrice || asset.purchase_price;
                longName = priceData.longName || longName;
                assetDividends = yfData.dividends || [];
            }

            const purchaseDateStr = asset.purchase_date || asset.created_at;
            const purchaseDateTime = new Date(purchaseDateStr).getTime();

            const processedDividends = (assetDividends || []).map((d: any) => {
                const exDate = new Date(d.date || d.paymentDate);
                const dateCom = new Date(exDate);
                dateCom.setDate(exDate.getDate() - 1);
                return {
                    ...d,
                    dateCom: dateCom.toISOString().split('T')[0],
                    dateComTime: dateCom.getTime()
                };
            });

            const relevantDividendsRate = processedDividends
                ?.filter((d: any) => d.dateComTime >= purchaseDateTime)
                ?.reduce((sum: number, d: any) => sum + (d.rate || d.dividends || 0), 0) || 0;

            const totalDividendsValue = relevantDividendsRate * asset.quantity;

            const divLast12MonthsRaw = assetDividends
                ?.filter((d: any) => new Date(d.paymentDate || d.date).getTime() >= twelveMonthsAgo.getTime())
                ?.reduce((sum: number, d: any) => sum + (d.rate || d.dividends || 0), 0) || 0;

            const dy12m = currentPrice > 0 ? (divLast12MonthsRaw / currentPrice) * 100 : 0;
            const avgPricePaid = asset.total_cost / asset.quantity;
            const yoc12m = avgPricePaid > 0 ? (divLast12MonthsRaw / avgPricePaid) * 100 : 0;

            const dividendsByYear: Record<number, number> = {};
            assetDividends?.forEach((d: any) => {
                const year = new Date(d.paymentDate || d.date).getFullYear();
                dividendsByYear[year] = (dividendsByYear[year] || 0) + (d.rate || d.dividends || 0);
            });

            const currentYear = now.getFullYear();
            const last5Years = [currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5];
            const dpaSum = last5Years.reduce((sum, year) => sum + (dividendsByYear[year] || 0), 0);
            const avgDpa5y = dpaSum / 5;
            const bazinFairPrice = avgDpa5y / 0.06;

            const divs12m = assetDividends?.filter((d: any) => new Date(d.paymentDate || d.date).getTime() >= twelveMonthsAgo.getTime()) || [];
            const divLast12MonthsSum = divs12m.reduce((sum: number, d: any) => sum + (d.rate || d.dividends || 0), 0);
            const avgMonthlyDiv = divs12m.length > 0 ? (divLast12MonthsSum / divs12m.length) : (divLast12MonthsSum / 12);
            const expectedAnnualDiv = avgMonthlyDiv * 12;

            const k = gordonSettings.requiredReturn / 100;
            const g = gordonSettings.expectedGrowth / 100;
            const gordonFairPrice = k > g ? expectedAnnualDiv / (k - g) : 0;

            const appreciationValue = (currentPrice - asset.purchase_price) * asset.quantity;
            const totalReturn = appreciationValue + totalDividendsValue - (asset.tax || 0);

            const profitabilityValue = asset.purchase_price > 0
                ? ((currentPrice + (totalDividendsValue / asset.quantity) - asset.purchase_price) / asset.purchase_price) * 100
                : 0;

            const filteredDividendsForSidebar = processedDividends
                ?.filter((d: any) => d.dateComTime >= purchaseDateTime)
                .sort((a: any, b: any) => b.dateComTime - a.dateComTime);

            return {
                ...asset,
                currentPrice,
                variationPercentage: avgPricePaid > 0 ? ((currentPrice - avgPricePaid) / avgPricePaid) * 100 : 0,
                variation: appreciationValue,
                totalDividends: totalDividendsValue,
                totalReturn,
                profitability: profitabilityValue,
                dy12m,
                yoc12m,
                bazinFairPrice,
                gordonFairPrice,
                name: longName,
                marketValue: currentPrice * asset.quantity,
                receivedDividends: filteredDividendsForSidebar.map((d: any) => ({
                    ticker: asset.symbol,
                    date: d.dateCom,
                    exDate: d.date || d.paymentDate,
                    amount: (d.rate || d.dividends) * asset.quantity,
                    type: d.type || 'Provento'
                }))
            };
        });
    }, [rawAssets, marketDataCache, gordonSettings]);

    const finalAssets = useMemo(() => {
        const totalPortfolioMarketValue = enrichedAssets.reduce((sum, a) => sum + a.marketValue, 0);
        return enrichedAssets.map(a => ({
            ...a,
            proportion: totalPortfolioMarketValue > 0 ? (a.marketValue / totalPortfolioMarketValue) * 100 : 0
        }));
    }, [enrichedAssets]);

    const allDividends = useMemo(() => {
        return enrichedAssets
            .flatMap(a => (a as any).receivedDividends || [])
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [enrichedAssets]);

    // Remove redundant fetch, it is already handled by dependency matching or explicit calls

    const createWallet = async () => {
        if (!newWalletName) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('wallets')
            .insert([{
                name: newWalletName,
                user_id: user.id,
                account_id: newWalletAccountId || null
            }])
            .select();

        if (error) {
            console.error('Create wallet error:', error);
            if (error.message?.includes('account_id')) {
                setError('Erro: A coluna "account_id" não existe na tabela "wallets". Execute o SQL da migração 20260305221000.');
            } else {
                setError('Erro ao criar carteira.');
            }
        } else {
            // Atualizar Dexie localmente
            if (data && data[0]) {
                await db.wallets.put(data[0]);
            }
            setSelectedWalletId(data[0].id);
            setNewWalletName('');
            setNewWalletAccountId('');
            setIsCreatingWallet(false);
        }
    };

    const updateWallet = async () => {
        if (!selectedWalletId || !editWalletName) return;
        const { data, error } = await supabase
            .from('wallets')
            .update({
                name: editWalletName,
                account_id: editWalletAccountId || null
            })
            .eq('id', selectedWalletId)
            .select();

        if (error) {
            console.error('Update wallet error:', error);
            setError('Erro ao atualizar carteira.');
        } else {
            // Atualizar Dexie localmente para feedback instantâneo
            if (data && data[0]) {
                await db.wallets.put(data[0]);
            }
            setIsEditingWallet(false);
        }
    };

    const startEditingWallet = () => {
        if (!selectedWallet) return;
        setEditWalletName(selectedWallet.name);
        setEditWalletAccountId(selectedWallet.account_id || '');
        setIsEditingWallet(true);
    };

    const addAsset = async () => {
        if (!selectedWalletId || !assetForm.symbol) return;

        const quantity = parseFloat(assetForm.quantity);
        const price = parseFloat(assetForm.purchase_price);
        const tax = parseFloat(assetForm.tax) || 0;
        const totalCost = (quantity * price) + tax;
        const symbol = assetForm.symbol.toUpperCase().trim();

        // 1. Verificar se o ativo já existe nesta carteira
        const { data: existingAsset, error: fetchError } = await supabase
            .from('wallet_assets')
            .select('*')
            .eq('wallet_id', selectedWalletId)
            .eq('symbol', symbol)
            .maybeSingle();

        if (fetchError) {
            console.error('Error checking existing asset:', fetchError);
            setError('Erro ao verificar ativos na carteira.');
            return;
        }

        let operationError;

        if (existingAsset) {
            const totalQty = existingAsset.quantity + quantity;
            const newTotalCost = (existingAsset.total_cost || ((existingAsset.purchase_price * existingAsset.quantity) + (existingAsset.tax || 0))) + totalCost;
            const newTotalTax = (existingAsset.tax || 0) + tax;
            // Preço médio é apenas informativo agora, a base é o total_cost
            const newAvgPrice = (newTotalCost - newTotalTax) / totalQty;

            const { error } = await supabase
                .from('wallet_assets')
                .update({
                    quantity: totalQty,
                    purchase_price: newAvgPrice,
                    total_cost: newTotalCost,
                    tax: newTotalTax,
                    purchase_date: assetForm.purchase_date,
                    account_id: assetForm.account_id || existingAsset.account_id
                })
                .eq('id', existingAsset.id);

            operationError = error;
        } else {
            // 3. Inserir novo se não existir
            const { error, data } = await supabase
                .from('wallet_assets')
                .insert([{
                    wallet_id: selectedWalletId,
                    symbol,
                    quantity,
                    purchase_price: price,
                    total_cost: totalCost,
                    purchase_date: assetForm.purchase_date,
                    asset_type: assetForm.asset_type,
                    tax,
                    account_id: assetForm.account_id || null
                }])
                .select()
                .single();

            operationError = error;
            if (!error && data) {
                // Optimistic insert
                setRawAssets(prev => [...prev, data]);
            }
        }

        if (operationError) {
            console.error('Add asset error:', operationError);
            const msg = operationError.message || '';
            if (msg.includes('purchase_date')) {
                setError('Erro: A coluna "purchase_date" não existe. Role o arquivo de migração 20260305000000 ou execute o SQL correspondente.');
            } else if (msg.includes('account_id')) {
                setError('Erro: A coluna "account_id" não existe. Execute o SQL da migração 20260305221000 no seu painel Supabase.');
            } else {
                setError(`Erro ao adicionar ativo: ${operationError.message || 'Verifique o console'}`);
            }
        } else {
            // Se uma conta foi selecionada, atualizar saldo e registrar transação
            if (assetForm.account_id) {
                const acc = accounts.find(a => a.id === assetForm.account_id);
                if (acc) {
                    // 1. Atualizar saldo local
                    await db.accounts.update(acc.id, { balance: acc.balance - totalCost });

                    // 2. Registrar transação no extrato financeiro
                    await onAddTransaction({
                        description: `Compra de Ativo: ${assetForm.symbol.toUpperCase()} (${quantity} un)`,
                        amount: totalCost,
                        type: 'expense',
                        account: assetForm.account_id,
                        category: 'Investimentos',
                        subCategory: 'Ações/FIIs',
                        date: assetForm.purchase_date,
                        isPaid: true,
                        notes: `Compra de investimentos vinculada à carteira.`
                    });
                }
            }

            if (!existingAsset) {
                // New asset was already added to rawAssets inside the else block above
            } else {
                const totalQty = existingAsset.quantity + quantity;
                const newTotalCost = (existingAsset.total_cost || ((existingAsset.purchase_price * existingAsset.quantity) + (existingAsset.tax || 0))) + totalCost;
                const newTotalTax = (existingAsset.tax || 0) + tax;

                setRawAssets(prev => prev.map(a => a.id === existingAsset.id ? {
                    ...a,
                    quantity: totalQty,
                    total_cost: newTotalCost,
                    tax: newTotalTax,
                    purchase_date: assetForm.purchase_date
                } : a));
            }

            fetchAssets(selectedWalletId);
            setIsAddingAsset(false);
            setAssetForm({
                symbol: '',
                quantity: '',
                purchase_price: '',
                purchase_date: new Date().toISOString().split('T')[0],
                asset_type: 'acao',
                tax: '0',
                account_id: ''
            });
        }
    };

    const deleteWallet = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta carteira e todos os seus ativos?')) return;
        const { error } = await supabase.from('wallets').delete().eq('id', id);
        if (error) {
            console.error('Error deleting wallet:', error);
            setError('Erro ao excluir carteira.');
        } else if (selectedWalletId === id) {
            setSelectedWalletId(null);
        }
    };

    const deleteAsset = async (id: string) => {
        // Optimistic Update
        setRawAssets(prev => prev.filter(a => a.id !== id));

        const { error } = await supabase.from('wallet_assets').delete().eq('id', id);
        if (error && selectedWalletId) {
            fetchAssets(selectedWalletId);
        }
    };

    const investmentAccounts = accounts.filter(a => a.type === 'investment');

    // Filtra o caixa específico desta carteira se houver vínculo
    // Se a carteira não tiver uma conta vinculada, o caixa para esta carteira é 0.
    const walletCash = selectedWallet?.account_id
        ? (accounts.find(a => a.id === selectedWallet.account_id)?.balance || 0)
        : 0;

    const totalInvestedInAssets = finalAssets.reduce((sum, a) => sum + (a.total_cost || ((a.purchase_price * a.quantity) + (a.tax || 0))), 0);
    const currentEquityInAssets = finalAssets.reduce((sum, a) => sum + (a.currentPrice * a.quantity), 0);
    const totalDividendsValue = finalAssets.reduce((sum, a) => sum + (a.totalDividends || 0), 0);

    // Aportes = Valor efetivamente pago nos ativos (sem contar o caixa parado na conta)
    const totalAportes = totalInvestedInAssets;

    // Patrimônio = Valor mercado ativos + Saldo em conta (caixa da carteira)
    const totalPatrimony = currentEquityInAssets + walletCash;

    const totalVar = currentEquityInAssets - totalInvestedInAssets + totalDividendsValue;
    const totalProfit = totalInvestedInAssets > 0 ? (totalVar / totalInvestedInAssets) * 100 : 0;

    const allocationData = useMemo(() => {
        const groups: Record<string, number> = {};
        finalAssets.forEach(a => {
            const typeLabel = a.asset_type === 'acao' ? 'Ações' : a.asset_type === 'fii' ? 'FIIs' : 'Renda Fixa';
            groups[typeLabel] = (groups[typeLabel] || 0) + (a.marketValue || 0);
        });
        return Object.entries(groups).map(([name, value]) => ({ name, value }));
    }, [finalAssets]);

    const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
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
                        <div className="flex flex-col md:flex-row items-end gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl animate-in slide-in-from-right-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome da Carteira</label>
                                <input
                                    type="text"
                                    value={newWalletName}
                                    onChange={(e) => setNewWalletName(e.target.value)}
                                    placeholder="Ex: Ações Brasil"
                                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none w-full md:w-48"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vincular Conta (Opcional)</label>
                                <select
                                    value={newWalletAccountId}
                                    onChange={(e) => setNewWalletAccountId(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none w-full md:w-48"
                                >
                                    <option value="">Sem vínculo específico</option>
                                    {investmentAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={createWallet} className="bg-sky-600 text-white px-4 py-2 rounded-xl hover:bg-sky-700 font-bold text-sm">
                                    Criar
                                </button>
                                <button onClick={() => setIsCreatingWallet(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2">
                                    X
                                </button>
                            </div>
                        </div>
                    ) : isEditingWallet ? (
                        <div className="flex flex-col md:flex-row items-end gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl animate-in slide-in-from-right-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Editar Nome</label>
                                <input
                                    type="text"
                                    value={editWalletName}
                                    onChange={(e) => setEditWalletName(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none w-full md:w-48"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alterar Vínculo</label>
                                <select
                                    value={editWalletAccountId}
                                    onChange={(e) => setEditWalletAccountId(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none w-full md:w-48"
                                >
                                    <option value="">Sem vínculo específico</option>
                                    {investmentAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={updateWallet} className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 font-bold text-sm">
                                    Salvar
                                </button>
                                <button onClick={() => setIsEditingWallet(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2">
                                    X
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={startEditingWallet}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                <SettingsIcon size={18} /> Editar Carteira
                            </button>
                            <button
                                onClick={() => setIsCreatingWallet(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition-all"
                            >
                                <Plus size={18} /> Nova Carteira
                            </button>
                        </div>
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
                    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <StatsCard title="Patrimônio Atual" value={formatCurrency(totalPatrimony)} icon={<WalletIcon className="text-emerald-500" />} />
                        <StatsCard title="Total Aportado" value={formatCurrency(totalAportes)} icon={<ArrowUpRight className="text-blue-500" />} />
                        <StatsCard
                            title="Saldo em Conta"
                            value={formatCurrency(walletCash)}
                            icon={<DollarSign className="text-sky-500" />}
                            color={!selectedWallet?.account_id ? 'text-slate-400' : 'text-slate-900 dark:text-white'}
                        />
                        {!selectedWallet?.account_id && (
                            <div className="lg:col-span-1 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center gap-3">
                                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                    Esta carteira não está vinculada a nenhuma conta. Clique em <strong>Editar Carteira</strong> para sincronizar o saldo.
                                </p>
                            </div>
                        )}
                        <StatsCard
                            title="L/P Total"
                            value={`${totalVar >= 0 ? '+' : ''}${formatCurrency(totalVar)}`}
                            icon={<Activity className={`${totalVar >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />}
                            color={totalVar >= 0 ? 'text-emerald-500' : 'text-rose-500'}
                        />
                        <StatsCard
                            title="Rentabilidade"
                            value={`${totalProfit.toFixed(2)}%`}
                            icon={<TrendingUp className={`${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />}
                            color={totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}
                        />
                    </div>

                    {/* Assets Table Area */}
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Activity size={18} className="text-sky-500" /> Ativos
                                </h3>
                                {/* Filter Toggle */}
                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                                    <button
                                        onClick={() => setAssetFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${assetFilter === 'all' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        TUDO
                                    </button>
                                    <button
                                        onClick={() => setAssetFilter('acao')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${assetFilter === 'acao' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        AÇÕES
                                    </button>
                                    <button
                                        onClick={() => setAssetFilter('fii')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${assetFilter === 'fii' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        FIIs
                                    </button>
                                    <button
                                        onClick={() => setAssetFilter('renda_fixa')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${assetFilter === 'renda_fixa' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        RENDA FIXA
                                        <span className="text-[9px] bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded-md leading-none">BETA</span>
                                    </button>
                                </div>
                            </div>

                            {assetFilter === 'fii' && (
                                <div className="flex items-center gap-4 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl animate-in fade-in slide-in-from-right-4 mt-4 md:mt-0">
                                    <SettingsIcon size={16} className="text-indigo-500" />
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter mb-0.5">Retorno Exigido (%)</label>
                                            <input
                                                type="number"
                                                value={gordonSettings.requiredReturn}
                                                onChange={(e) => setGordonSettings({ ...gordonSettings, requiredReturn: parseFloat(e.target.value) || 0 })}
                                                className="bg-transparent border-none p-0 text-sm font-black text-indigo-700 dark:text-indigo-400 focus:ring-0 w-16"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter mb-0.5">Crescimento (g) (%)</label>
                                            <input
                                                type="number"
                                                value={gordonSettings.expectedGrowth}
                                                onChange={(e) => setGordonSettings({ ...gordonSettings, expectedGrowth: parseFloat(e.target.value) || 0 })}
                                                className="bg-transparent border-none p-0 text-sm font-black text-indigo-700 dark:text-indigo-400 focus:ring-0 w-16"
                                            />
                                        </div>
                                    </div>
                                    <div className="ml-auto hidden sm:flex items-center gap-2">
                                        <Info size={14} className="text-indigo-300" />
                                        <span className="text-[9px] font-bold text-indigo-300 uppercase">Modelo de Gordon: D1 / (k - g)</span>
                                    </div>
                                </div>
                            )}

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
                                        <th className="py-4 px-4 text-center">Saldo</th>
                                        <th className="py-4 px-4 text-center">Preço Médio / Atual</th>
                                        <th className="py-4 px-4 text-center">Qtd</th>
                                        <th className="py-4 px-4 text-center">Var / Rent%</th>
                                        {assetFilter === 'acao' && (
                                            <th className="py-4 px-4 text-center">Preço Teto (Bazin)</th>
                                        )}
                                        {assetFilter === 'fii' && (
                                            <th className="py-4 px-4 text-center">Preço Teto (Gordon)</th>
                                        )}
                                        <th className="py-4 px-4 text-center">DY / YoC (12M)</th>
                                        <th className="py-4 px-4 text-right">Part. %</th>
                                        <th className="py-4 px-8 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {finalAssets.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-16 text-center text-slate-400 font-bold">
                                                Nenhum ativo cadastrado nesta carteira.
                                            </td>
                                        </tr>
                                    ) : (
                                        finalAssets
                                            .filter(a => assetFilter === 'all' || a.asset_type === assetFilter)
                                            .map((asset) => (
                                                <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                    <td className="py-5 px-8">
                                                        <div>
                                                            <p className="font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{asset.symbol}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{asset.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-4 text-center font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(asset.marketValue)}
                                                    </td>
                                                    <td className="py-5 px-4 text-center">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-500">M: R$ {(asset.total_cost / asset.quantity).toFixed(2)}</span>
                                                            <span className="text-sm font-black text-slate-900 dark:text-white">A: R$ {asset.currentPrice?.toFixed(2)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">{asset.quantity}</td>
                                                    <td className="py-5 px-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-xs font-bold ${asset.variationPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {asset.variationPercentage >= 0 ? '+' : ''}{asset.variationPercentage?.toFixed(2)}%
                                                            </span>
                                                            <span className={`text-sm font-black ${asset.profitability >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {asset.profitability >= 0 ? '+' : ''}{asset.profitability?.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {assetFilter === 'acao' && (
                                                        <td className="py-5 px-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">R$ {asset.bazinFairPrice?.toFixed(2)}</span>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${asset.currentPrice <= asset.bazinFairPrice ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {asset.currentPrice <= asset.bazinFairPrice ? 'DESCONTADO' : 'CARO'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {assetFilter === 'fii' && (
                                                        <td className="py-5 px-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">R$ {asset.gordonFairPrice?.toFixed(2)}</span>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${asset.currentPrice <= asset.gordonFairPrice ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {asset.currentPrice <= asset.gordonFairPrice ? 'DESCONTADO' : 'CARO'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="py-5 px-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-bold text-slate-400">DY: {asset.dy12m?.toFixed(2)}%</span>
                                                            <span className="text-sm font-black text-sky-500">YoC: {asset.yoc12m?.toFixed(2)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-8 text-right font-black text-slate-900 dark:text-white">
                                                        {asset.proportion?.toFixed(1)}%
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
                                <Calendar size={16} className="text-indigo-500" /> PROVENTOS
                            </h3>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                {allDividends.length === 0 ? (
                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase py-12">Nenhum provento recebido (Data-Com após compra).</p>
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
                                                    <p className="text-[10px] text-slate-400 font-bold">{new Date(div.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                                <TrendingUp size={16} className="text-emerald-500" /> Alocação da Carteira
                            </h3>
                            <div className="flex-1 min-h-0">
                                {allocationData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={allocationData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {allocationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number) => formatCurrency(value)}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-black uppercase">Sem dados de alocação</div>
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
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Pagar com Conta</label>
                                <select
                                    value={assetForm.account_id}
                                    onChange={(e) => setAssetForm({ ...assetForm, account_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                                >
                                    <option value="">Não descontar do saldo (Apenas registro)</option>
                                    {investmentAccounts.length > 0 && (
                                        <optgroup label="Contas de Investimento (Recomendado)">
                                            {investmentAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toLocaleString('pt-BR')})</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {accounts.filter(a => a.type !== 'investment').length > 0 && (
                                        <optgroup label="Outras Contas">
                                            {accounts.filter(a => a.type !== 'investment').map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toLocaleString('pt-BR')})</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                                <p className="text-[9px] text-slate-400 mt-2 font-medium">💡 Use dinheiro de contas do tipo 'Investimento' para comprar ativos. Você pode transferir saldo de sua conta corrente para elas no Dashboard.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tipo</label>
                                    <select
                                        value={assetForm.asset_type}
                                        onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value as 'acao' | 'fii' | 'renda_fixa' })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-transparent rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                                    >
                                        <option value="acao">Ação</option>
                                        <option value="fii">FII</option>
                                        <option value="renda_fixa">Renda Fixa</option>
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
        </motion.div>
    );
}
