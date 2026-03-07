import requests
import pandas as pd

def testar_statusinvest_proventos(ticker):
    print(f"--- Testando StatusInvest para {ticker} ---")
    
    # URL do endpoint que o site usa internamente
    url = f"https://statusinvest.com.br/ticker/gettickerprovents?ticker={ticker}&type=0"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            # O StatusInvest retorna uma lista de proventos em 'asset' ou direto se for v2
            # Na verdade, o endpoint costuma retornar um JSON com campos: 'dateCom', 'paymentDate', 'resultAbsoluteValue', etc.
            
            # Ajuste dependendo da estrutura real (as vezes vem em d, e, etc ou direto)
            if not data:
                print("Nenhum dado retornado.")
                return

            # Converter para DataFrame
            df = pd.DataFrame(data)
            
            if df.empty:
                print("Lista de proventos vazia.")
                return

            # Renomear colunas comuns do StatusInvest
            # ed -> Data COM, pd -> Data Pagamento, v -> Valor, etd -> Tipo
            column_mapping = {
                'ed': 'Data_COM',
                'pd': 'Data_Pagamento',
                'v': 'Valor',
                'etd': 'Tipo'
            }
            df = df.rename(columns=column_mapping)
            
            # Selecionar colunas interessantes
            cols = [c for c in ['Data_COM', 'Data_Pagamento', 'Valor', 'Tipo'] if c in df.columns]
            print(df[cols].head(10).to_string(index=False))
            
        else:
            print(f"Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    # Testar com BBAS3 que tem muitos dividendos
    testar_statusinvest_proventos("BBAS3")
