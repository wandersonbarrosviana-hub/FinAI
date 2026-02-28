
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Trash2, Edit2, Save, X, Camera } from 'lucide-react';
import { parseInvoice } from '../aiService';
import { transcribeImage } from '../ocrService';

// Configure PDF.js worker locally using Vite's URL import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface InvoiceItem {
    id: string; // Temporary ID for UI
    date: string;
    description: string;
    amount: number;
    installmentCurrent?: number;
    installmentTotal?: number;
}

interface InvoiceUploaderProps {
    onConfirm: (items: InvoiceItem[]) => void;
    onCancel: () => void;
}

const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({ onConfirm, onCancel }) => {
    const [status, setStatus] = useState<'idle' | 'reading' | 'analyzing' | 'review'>('idle');
    const [progress, setProgress] = useState(0);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    // --- PDF EXTRACTION ---
    const extractTextFromPDF = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';

        const numPages = pdf.numPages;
        for (let i = 1; i <= numPages; i++) {
            setProgress(Math.round((i / numPages) * 50)); // First 50% is reading
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    };

    const processFile = async (file: File) => {
        try {
            setStatus('reading');
            setError(null);

            let text = '';
            if (file.type === 'application/pdf') {
                text = await extractTextFromPDF(file);
            } else if (file.type.startsWith('image/')) {
                // Image OCR
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                text = await transcribeImage(base64, (p) => setProgress(p / 2));
            } else {
                text = await file.text();
            }

            setStatus('analyzing');
            setProgress(50);

            const result = await parseInvoice(text);

            if (result.error) {
                throw new Error(result.error);
            }
            if (!result.items) {
                throw new Error("Não foi possível identificar transações. Tente um PDF mais claro.");
            }

            // Map to internal items with IDs
            const mappedItems = result.items.map((item: any, index: number) => ({
                id: `inv-${Date.now()}-${index}`,
                date: item.date || new Date().toISOString().split('T')[0],
                description: item.description || "Despesa desconhecida",
                amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount),
                installmentCurrent: item.installmentCurrent,
                installmentTotal: item.installmentTotal
            }));

            setItems(mappedItems);
            setStatus('review');
            setProgress(100);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao processar arquivo");
            setStatus('idle');
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            processFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1
    });

    // --- ITEM MANAGEMENT ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<InvoiceItem>>({});

    const handleEdit = (item: InvoiceItem) => {
        setEditingId(item.id);
        setEditForm({ ...item });
    };

    const handleSaveEdit = () => {
        setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...editForm } as InvoiceItem : i));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    // --- RENDER ---
    if (status === 'review') {
        const total = items.reduce((acc, item) => acc + item.amount, 0);

        return (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-xl max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Revisar Fatura</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Confirme os lançamentos identificados pela IA</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Identificado</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div className="overflow-x-auto mb-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-sky-200 dark:scrollbar-thumb-sky-900 scrollbar-track-transparent pr-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="py-3 px-2">Data</th>
                                <th className="py-3 px-2">Descrição</th>
                                <th className="py-3 px-2 text-right">Valor</th>
                                <th className="py-3 px-2 text-center">Parc.</th>
                                <th className="py-3 px-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {items.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {editingId === item.id ? (
                                        <>
                                            <td className="p-2"><input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 font-bold text-slate-700 dark:text-slate-200" /></td>
                                            <td className="p-2"><input type="text" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 font-medium text-slate-700 dark:text-slate-200" /></td>
                                            <td className="p-2"><input type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 font-bold text-slate-700 dark:text-slate-200" /></td>
                                            <td className="p-2 text-center">
                                                <div className="flex items-center gap-1 justify-center max-w-[100px] mx-auto">
                                                    <input type="number" value={editForm.installmentCurrent || ''} onChange={e => setEditForm({ ...editForm, installmentCurrent: parseInt(e.target.value) })} className="w-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-center text-xs dark:text-slate-200" />
                                                    <span className="dark:text-slate-400">/</span>
                                                    <input type="number" value={editForm.installmentTotal || ''} onChange={e => setEditForm({ ...editForm, installmentTotal: parseInt(e.target.value) })} className="w-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-center text-xs dark:text-slate-200" />
                                                </div>
                                            </td>
                                            <td className="p-2 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={handleSaveEdit} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50"><Save size={14} /></button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"><X size={14} /></button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-2 py-4">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="p-2 font-bold text-slate-700 dark:text-slate-200">{item.description}</td>
                                            <td className="p-2 text-right font-black text-slate-900 dark:text-white">R$ {item.amount.toFixed(2)}</td>
                                            <td className="p-2 text-center">
                                                {item.installmentTotal ? (
                                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full border border-purple-100 dark:border-purple-900/30">
                                                        {item.installmentCurrent}/{item.installmentTotal}
                                                    </span>
                                                ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                            </td>
                                            <td className="p-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(item)} className="p-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors"><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all uppercase text-xs tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(items)}
                        className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all uppercase text-xs tracking-widest flex items-center gap-2"
                    >
                        <CheckCircle size={18} />
                        Confirmar Importação
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-all group cursor-pointer max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden" {...getRootProps()}>
            <input {...getInputProps()} />

            {status === 'reading' || status === 'analyzing' ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-sky-400 blur-xl opacity-20 animate-pulse rounded-full"></div>
                        <Loader2 size={48} className="text-sky-600 animate-spin relative z-10" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">
                            {status === 'reading' ? 'Lendo Arquivo...' : 'Analisando com IA...'}
                        </h3>
                        <div className="w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {status === 'reading' ? 'Extraindo texto do PDF' : 'Identificando transações e parcelas'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 rounded-3xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300">
                        {error ? <AlertCircle size={32} className="text-rose-500 dark:text-rose-400" /> : <Upload size={32} className="text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />}
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                            {error ? "Erro no Upload" : isDragActive ? "Solte o arquivo aqui" : "Clique ou arraste sua fatura"}
                        </h3>
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                            {error ? error : "Suportamos PDF e TXT. A IA irá ler e categorizar tudo automaticamente."}
                        </p>
                    </div>
                    {error && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setStatus('idle'); setError(null); }}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-xs uppercase tracking-widest mt-4"
                        >
                            Tentar Novamente
                        </button>
                    )}

                    <div className="flex gap-4 mt-6" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl cursor-pointer shadow-lg shadow-sky-200 transition-all text-xs tracking-widest uppercase relative z-10 hover:shadow-sky-300">
                            <Camera size={18} />
                            Tirar Foto
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              className="hidden" 
                              onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                      processFile(e.target.files[0]);
                                  }
                              }} 
                            />
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceUploader;
