import requests
import zipfile
import io
import pandas as pd

# dataset de eventos corporativos
url = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/FR/DADOS/fr_cia_aberta_2023.zip"

def testar_cvm():
    print(f"--- Baixando dados da CVM (2023) ---")
    try:
        # baixar arquivo
        r = requests.get(url, timeout=30)
        r.raise_for_status()

        # abrir zip em memória
        z = zipfile.ZipFile(io.BytesIO(r.content))

        # listar arquivos
        filenames = z.namelist()
        print(f"Arquivos no ZIP: {filenames}")

        # carregar o primeiro CSV encontrado
        csv_name = [f for f in filenames if f.endswith('.csv')][0]
        print(f"Carregando: {csv_name}")

        df = pd.read_csv(
            z.open(csv_name),
            sep=';',
            encoding='latin1',
            low_memory=False
        )

        # filtrar dividendos e JCP
        # Note: DS_ASSUNTO é onde geralmente descrevem o evento
        div = df[
            df["DS_ASSUNTO"].str.contains("dividendo|juro", case=False, na=False)
        ]

        # selecionar colunas importantes
        cols = ["CNPJ_CIA", "DT_REFER", "DS_ASSUNTO"]
        available_cols = [c for c in cols if c in div.columns]
        
        print(f"\nTotal de eventos encontrados: {len(div)}")
        if not div.empty:
            print("\nPrimeiros 10 registros (Resumo):")
            print(div[available_cols].head(10).to_string(index=False))
        else:
            print("Nenhum evento de dividendo/juro encontrado com esses termos.")

    except Exception as e:
        print(f"Erro ao processar dados da CVM: {e}")

if __name__ == "__main__":
    testar_cvm()
