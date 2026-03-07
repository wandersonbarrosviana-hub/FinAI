import requests
import json

# Configurações
TOKEN = "eVP75WsHBzT8JMkb8KC94R"
TICKER = "PETR4"
# O endpoint correto da V2 para dividendos costuma ser /api/v2/dividends
URL = f"https://brapi.dev/api/v2/dividends?search={TICKER}&token={TOKEN}"

def testar_v2_dividends_plural_brapi():
    print(f"--- Testando Brapi API V2 (Plural) para Dividendos de {TICKER} ---")
    try:
        response = requests.get(URL)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            
            if not results:
                print("Nenhum registro encontrado.")
                return

            for stock in results:
                print(f"\nAtivo: {stock.get('symbol')}")
                dividends = stock.get('dividends', [])
                
                if not dividends:
                    print("Sem dividendos listados.")
                    continue
                
                print(f"{'Data COM':<12} | {'Data Pag':<12} | {'Valor':<10} | {'Tipo'}")
                print("-" * 60)
                
                for div in dividends[:10]:
                    d_com = div.get('date', 'N/A')
                    d_pag = div.get('paymentDate', 'N/A')
                    val = div.get('value', 0)
                    tipo = div.get('type', 'N/A')
                    print(f"{d_com[:10]:<12} | {d_pag[:10] if d_pag else 'N/A':<12} | {val:<10.4f} | {tipo}")
        else:
            print(f"Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Erro na requisição: {e}")

if __name__ == "__main__":
    testar_v2_dividends_plural_brapi()
