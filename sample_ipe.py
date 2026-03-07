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
    target_file = [f for f in files if f.endswith('.csv') and 'ipe_cia_aberta' in f][0]
    
    df = pd.read_csv(
        z.open(target_file),
        sep=';',
        encoding='latin1',
        nrows=50 # Ver um pouco mais de dados
    )

    # Filtrar dividendos
    div = df[df["Assunto"].str.contains("dividendo|juro", case=False, na=False)]
    
    print("\nAMOSTRA DE DADOS FILTRADOS (IPE):")
    if not div.empty:
        print(div[["CNPJ_Companhia", "Data_Referencia", "Assunto"]].head())
    else:
        print("Nenhum 'dividendo' ou 'juro' encontrado nas primeiras 50 linhas.")
        print("\nAssuntos disponíveis nas primeiras 50 linhas:")
        print(df["Assunto"].unique())

except Exception as e:
    print(f"Erro: {e}")
