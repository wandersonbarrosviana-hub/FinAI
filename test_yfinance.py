import yfinance as yf
import pandas as pd

def dividendos(ticker):
    acao = yf.Ticker(ticker)

    # calendário corporativo (onde ficam as datas)
    calendario = acao.calendar

    resultado = {
        "Ativo": ticker,
        "Data COM (Ex-Dividend)": calendario.get("Ex-Dividend Date"),
        "Data de Pagamento": calendario.get("Dividend Date")
    }

    return pd.DataFrame([resultado])


# exemplo: Petrobras
try:
    df = dividendos("PETR4.SA")
    print(df.to_string())
except Exception as e:
    print(f"Erro: {e}")
