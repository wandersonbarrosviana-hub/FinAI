import requests
import json

# Configurações
TOKEN = "eVP75WsHBzT8JMkb8KC94R"
TICKER = "PETR4"
# Tentando V2 quote com extra=dividends
URL = f"https://brapi.dev/api/v2/quote/{TICKER}?token={TOKEN}&extra=dividends"

def testar_v2_quote_extra_brapi():
    print(f"--- Testando Brapi API V2 Quote + Extra para {TICKER} ---")
    try:
        response = requests.get(URL)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            
            if not results:
                print("Nenhum resultado.")
                return

            stock = results[0]
            # Na V2, a estrutura pode ser 'dividendsData'
            div_data = stock.get('dividendsData', {})
            cash = div_data.get('cashDividends', [])
            
            if not cash:
                print("Dados de dividendos não encontrados nesta estrutura.")
                # Vamos listar as chaves do objeto para entender onde estão
                print(f"Chaves disponíveis no resultado: {list(stock.keys())}")
                return

            print(f"{'Data COM':<12} | {'Data Pag':<12} | {'Valor':<10} | {'Tipo'}")
            print("-" * 60)
            for d in cash[:5]:
                print(f"{str(d.get('declarationDate'))[:10]:<12} | {str(d.get('paymentDate'))[:10]:<12} | {d.get('rate', 0):<10.4f} | {d.get('type')}")
        else:
            print(f"Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    testar_v2_quote_extra_brapi()
