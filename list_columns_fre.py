import requests
import zipfile
import io
import pandas as pd

url = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/FRE/DADOS/fre_cia_aberta_2023.zip"

try:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    z = zipfile.ZipFile(io.BytesIO(r.content))
    files = z.namelist()
    
    # Procurar o arquivo de dividendos
    target_file = [f for f in files if "distribuicao_dividendos" in f.lower() and "classe_acao" not in f.lower()][0]
    print(f"Carregando {target_file}...")
    
    df = pd.read_csv(
        z.open(target_file),
        sep=';',
        encoding='latin1',
        nrows=5
    )

    print("\nCOLUNAS ENCONTRADAS:")
    for col in df.columns:
        print(f" - {col}")

except Exception as e:
    print(f"Erro: {e}")
