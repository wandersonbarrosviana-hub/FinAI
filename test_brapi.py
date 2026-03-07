import requests
import json

# Configurações
TOKEN = "eVP75WsHBzT8JMkb8KC94R"
TICKER = "PETR4"
URL = f"https://brapi.dev/api/quote/{TICKER}?token={TOKEN}"

def testar_brapi():
    print(f"--- Testando Brapi API para {TICKER} ---")
    try:
        response = requests.get(URL)
        
        # Verificar status da resposta
        if response.status_code == 200:
            data = response.json()
            
            # Extrair informações principais
            result = data['results'][0]
            print(f"Ativo: {result.get('symbol')}")
            print(f"Preço Atual: R$ {result.get('regularMarketPrice')}")
            print(f"Variação Diária: {result.get('regularMarketChangePercent')}%")
            print(f"Nome da Empresa: {result.get('longName')}")
            
            # Mostrar JSON formatado para inspeção
            # print("\nJSON Completo:")
            # print(json.dumps(data, indent=4))
            
        elif response.status_code == 401:
            print("Erro 401: Token inválido ou não autorizado.")
        else:
            print(f"Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Erro na requisição: {e}")

if __name__ == "__main__":
    testar_brapi()
