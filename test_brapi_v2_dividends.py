import requests
import json

# Configurações
TOKEN = "eVP75WsHBzT8JMkb8KC94R"
TICKER = "PETR4"
# Endpoint direto para dividendos
URL = f"https://brapi.dev/api/v2/dividend?search={TICKER}&token={TOKEN}"

def testar_v2_dividendos_brapi():
    print(f"--- Testando Brapi API V2 para Dividendos de {TICKER} ---")
    try:
        response = requests.get(URL)
        
        if response.status_code == 200:
            data = response.json()
            # print(json.dumps(data, indent=2)) # Para debug se necessário
            
            results = data.get('results', [])
            if not results:
                print("Nenhum registro de dividendo encontrado para este período.")
                return

            for stock in results:
                symbol = stock.get('symbol')
                dividends = stock.get('dividends', [])
                print(f"\nAtivo: {symbol}")
                
                if not dividends:
                    print("Lista de dividendos vazia.")
                    continue
                
                print(f"{'Data COM':<12} | {'Data Pag':<12} | {'Valor':<10} | {'Tipo'}")
                print("-" * 55)
                
                for div in dividends[:10]: # Mostrar os 10 mais recentes
                    date_com = div.get('date', 'N/A')
                    payment_date = div.get('paymentDate', 'N/A')
                    value = div.get('value', 0)
                    type_div = div.get('type', 'N/A')
                    print(f"{date_com:<12} | {payment_date:<12} | {value:<10.4f} | {type_div}")
            
        else:
            print(f"Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Erro na requisição: {e}")

if __name__ == "__main__":
    testar_v2_dividendos_brapi()
