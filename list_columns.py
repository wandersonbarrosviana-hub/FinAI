import requests
import zipfile
import io
import pandas as pd

url = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2023.zip"

try:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    z = zipfile.ZipFile(io.BytesIO(r.content))
    files = z.namelist()
    
    # Pegar o arquivo principal
    target_file = [f for f in files if f.endswith('.csv') and 'ipe_cia_aberta' in f][0]
    print(f"Carregando {target_file}...")
    
    df = pd.read_csv(
        z.open(target_file),
        sep=';',
        encoding='latin1',
        nrows=5 # Só 5 linhas para ver colunas
    )

    print("\nCOLUNAS ENCONTRADAS:")
    for col in df.columns:
        print(f" - {col}")

except Exception as e:
    print(f"Erro: {e}")
