import yfinance as yf
import json

def investigar_datas(ticker_name):
    print(f"\n--- Investigando {ticker_name} ---")
    ticker = yf.Ticker(ticker_name)
    
    # 1. Tentar o Calendar
    print("\n[1] Atributo .calendar:")
    try:
        cal = ticker.calendar
        print(cal)
    except Exception as e:
        print(f"Erro no calendar: {e}")

    # 2. Tentar o Info (pode ser lento)
    print("\n[2] Atributo .info (Campos de Dividendos):")
    try:
        info = ticker.info
        print(f"Ex-Dividend Date (timestamp): {info.get('exDividendDate')}")
        print(f"Dividend Date (timestamp): {info.get('dividendDate')}")
        print(f"Last Dividend Value: {info.get('lastDividendValue')}")
    except Exception as e:
        print(f"Erro no info: {e}")

    # 3. Tentar Actions
    print("\n[3] Atributo .actions (Primeiras 5 linhas):")
    try:
        print(ticker.actions.tail(5))
    except Exception as e:
        print(f"Erro no actions: {e}")

if __name__ == "__main__":
    # Testar com Petrobras e BB
    investigar_datas("PETR4.SA")
    investigar_datas("BBAS3.SA")
