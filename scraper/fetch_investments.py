import yfinance as yf
import json
import os
import time
import pandas as pd
import numpy as np
import yahoo_fin.stock_info as si
from datetime import datetime

# List of assets to track
ASSETS = [
    'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBAS3.SA', 'WEGE3.SA', 
    'ABEV3.SA', 'B3SA3.SA', 'EGIE3.SA', 'SANB11.SA', 'FLRY3.SA',
    'BBDC4.SA', 'BBDC3.SA', 'VIVT3.SA', 'GGBR4.SA', 'CPLE6.SA',
    'JBSS3.SA', 'RAIL3.SA', 'SUZB3.SA', 'RENT3.SA', 'LREN3.SA',
    'MXRF11.SA', 'HGLG11.SA', 'KNCR11.SA', 'XPML11.SA', 'VISC11.SA',
    'KNIP11.SA', 'GGRC11.SA', 'HGBS11.SA', 'KNCA11.SA', 'KNSC11.SA',
    'ALZR11.SA', 'HGRU11.SA', 'BTLG11.SA', 'TRXF11.SA', 'CPTS11.SA'
]

def get_asset_details(ticker):
    print(f"Fetching ADVANCED data for {ticker}...")
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # --- Basic Data ---
        asset_type = 'fii' if '11.SA' in ticker and ('FII' in info.get('longName', '').upper() or 'FUNDO' in info.get('longName', '').upper()) else 'acao'
        if '11.SA' in ticker and asset_type == 'acao': 
             asset_type = 'fii'

        price = info.get('currentPrice') or info.get('regularMarketPrice') or 0.0
        
        # --- Indicators ---
        def safe_get(key, mult=1):
            val = info.get(key)
            if val is None: return 0.0
            # If mult is 100 (percentage), check if it's already a high value
            # yfinance is inconsistent: sometimes 0.12, sometimes 12.0
            res = float(val)
            if mult == 100 and res > 1.0: # Likely already in %
                return res
            return res * mult

        dy = safe_get('dividendYield', 100)
        p_l = safe_get('trailingPE')
        p_vp = safe_get('priceToBook')
        if p_vp == 0 and info.get('bookValue') and price:
            p_vp = price / info.get('bookValue')
        
        roe = safe_get('returnOnEquity', 100)
        # ROIC Proxy: Return on Assets or calculate from financials
        roic = safe_get('returnOnAssets', 100) 
        
        payout = safe_get('payoutRatio', 100)
        margem_liquida = safe_get('profitMargins', 100)
        margem_bruta = safe_get('grossMargins', 100)
        margem_ebitda = safe_get('ebitdaMargins', 100)
        
        vpa = safe_get('bookValue')
        lpa = safe_get('trailingEps')
        
        total_debt = safe_get('totalDebt')
        total_cash = safe_get('totalCash')
        ebitda = safe_get('ebitda')
        divida_liquida = total_debt - total_cash
        
        divida_liquida_ebitda = 0.0
        if ebitda and ebitda > 0:
            divida_liquida_ebitda = divida_liquida / ebitda

        p_ebitda = safe_get('enterpriseToEbitda')
        
        # --- Missing Indicators with yahoo_fin ---
        market_cap = safe_get('marketCap')
        ebitda_val = safe_get('ebitda')
        
        try:
            # Complement with yahoo_fin if values are missing
            if market_cap == 0 or ebitda_val == 0:
                quote = si.get_quote_table(ticker)
                if market_cap == 0:
                    mc_str = quote.get('Market Cap', '0')
                    # Convert '1.2B' or '500M' to numbers if needed
                    if isinstance(mc_str, str):
                        if 'T' in mc_str: market_cap = float(mc_str.replace('T', '')) * 1e12
                        elif 'B' in mc_str: market_cap = float(mc_str.replace('B', '')) * 1e9
                        elif 'M' in mc_str: market_cap = float(mc_str.replace('M', '')) * 1e6
                
                stats = si.get_stats(ticker)
                if ebitda_val == 0:
                    ebitda_row = stats[stats['Attribute'].str.contains('EBITDA', na=False)]
                    if not ebitda_row.empty:
                        ebitda_val = ebitda_row.iloc[0]['Value']
                        # Handle strings like '1.2B'
                        if isinstance(ebitda_val, str):
                            if 'B' in ebitda_val: ebitda_val = float(ebitda_val.replace('B', '')) * 1e9
                            elif 'M' in ebitda_val: ebitda_val = float(ebitda_val.replace('M', '')) * 1e6
        except:
            pass

        # CAGR Lucros 5 Anos (Manual calc from Financials if possible, else Proxy)
        cagr_5y = 0.0
        try:
            financials = stock.financials
            if not financials.empty and 'Net Income' in financials.index:
                incomes = financials.loc['Net Income'].dropna()
                if len(incomes) >= 4: # yfinance often gives 4 years
                    latest = incomes.iloc[0]
                    oldest = incomes.iloc[-1]
                    years = len(incomes) - 1
                    if latest > 0 and oldest > 0:
                        cagr_5y = ((latest / oldest) ** (1/years) - 1) * 100
        except:
            cagr_5y = safe_get('earningsGrowth', 100) # Fallback

        equity = safe_get('totalStockholderEquity') 
        if not equity and vpa and info.get('sharesOutstanding'):
            equity = vpa * info.get('sharesOutstanding')
            
        free_float = safe_get('floatShares')
        papers = safe_get('sharesOutstanding')
        liquidez = safe_get('averageDailyVolume10Day') * price

        # --- Historical Data (10 Years) ---
        chart_data = []
        dividends_list = []
        
        hist = stock.history(period="10y")
        if not hist.empty:
            hist['Year'] = hist.index.year
            # Yearly sums
            yearly = hist.groupby('Year').agg({
                'Dividends': 'sum',
                'Close': 'mean'
            })
            
            for year, row in yearly.iterrows():
                div_sum = row['Dividends']
                if div_sum > 0:
                    y_yield = (div_sum / row['Close']) * 100 if row['Close'] else 0
                    chart_data.append({
                        'year': int(year),
                        'value': round(float(div_sum), 2) if div_sum else 0.0,
                        'yield': round(float(y_yield), 2) if y_yield else 0.0
                    })
            
            # Detailed Dividends for Table (Last 10 years events)
            div_events = hist[hist['Dividends'] > 0].sort_index(ascending=False)
            for date, row in div_events.iterrows():
                dividends_list.append({
                    'type': 'Dividendo', # Simplified
                    'dateCom': date.strftime('%d/%m/%Y'),
                    'paymentDate': date.strftime('%d/%m/%Y'),
                    'value': round(float(row['Dividends']), 2) if row['Dividends'] else 0.0
                })

        def safe_round(val, digits=2):
            try:
                if val is None or val == 0: return 0.0
                return round(float(val), digits)
            except:
                return 0.0

        data = {
            'ticker': ticker.replace('.SA', ''),
            'type': asset_type,
            'price': safe_round(price),
            'name': info.get('longName') or info.get('shortName') or ticker,
            'segment': info.get('sector') or info.get('industry') or "N/A",
            'indicators': {
                'dy': safe_round(dy),
                'pl': safe_round(p_l),
                'pvp': safe_round(p_vp),
                'roe': safe_round(roe),
                'roic': safe_round(roic),
                'cagr_lucros_5y': safe_round(cagr_5y),
                'payout': safe_round(payout),
                'margem_liquida': safe_round(margem_liquida),
                'margem_bruta': safe_round(margem_bruta),
                'margem_ebitda': safe_round(margem_ebitda),
                'p_ebitda': safe_round(p_ebitda),
                'divida_liquida_ebitda': safe_round(divida_liquida_ebitda),
                'vpa': safe_round(vpa),
                'lpa': safe_round(lpa),
                'divida_liquida': safe_round(divida_liquida),
                'divida_bruta': safe_round(total_debt),
                'liquidez_media_diaria': safe_round(liquidez),
                'free_float': safe_round(free_float),
                'patrimonio_liquido': safe_round(equity),
                'numero_papeis': safe_round(papers),
                'market_cap': safe_round(market_cap),
                'ebitda': safe_round(ebitda_val)
            },
            'chartData': chart_data,
            'dividends': dividends_list
        }
        return data

    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return None

def main():
    results = []
    print("Starting Comprehensive Import...")
    for asset in ASSETS:
        data = get_asset_details(asset)
        if data:
            results.append(data)
        time.sleep(1) # Be polite
        
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, 'investments.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Done!")

if __name__ == "__main__":
    main()
