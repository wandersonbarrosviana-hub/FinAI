
// Configuração Centralizada de API
// Fallback de segurança para garantir funcionamento local
export const FINAI_CONFIG = {
    GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    IS_DEV: import.meta.env.DEV
};

// Alerta de segurança no console se estiver usando a chave hardcoded em produção (não deve acontecer se o build for correto)
if (!import.meta.env.VITE_GROQ_API_KEY && FINAI_CONFIG.IS_DEV) {
    console.warn("FinAI: Usando chave de fallback local para desenvolvimento.");
}
