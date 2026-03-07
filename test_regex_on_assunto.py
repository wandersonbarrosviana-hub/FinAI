import requests
import zipfile
import io
import pandas as pd
import re

url = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2023.zip"

try:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    z = zipfile.ZipFile(io.BytesIO(r.content))
    target_file = [f for f in z.namelist() if f.endswith('.csv') and 'ipe_cia_aberta' in f][0]
    
    df = pd.read_csv(z.open(target_file), sep=';', encoding='latin1', low_memory=False)
    
    # Filtrar avisos aos acionistas
    avisos = df[df["Assunto"].str.contains("Aviso aos Acionistas", case=False, na=False)]
    
    print(f"Total de Avisos aos Acionistas: {len(avisos)}")
    print("\nExemplos de Conteúdo em 'Assunto':")
    for val in avisos["Assunto"].unique()[:20]:
        print(f" - {val}")

    # Testar o regex do usuário no 'Assunto'
    def test_regex(texto, pattern):
        if pd.isna(texto): return None
        match = re.search(pattern, texto.lower())
        return match.group(1) if match else None

    pat_pag = r'pagament[o|a].*?(\d{2}/\d{2}/\d{4})'
    pat_com = r'ex[- ]?dividend[o|a].*?(\d{2}/\d{2}/\d{4})'

    avisos["DATA_PAG"] = avisos["Assunto"].apply(lambda x: test_regex(x, pat_pag))
    avisos["DATA_COM"] = avisos["Assunto"].apply(lambda x: test_regex(x, pat_com))

    found = avisos[avisos["DATA_PAG"].notna() | avisos["DATA_COM"].notna()]
    print(f"\nRegistros onde o regex funcionou no 'Assunto': {len(found)}")
    if not found.empty:
        print(found[["Assunto", "DATA_PAG", "DATA_COM"]].head())

except Exception as e:
    print(f"Erro: {e}")
