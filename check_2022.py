import requests
import zipfile
import io
import pandas as pd

url_2022 = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2022.zip"

try:
    print(f"Baixando IPE 2022...")
    r = requests.get(url_2022, timeout=60)
    r.raise_for_status()
    z = zipfile.ZipFile(io.BytesIO(r.content))
    
    print(f"Arquivos no ZIP 2022: {z.namelist()}")
    
    target_file = [f for f in z.namelist() if f.endswith('.csv') and 'ipe_cia_aberta' in f][0]
    df = pd.read_csv(z.open(target_file), sep=';', encoding='latin1', nrows=5)
    
    print("\nCOLUNAS IPE 2022:")
    for col in df.columns:
        print(f" - {col}")

except Exception as e:
    print(f"Erro: {e}")
