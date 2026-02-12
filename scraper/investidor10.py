import requests
from bs4 import BeautifulSoup
import json
import os
import time
from fake_useragent import UserAgent

# List of assets to track (Stocks and FIIs)
ASSETS = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'WEGE3', 'MXRF11', 'HGLG11', 'KNCR11', 'XPML11', 'BCFF11']

BASE_URL = "https://investidor10.com.br"

def get_asset_data(ticker):
    ua = UserAgent()
    headers = {'User-Agent': ua.random}
    
    # Determine type (actions or fiis)
    url_acoes = f"{BASE_URL}/acoes/{ticker.lower()}/"
    url_fiis = f"{BASE_URL}/fiis/{ticker.lower()}/"
    
    type_asset = 'acao'
    print(f"Requesting {url_acoes}...")
    response = requests.get(url_acoes, headers=headers)
    
    if response.status_code != 200:
        print(f"Requesting {url_fiis}...")
        response = requests.get(url_fiis, headers=headers)
        type_asset = 'fii'
    
    if response.status_code != 200:
        print(f"Error fetching {ticker}: {response.status_code}")
        return None

    # Debug: Save first asset HTML to inspect
    if ticker == 'PETR4':
        with open('debug_petr4.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
            print("Saved debug_petr4.html")

    soup = BeautifulSoup(response.content, 'html.parser')
    
    data = {
        'ticker': ticker,
        'type': type_asset,
        'price': 0.0,
        'p_vp': 0.0,
        'p_l': 0.0,
        'dy': 0.0,
        'segment': '',
        'name': ''
    }
    
    try:
        # Price: div._card.cotacao div._card-body span.value
        price_elem = soup.select_one('div._card.cotacao div._card-body span.value')
        if price_elem:
            data['price'] = _parse_float(price_elem.text)
            
        # Dividend Yield (DY): div._card.dy div._card-body span.value
        dy_elem = soup.select_one('div._card.dy div._card-body span.value')
        if dy_elem:
            data['dy'] = _parse_float(dy_elem.text.replace('%', ''))
            
        # P/L and P/VP are inside div._card.val
        # Structure:
        # <div class="_card val">
        #   <div class="header">...</div>
        #   <div class="_card-body">
        #     <div class="item">
        #       <span>P/L</span>
        #       <span class="value">4,50</span>
        #     </div>
        #     ...
        #   </div>
        # </div>
        
        # We need to iterate over items in _card.val (or .vp which might be separate in some layouts, 
        # but often they are grouped in "Indicadores"). 
        # Based on visual inspection of site: usually there are separate small cards for main indicators at top.
        
        # P/VP
        pvp_elem = soup.select_one('div._card.vp div._card-body span.value')
        if pvp_elem:
            data['p_vp'] = _parse_float(pvp_elem.text)
        
        # P/L
        pl_elem = soup.select_one('div._card.val div._card-body span.value')
        if pl_elem:
             data['p_l'] = _parse_float(pl_elem.text)
             
        # Name
        name_elem = soup.select_one('h2.name-company')
        if not name_elem:
             name_elem = soup.select_one('div.header-content div.header-name h2')
        if name_elem:
            data['name'] = name_elem.text.strip()
            
        # Segment - often in table "Dados da Empresa" or "Sobre"
        # div#table-indicators ...
        # Trying a broader search 
        infos = soup.select('div.cell')
        for info in infos:
            label = info.select_one('span.title')
            if label and 'Segmento' in label.text:
                val = info.select_one('span.value') # or sub-value
                if val:
                    data['segment'] = val.text.strip()
                    break
        
    except Exception as e:
        print(f"Error parsing {ticker}: {e}")
        
    return data

def _parse_float(text):
    try:
        # Brazilian format: 1.234,56 -> 1234.56
        clean = text.replace('.', '').replace(',', '.').strip()
        return float(clean)
    except:
        return 0.0

def main():
    results = []
    print("Starting scraping...")
    
    for asset in ASSETS:
        print(f"Fetching {asset}...")
        data = get_asset_data(asset)
        if data:
            results.append(data)
        time.sleep(1) # Respectful delay
        
    # Ensure directory exists
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, 'investments.json')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"Done! Data saved to {output_file}")

if __name__ == "__main__":
    main()
