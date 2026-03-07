import requests
import zipfile
import io
import pandas as pd

url = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2023.zip"

try:
    print(f"Baixando IPE 2023 para teste final...")
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    z = zipfile.ZipFile(io.BytesIO(r.content))
    target_file = [f for f in z.namelist() if f.endswith('.csv') and 'ipe_cia_aberta' in f][0]
    
    # Carregar todas as linhas (IPE não é tão grande)
    df = pd.read_csv(
        z.open(target_file),
        sep=';',
        encoding='latin1',
        low_memory=False
    )

    # Filtrar dividendos e Juros sobre Capital Próprio
    div = df[df["Assunto"].str.contains("dividendo|juro|provent", case=False, na=False)]
    
    print(f"\nTotal de documentos no IPE 2023: {len(df)}")
    print(f"Total de registros de dividendos/juros encontrados: {len(div)}")
    
    if not div.empty:
        print("\nExemplo de registros encontrados:")
        # Mapeando de volta para os nomes que o usuário usou (onde possível)
        resumo = div[["CNPJ_Companhia", "Data_Referencia", "Assunto", "Link_Download"]]
        print(resumo.head(10))
    else:
        print("\nNenhum registro encontrado com os termos 'dividendo', 'juro' ou 'provent'.")
        print("Assuntos mais comuns:")
        print(df["Assunto"].value_counts().head(20))

except Exception as e:
    print(f"Erro: {e}")
