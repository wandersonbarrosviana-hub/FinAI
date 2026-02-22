# Script de Atualização de Investimentos - FinAI
Write-Host "🚀 Iniciando atualização da base de investimentos..." -ForegroundColor Cyan

# Verifica se o Python está instalado
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Erro: Python não encontrado. Instale o Python para continuar." -ForegroundColor Red
    exit
}

# Instala/Atualiza dependências
Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow
pip install -r scraper/requirements.txt --quiet --disable-pip-version-check

# Executa o scraper
Write-Host "🔎 Coletando dados do Yahoo Finance... (Isso pode levar alguns minutos)" -ForegroundColor Yellow
python scraper/fetch_investments.py

Write-Host "✅ Base de investimentos atualizada com sucesso!" -ForegroundColor Green
Write-Host "Aperte qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
