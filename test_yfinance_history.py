import yfinance as yf
import pandas as pd

ticker = "BBAS3.SA"

try:
    acao = yf.Ticker(ticker)

    # histórico de dividendos (data ex-dividend)
    div = acao.dividends

    if div.empty:
        print(f"Nenhum dividendo encontrado para {ticker}")
    else:
        # transformar em dataframe
        df = div.reset_index()
        df.columns = ["Data_COM", "Valor"]

        # Garantir que a coluna de data seja datetime e sem fuso horário para comparação simples
        df["Data_COM"] = pd.to_datetime(df["Data_COM"]).dt.tz_localize(None)

        # filtrar apenas 2023
        df_2023 = df[(df["Data_COM"] >= "2023-01-01") & (df["Data_COM"] <= "2023-12-31")]

        if df_2023.empty:
            print("Nenhum dividendo encontrado no período de 2023.")
        else:
            print(df_2023.to_string(index=False))

except Exception as e:
    print(f"Erro ao processar {ticker}: {e}")
