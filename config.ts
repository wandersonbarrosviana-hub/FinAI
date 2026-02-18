
// Configuração Centralizada de API
// Fallback de segurança para garantir funcionamento local
export const FINAI_CONFIG = {
    // Gemini (Principal)
    GEMINI_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || "",
    GEMINI_MODEL: 'gemini-flash-latest',

    // Groq (Legado/Fallback)
    GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
    GROQ_MODEL: 'llama-3.3-70b-versatile',

    IS_DEV: import.meta.env.DEV
};

// Alerta de segurança no console
if (!import.meta.env.VITE_GOOGLE_API_KEY && FINAI_CONFIG.IS_DEV) {
    console.warn("FinAI: Chave Gemini (VITE_GOOGLE_API_KEY) não encontrada no .env.");
}
