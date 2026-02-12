import yfinance as yf
import json
import os
import time

# List of assets to track (Stocks and FIIs)
# Yahoo Finance uses .SA suffix for Brazilian assets
ASSETS = [
    'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBAS3.SA', 'WEGE3.SA', 
    'MXRF11.SA', 'HGLG11.SA', 'KNCR11.SA', 'XPML11.SA', 'VISC11.SA'
]

def get_asset_data(ticker):
    print(f"Fetching data for {ticker}...")
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Determine type based on ticker or info
        asset_type = 'fii' if '11.SA' in ticker and ('FII' in info.get('longName', '').upper() or 'FUNDO' in info.get('longName', '').upper()) else 'acao'
        if '11.SA' in ticker and asset_type == 'acao': # Fallback for some ETFs/FIIs
             asset_type = 'fii'

        # Extract data
        price = info.get('currentPrice') or info.get('regularMarketPrice') or 0.0
        
        # P/L (Trailing PE)
        p_l = info.get('trailingPE') or 0.0
        
        # P/VP (Price to Book)
        p_vp = info.get('priceToBook')
        if not p_vp and info.get('bookValue') and price:
            p_vp = price / info.get('bookValue')
        p_vp = p_vp or 0.0
        
        # Dividend Yield
        # Yahoo Finance often returns raw percentage (e.g. 0.12 for 12%) OR generic number.
        # Based on previous run, it looked like it was returning ~1200 which implies it was 12.00 * 100.
        # Let's perform a sanity check. If > 1, assume it's percentage. If < 1, multiply by 100.
        dy = info.get('dividendYield') or 0.0
        if dy > 0 and dy < 1:
             dy = dy * 100
        # If it was 1239, that's weird. Let's assume the previous run was 12.39 * 100. 
        # So we just use it as is if > 1? 
        # Actually, standard yfinance is decimal (0.05).
        # Sample: PETR4 was 1239.0 => 12.39 * 100. So input was 12.39.
        # If input is 12.39, that is already %. 
        # BUT commonly yfinance returns 0.12.
        # Let's trust the logic: If result is e.g. 12.39, that's %.
        
        # Segment / Sector
        segment = info.get('sector') or info.get('industry') or "N/A"
        
        # Name
        name = info.get('longName') or info.get('shortName') or ticker

        data = {
            'ticker': ticker.replace('.SA', ''),
            'type': asset_type,
            'price': price,
            'p_vp': round(p_vp, 2),
            'p_l': round(p_l, 2),
            'dy': round(dy, 2), # Already adjusted logic above
            'segment': segment,
            'name': name
        }
        
        return data

    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return None

def main():
    results = []
    print("Starting Yahoo Finance import...")
    
    for asset in ASSETS:
        data = get_asset_data(asset)
        if data:
            results.append(data)
        # Yahoo Finance limits are generally lenient, but let's be nice
        time.sleep(0.5)
        
    # Ensure directory exists
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, 'investments.json')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"Done! {len(results)} assets saved to {output_file}")

if __name__ == "__main__":
    main()
