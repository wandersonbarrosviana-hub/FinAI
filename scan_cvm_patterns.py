import requests
import zipfile
import io
import pandas as pd
import re

urls = [
    "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2023.zip",
    "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/FRE/DADOS/fre_cia_aberta_2023.zip"
]

def extrair_data(texto, pattern):
    if pd.isna(texto) or not isinstance(texto, str):
        return None
    match = re.search(pattern, texto.lower())
    return match.group(1) if match else None

patterns = {
    "PAGAMENTO": r'pagament[o|a].*?(\d{2}/\d{2}/\d{4})',
    "DATA_COM": r'ex[- ]?dividend[o|a].*?(\d{2}/\d{2}/\d{4})'
}

print("--- Iniciando busca por padrões de data em todos os datasets ---")

for url in urls:
    print(f"\nVerificando URL: {url}")
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        z = zipfile.ZipFile(io.BytesIO(r.content))
        
        for filename in z.namelist():
            if not filename.endswith('.csv'):
                continue
            
            print(f"  Analisando arquivo: {filename}")
            # Ler apenas as primeiras 1000 linhas para performance
            try:
                df = pd.read_csv(z.open(filename), sep=';', encoding='latin1', low_memory=False, nrows=1000)
                
                for col in df.columns:
                    # Tentar encontrar os padrões em qualquer coluna de texto
                    for label, pattern in patterns.items():
                        found = df[col].apply(lambda x: extrair_data(x, pattern)).dropna()
                        if not found.empty:
                            print(f"    [!] PADRÃO {label} ENCONTRADO na coluna '{col}'")
                            print(f"    Exemplos: {found.head(3).tolist()}")
            except Exception as e:
                print(f"    Erro ao ler {filename}: {e}")
                
    except Exception as e:
        print(f"Erro ao acessar {url}: {e}")
