import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const FMP_API_KEY = "gC76KcQcKKVrLRflHPZ8U33OK2KS0Y6P";
const BASE_URL = "https://financialmodelingprep.com/api/v3";

interface StockData {
    symbol: string;
    price: number;
    dividendYield: number; // TTM
    peRatio: number; // P/L TTM
    pbRatio: number; // P/VP TTM
    netIncome: number; // Lucro Líquido TTM
    sharesOutstanding: number; // Quantidade de papéis
    roe: number; // ROE TTM
    name: string;
    changesPercentage: number;
}

export default function InvestmentAnalytics() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [stocks, setStocks] = useState<StockData[]>([]);

    // Pagination State
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchStockData = async (ticker: string) => {
        try {
            setLoading(true);

            // Auto append .SA if not present and doesn't look like a US ticker already
            let fmpTicker = ticker.toUpperCase().trim();
            if (!fmpTicker.endsWith('.SA')) {
                fmpTicker = `${fmpTicker}.SA`;
            }

            // Check if already in list to avoid duplicates
            if (stocks.some(s => s.symbol === fmpTicker)) {
                Toast.show({
                    type: 'info',
                    text1: 'Atenção',
                    text2: 'Este ativo já está na tabela.',
                });
                setLoading(false);
                setSearchQuery('');
                return;
            }

            // 1. Fetch Quote (Price, Changes, Shares Outstanding)
            const quoteRes = await fetch(`${BASE_URL}/quote/${fmpTicker}?apikey=${FMP_API_KEY}`);
            const quoteData = await quoteRes.json();

            if (!quoteData || quoteData.length === 0) {
                throw new Error('Ativo não encontrado');
            }

            // 2. Fetch Key Metrics TTM (P/E, P/B, ROE, Div Yield)
            const metricsRes = await fetch(`${BASE_URL}/key-metrics-ttm/${fmpTicker}?apikey=${FMP_API_KEY}`);
            const metricsData = await metricsRes.json();

            // 3. Fetch Income Statement TTM (Net Income)
            const incomeRes = await fetch(`${BASE_URL}/income-statement/${fmpTicker}?period=annual&limit=1&apikey=${FMP_API_KEY}`);
            const incomeData = await incomeRes.json();

            const quote = quoteData[0];
            const metrics = metricsData && metricsData.length > 0 ? metricsData[0] : {};
            const income = incomeData && incomeData.length > 0 ? incomeData[0] : {};

            const newStock: StockData = {
                symbol: quote.symbol,
                name: quote.name,
                price: quote.price || 0,
                changesPercentage: quote.changesPercentage || 0,
                sharesOutstanding: quote.sharesOutstanding || 0,
                dividendYield: (metrics.dividendYieldTTM || 0) * 100, // Convert to %
                peRatio: metrics.peRatioTTM || 0,
                pbRatio: metrics.pbRatioTTM || 0,
                roe: (metrics.roeTTM || 0) * 100, // Convert to %
                netIncome: income.netIncome || 0
            };

            setStocks(prev => [newStock, ...prev]);
            setSearchQuery('');

        } catch (error: any) {
            console.error("Error fetching stock:", error);
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: error.message || 'Erro ao buscar dados do ativo.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            fetchStockData(searchQuery);
        }
    };

    const removeItem = (symbol: string) => {
        setStocks(prev => prev.filter(s => s.symbol !== symbol));
    };

    // Pagination Logic
    const totalPages = Math.ceil(stocks.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStocks = stocks.slice(startIndex, startIndex + itemsPerPage);

    const formatCurrency = (value: number) => {
        if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(2)}M`;
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const formatNumber = (value: number) => {
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        return value.toLocaleString('pt-BR');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Análise de Ativos</Text>
                    <Text style={styles.subtitle}>Pesquise empresas na B3 para ver indicadores</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Digite o Ticker (ex: ITUB4, PETR4)"
                        placeholderTextColor="#8E8E93"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        autoCapitalize="characters"
                    />
                </View>
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.searchButtonText}>Adicionar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.tableCard}>
                <View style={styles.tableControls}>
                    <Text style={styles.controlsText}>Mostrar:</Text>
                    {[10, 20, 30, 40].map(num => (
                        <TouchableOpacity
                            key={num}
                            style={[styles.pageButton, itemsPerPage === num && styles.pageButtonActive]}
                            onPress={() => {
                                setItemsPerPage(num);
                                setCurrentPage(1);
                            }}
                        >
                            <Text style={[styles.pageButtonText, itemsPerPage === num && styles.pageButtonTextActive]}>
                                {num}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCell, { width: 100 }]}>Ativo</Text>
                            <Text style={[styles.headerCell, { width: 110 }]}>Cotação</Text>
                            <Text style={[styles.headerCell, { width: 120 }]}>Div. Yield (12m)</Text>
                            <Text style={[styles.headerCell, { width: 90 }]}>P/L</Text>
                            <Text style={[styles.headerCell, { width: 90 }]}>P/VP</Text>
                            <Text style={[styles.headerCell, { width: 110 }]}>ROE</Text>
                            <Text style={[styles.headerCell, { width: 130 }]}>Lucro Líquido</Text>
                            <Text style={[styles.headerCell, { width: 140 }]}>Ações (Mercado)</Text>
                            <Text style={[styles.headerCell, { width: 60, textAlign: 'center' }]}>Ações</Text>
                        </View>

                        {/* Table Body */}
                        {stocks.length === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <MaterialCommunityIcons name="chart-box-outline" size={48} color="#3A3A3C" />
                                <Text style={styles.emptyStateText}>Nenhum ativo adicionado.</Text>
                                <Text style={styles.emptyStateSubText}>Pesquise por um ticker acima para começar.</Text>
                            </View>
                        ) : (
                            paginatedStocks.map((stock, index) => (
                                <View key={stock.symbol} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                                    <View style={[styles.cell, { width: 100 }]}>
                                        <Text style={styles.tickerText}>{stock.symbol.replace('.SA', '')}</Text>
                                        <Text style={styles.nameText} numberOfLines={1}>{stock.name}</Text>
                                    </View>

                                    <View style={[styles.cell, { width: 110 }]}>
                                        <Text style={styles.priceText}>R$ {stock.price.toFixed(2)}</Text>
                                        <Text style={[
                                            styles.changeText,
                                            { color: stock.changesPercentage >= 0 ? '#34C759' : '#FF3B30' }
                                        ]}>
                                            {stock.changesPercentage > 0 ? '+' : ''}{stock.changesPercentage.toFixed(2)}%
                                        </Text>
                                    </View>

                                    <Text style={[styles.cell, styles.cellText, { width: 120 }]}>
                                        {stock.dividendYield.toFixed(2)}%
                                    </Text>
                                    <Text style={[styles.cell, styles.cellText, { width: 90 }]}>
                                        {stock.peRatio.toFixed(2)}
                                    </Text>
                                    <Text style={[styles.cell, styles.cellText, { width: 90 }]}>
                                        {stock.pbRatio.toFixed(2)}
                                    </Text>
                                    <Text style={[styles.cell, styles.cellText, { width: 110 }]}>
                                        {stock.roe.toFixed(2)}%
                                    </Text>
                                    <Text style={[styles.cell, styles.cellText, { width: 130 }]}>
                                        {formatCurrency(stock.netIncome)}
                                    </Text>
                                    <Text style={[styles.cell, styles.cellText, { width: 140 }]}>
                                        {formatNumber(stock.sharesOutstanding)}
                                    </Text>

                                    <TouchableOpacity
                                        style={[styles.cell, { width: 60, alignItems: 'center' }]}
                                        onPress={() => removeItem(stock.symbol)}
                                    >
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Pagination Footer */}
                {stocks.length > 0 && (
                    <View style={styles.paginationFooter}>
                        <Text style={styles.summaryText}>
                            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, stocks.length)} de {stocks.length} ativos
                        </Text>
                        <View style={styles.paginationControls}>
                            <TouchableOpacity
                                style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
                                disabled={currentPage === 1}
                                onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                <MaterialCommunityIcons name="chevron-left" size={24} color={currentPage === 1 ? "#3A3A3C" : "#E5E5EA"} />
                            </TouchableOpacity>

                            <Text style={styles.pageIndicatorText}>
                                {currentPage} / {totalPages}
                            </Text>

                            <TouchableOpacity
                                style={[styles.navButton, currentPage === totalPages && styles.navButtonDisabled]}
                                disabled={currentPage === totalPages}
                                onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                                <MaterialCommunityIcons name="chevron-right" size={24} color={currentPage === totalPages ? "#3A3A3C" : "#E5E5EA"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        height: 48,
        paddingHorizontal: 12,
        marginRight: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: '#0A84FF',
        height: 48,
        paddingHorizontal: 20,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    tableCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        overflow: 'hidden',
    },
    tableControls: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    controlsText: {
        color: '#8E8E93',
        marginRight: 12,
        fontSize: 14,
    },
    pageButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 8,
        backgroundColor: '#2C2C2E',
    },
    pageButtonActive: {
        backgroundColor: '#0A84FF',
    },
    pageButtonText: {
        color: '#E5E5EA',
        fontSize: 14,
        fontWeight: '500',
    },
    pageButtonTextActive: {
        color: '#FFF',
        fontWeight: '700',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
        backgroundColor: '#242426',
    },
    headerCell: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    rowEven: {
        backgroundColor: '#1C1C1E',
    },
    rowOdd: {
        backgroundColor: '#202022',
    },
    cell: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    cellText: {
        color: '#E5E5EA',
        fontSize: 14,
        fontWeight: '500',
    },
    tickerText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    nameText: {
        color: '#8E8E93',
        fontSize: 12,
        marginTop: 2,
    },
    priceText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    changeText: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    emptyStateContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    emptyStateSubText: {
        color: '#8E8E93',
        fontSize: 14,
        marginTop: 4,
    },
    paginationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
        backgroundColor: '#1C1C1E',
    },
    summaryText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navButton: {
        padding: 4,
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
    },
    navButtonDisabled: {
        backgroundColor: 'transparent',
    },
    pageIndicatorText: {
        color: '#E5E5EA',
        fontSize: 14,
        fontWeight: '600',
        marginHorizontal: 12,
    }
});
