
// Configuração Centralizada de API
// Fallback de segurança para garantir funcionamento local
export const FINAI_CONFIG = {
    // Gemini (Principal)
    GEMINI_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || "",
    GEMINI_MODEL: 'gemini-1.5-flash',
    GEMINI_PRO_MODEL: 'gemini-1.5-pro',
    GEMINI_ALTERNATE_MODELS: [
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-pro-vision',
        'gemini-2.0-flash-exp'
    ],

    // OpenAI (Fallback Secundário)
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || "",
    OPENAI_MODEL: 'gpt-4o-mini',

    // Groq (Reserva Final)
    GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
    GROQ_MODEL: 'llama-3.3-70b-versatile',

    IS_DEV: import.meta.env.DEV
};

// Alerta de segurança no console
if (!import.meta.env.VITE_GOOGLE_API_KEY && FINAI_CONFIG.IS_DEV) {
    console.warn("FinAI: Chave Gemini (VITE_GOOGLE_API_KEY) não encontrada no .env.");
}
