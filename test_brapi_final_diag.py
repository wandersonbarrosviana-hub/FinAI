import requests
import json

# Configurações
TOKEN = "eVP75WsHBzT8JMkb8KC94R"
TICKER = "PETR4"
# Endpoint original que funcionou para o preço
URL = f"https://brapi.dev/api/quote/{TICKER}?token={TOKEN}&extra=dividends"

def testar_brapi_dividends_final():
    print(f"--- Testando Brapi API para Dividendos de {TICKER} ---")
    try:
        response = requests.get(URL)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            
            if not results:
                print("Nenhum resultado.")
                return

            stock = results[0]
            
            # Verificando a estrutura real de dividendos retornada na v1
            # Ela costuma vir dentro de 'dividendsData'
            div_data = stock.get('dividendsData', {})
            cash = div_data.get('cashDividends', [])
            
            if not cash:
                print("Histórico de dividendos (cashDividends) não encontrado.")
                # Vamos imprimir as chaves para ajudar o usuário a entender o que VEIO
                print(f"Chaves no objeto da ação: {list(stock.keys())}")
                if 'dividendsData' in stock:
                    print(f"Chaves em dividendsData: {list(stock['dividendsData'].keys())}")
                return

            print(f"{'Data COM':<12} | {'Data Pag':<12} | {'Valor':<10} | {'Tipo'}")
            print("-" * 65)
            for d in cash[:10]:
                print(f"{str(d.get('declarationDate'))[:10]:<12} | {str(d.get('paymentDate'))[:10]:<12} | {d.get('rate', 0):<10.4f} | {d.get('type')}")
        else:
            print(f"Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    testar_brapi_dividends_final()
