import requests
import json
import pandas as pd

# Configurações
TOKEN = "eVP75WsHBzT8JMkb8KC94R"
TICKER = "PETR4"
# Endpoint para dividendos/proventos
URL = f"https://brapi.dev/api/quote/{TICKER}?token={TOKEN}&extra=dividends"

def testar_dividendos_brapi():
    print(f"--- Buscando Dividendos na Brapi para {TICKER} ---")
    try:
        response = requests.get(URL)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            
            if not results:
                print("Nenhum resultado encontrado.")
                return

            dividends_data = results[0].get('dividendsData', {})
            cash_dividends = dividends_data.get('cashDividends', [])

            if not cash_dividends:
                print("Nenhum histórico de dividendos em dinheiro encontrado.")
                # Vamos imprimir o JSON para ver se a estrutura mudou ou se os dados estão em outro lugar
                # print(json.dumps(results[0], indent=2))
                return

            # Criar um DataFrame com os dividendos
            df = pd.DataFrame(cash_dividends)
            
            # Renomear colunas para facilitar a leitura se existirem
            # A Brapi costuma usar: assetIssued, paymentDate, declarationDate, rate, relatedTo, type
            column_mapping = {
                'declarationDate': 'Data_COM',
                'paymentDate': 'Data_Pagamento',
                'rate': 'Valor',
                'type': 'Tipo'
            }
            
            df = df.rename(columns=column_mapping)
            
            # Selecionar e ordenar colunas relevantes
            cols_to_show = [c for c in ['Data_COM', 'Data_Pagamento', 'Valor', 'Tipo'] if c in df.columns]
            df = df[cols_to_show]
            
            print(f"\nÚltimos Dividendos Encontrados:")
            print(df.head(10).to_string(index=False))
            
        else:
            print(f"Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Erro na requisição: {e}")

if __name__ == "__main__":
    testar_dividendos_brapi()
