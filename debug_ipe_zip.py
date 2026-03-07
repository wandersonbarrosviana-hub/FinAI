import requests
import zipfile
import io
import pandas as pd

url = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2023.zip"

try:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    z = zipfile.ZipFile(io.BytesIO(r.content))
    
    print(f"Arquivos no ZIP IPE 2023: {z.namelist()}")
    
    for fname in z.namelist():
        if fname.endswith('.csv'):
            print(f"\nColunas em {fname}:")
            df = pd.read_csv(z.open(fname), sep=';', encoding='latin1', nrows=1)
            for c in df.columns:
                print(f" - {c}")

except Exception as e:
    print(f"Erro: {e}")
