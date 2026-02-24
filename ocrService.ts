/**
 * Realiza a transcrição local de uma imagem usando Tesseract.js.
 * @param base64Image Imagem em formato base64.
 * @param onProgress Callback opcional para progresso (0 a 100).
 */
export const transcribeImage = async (
    base64Image: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    console.log("[OCR-Local] Iniciando processamento...");

    // Import dinâmico para evitar quebra no carregamento inicial (White Screen)
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('por', undefined, {
        logger: m => {
            if (m.status === 'recognizing text' && onProgress) {
                onProgress(Math.round(m.progress * 100));
            }
        }
    });

    try {
        const { data: { text } } = await worker.recognize(base64Image);
        console.log("[OCR-Local] Transcrição concluída.");
        await worker.terminate();
        return text;
    } catch (error) {
        console.error("[OCR-Local] Erro na transcrição:", error);
        await worker.terminate();
        throw error;
    }
};
