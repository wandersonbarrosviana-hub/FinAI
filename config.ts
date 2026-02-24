
// Configuração Centralizada de API
// Fallback de segurança para garantir funcionamento local
export const FINAI_CONFIG = {
    // Groq (Motor Único)
    GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    GROQ_VISION_MODEL: 'meta-llama/llama-4-scout-17b-11e-instruct', // Principal (2026)
    GROQ_VISION_POOL: [
        'meta-llama/llama-4-scout-17b-11e-instruct',
        'meta-llama/llama-4-maverick-17b-128e-instruct',
        'llama-3.2-11b-vision-preview'
    ],

    IS_DEV: import.meta.env.DEV
};

// Debug de chaves
if (FINAI_CONFIG.IS_DEV) {
    console.log("Config Check - Groq Key:", FINAI_CONFIG.GROQ_API_KEY ? "✅" : "❌");
}

if (!import.meta.env.VITE_GROQ_API_KEY && FINAI_CONFIG.IS_DEV) {
    console.warn("FinAI: Chave Groq (VITE_GROQ_API_KEY) não encontrada no .env.");
}
