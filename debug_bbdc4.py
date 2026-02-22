import yfinance as yf
import yahoo_fin.stock_info as si
import pandas as pd

ticker = "BBDC4.SA"
print(f"--- Diagnóstico para {ticker} ---")

try:
    stock = yf.Ticker(ticker)
    info = stock.info
    print("YFINANCE INFO KEYS:", list(info.keys())[:20])
    print("Price:", info.get('currentPrice') or info.get('regularMarketPrice'))
    print("Dividend Yield:", info.get('dividendYield'))
    print("P/L:", info.get('trailingPE'))
    print("P/VP:", info.get('priceToBook'))
    print("Book Value:", info.get('bookValue'))
except Exception as e:
    print("Yfinance Error:", e)

try:
    print("\n--- YAHOO_FIN QUOTE TABLE ---")
    quote = si.get_quote_table(ticker)
    for k, v in quote.items():
        print(f"{k}: {v}")
except Exception as e:
    print("Yahoo_fin Quote Error:", e)

try:
    print("\n--- YAHOO_FIN STATS ---")
    stats = si.get_stats(ticker)
    print(stats)
except Exception as e:
    print("Yahoo_fin Stats Error:", e)
