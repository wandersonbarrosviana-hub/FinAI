import requests
import zipfile
import io
import pandas as pd

# dataset de eventos corporativos (IPE 2023)
url = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2023.zip"

print(f"Baixando dados de: {url}")

# baixar arquivo
try:
    r = requests.get(url, timeout=60)
    r.raise_for_status()

    # abrir zip em memória
    z = zipfile.ZipFile(io.BytesIO(r.content))

    # listar arquivos
    files = z.namelist()
    print(f"Arquivos encontrados no ZIP: {files[:5]}... (Total: {len(files)})")

    target_file = files[0] # ipe_cia_aberta_2023.csv
    print(f"Carregando {target_file}...")
    
    df = pd.read_csv(
        z.open(target_file),
        sep=';',
        encoding='latin1',
        low_memory=False
    )

    print(f"Colunas: {df.columns.tolist()}")

    # Filtrar como o usuário pediu
    if "DS_ASSUNTO" in df.columns:
        div = df[
            df["DS_ASSUNTO"].str.contains("dividendo|juro", case=False, na=False)
        ]
        
        # Colunas pedidas: CNPJ_CIA, DT_REFER, DT_FIM_EXERC (IPE use DT_RECEBIMENTO?), DS_ASSUNTO, DS_CONTEUDO
        cols_to_select = [
            "CNPJ_CIA",
            "DT_RECEBIMENTO", # IPE usa DT_RECEBIMENTO
            "DS_ASSUNTO",
            "DS_CONTEUDO"
        ]
        
        available_cols = [c for c in cols_to_select if c in div.columns]
        div_final = div[available_cols]

        print(f"\nTotal de linhas filtradas: {len(div_final)}")
        if len(div_final) > 0:
            print("\nPrimeiros 5 resultados:")
            print(div_final.head())
        else:
            print("Nenhum registro encontrado com 'dividendo' ou 'juro' em DS_ASSUNTO.")
    else:
        print("Coluna 'DS_ASSUNTO' não encontrada.")

except Exception as e:
    print(f"Ocorreu um erro: {e}")
