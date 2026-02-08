import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, Sparkles, MessageSquare, Volume2 } from 'lucide-react';
import { parseVoiceCommand } from '../geminiService';

interface VoiceControlProps {
  onAddTransaction: (result: any) => boolean | void;
}

type VoiceStatus = 'idle' | 'standby' | 'active_command' | 'processing' | 'success' | 'error';

const VoiceControl: React.FC<VoiceControlProps> = ({ onAddTransaction }) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  // Removed duplicates

  // Refs to avoid obsolete closures in SpeechRecognition callbacks
  const statusRef = useRef<VoiceStatus>('idle');
  const recognitionRef = useRef<any>(null);

  // Sync ref with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const toggleListening = () => {
    if (statusRef.current !== 'idle') {
      stopListening();
    } else {
      startListening();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Remove auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setStatus('idle');
    setTranscript('');
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR';
    recognition.continuous = false; // Stop after one command usually? Or keep listening? User said "ao clicar e solicitar ele ja cumpra". Implies one command. But let's keep continuous for safety and manual stop, or stop on silence. 
    // Actually, "continuous = false" is better for single command. Let's try false to auto-stop on silence?
    // User might pause. Let's keep continuous = true but manually stop after processing.
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus('active_command'); // Immediate active
    };

    recognition.onresult = async (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += result;
        } else {
          interimTranscript += result;
        }
      }

      setTranscript(interimTranscript || finalTranscript);

      // Directly process final text
      if (finalTranscript && statusRef.current === 'active_command') {
        // Debounce or just take it?
        // If continuous is true, we might get multiple finals.
        // We should probably stop listening after one command to "cumprir a ordem".
        stopListening(); // Stop immediately on final result to process
        processFinalText(finalTranscript);
      }
    };

    recognition.onend = () => {
      // No auto-restart if we want one-shot, or restart if we want to keep listening?
      // "ao clicar ... cumpra". Implies interaction.
      // If we stopped manually in onresult, status should be 'processing' or 'idle' soon.
      // If error or silence, we might want to go to idle.
      if (statusRef.current === 'active_command') {
        setStatus('idle');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // Removed activateFini


  const processFinalText = async (text: string) => {
    // No wake word cleanup needed, but keeping trim
    const cleanText = text.trim();
    if (!cleanText) return;

    setStatus('processing');
    try {
      const result = await parseVoiceCommand(text); // Use the real Gemini service
      console.log("Voice command parsed:", result);

      if (result.intent === 'UNKNOWN') {
        setStatus('error');
        setTimeout(() => setStatus('standby'), 3000); // Go back to standby
      } else {
        const success = onAddTransaction(result);
        if (success !== false) {
          setStatus('success');
          setTimeout(() => {
            setStatus('standby');
            setTranscript('');
          }, 3000);
        } else {
          setStatus('error');
          setTimeout(() => setStatus('standby'), 3000);
        }
      }
    } catch (err) {
      console.error("Erro ao processar comando:", err);
      setStatus('error');
      setTimeout(() => setStatus('standby'), 3000);
    }
  };

  return (
    <div className={`bg-white p-5 rounded-[2.5rem] border transition-all duration-500 flex items-center space-x-5 shadow-2xl relative overflow-hidden group ${status === 'standby' ? 'border-amber-200 shadow-amber-100/20' :
      status === 'active_command' ? 'border-sky-300 shadow-sky-200/40 ring-2 ring-sky-100' :
        status === 'processing' ? 'border-indigo-200 shadow-indigo-100' :
          'border-slate-100 shadow-slate-200/30'
      }`}>

      {/* Layers of background glow */}
      {status === 'standby' && (
        <div className="absolute inset-0 bg-amber-500/5 animate-pulse pointer-events-none"></div>
      )}
      {status === 'active_command' && (
        <div className="absolute inset-0 bg-sky-500/10 animate-pulse pointer-events-none"></div>
      )}

      <div className="relative">
        <button
          onClick={toggleListening}
          title={status === 'idle' ? 'Ativar escuta da Fini' : 'Desativar'}
          className={`p-6 rounded-[2rem] transition-all duration-500 shadow-2xl transform active:scale-95 z-10 relative ${status === 'idle' ? 'bg-slate-200 text-slate-500 hover:bg-slate-300' :
            status === 'standby' ? 'bg-amber-500 text-white shadow-amber-200 ring-4 ring-amber-50' :
              status === 'active_command' ? 'bg-sky-600 text-white animate-bounce shadow-sky-300 ring-4 ring-sky-100' :
                status === 'processing' ? 'bg-indigo-600 text-white' :
                  status === 'success' ? 'bg-emerald-500 text-white' :
                    'bg-rose-500 text-white'
            }`}
        >
          {status === 'idle' && <Mic size={28} />}
          {status === 'standby' && <Volume2 size={28} className="animate-pulse" />}
          {status === 'active_command' && <Sparkles size={28} />}
          {status === 'processing' && <Loader2 size={28} className="animate-spin" />}
          {status === 'success' && <CheckCircle size={28} />}
          {status === 'error' && <AlertCircle size={28} />}
        </button>

        {status === 'standby' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-ping"></div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <span className={`text-base font-black tracking-tight transition-colors duration-300 ${status === 'active_command' ? 'text-sky-800' :
            'text-slate-800'
            }`}>
            {status === 'idle' && 'Toque para Falar'}
            {status === 'active_command' && 'Ouvindo...'}
            {status === 'processing' && 'Processando...'}
            {status === 'success' && 'Feito!'}
            {status === 'error' && 'Não entendi.'}
          </span>
        </div>

        <div className="mt-1 flex items-center text-sm">
          {status === 'idle' ? (
            <div className="text-slate-400 font-medium flex items-center gap-2">
              <MessageSquare size={14} className="text-slate-300" />
              <span>Clique para ligar o microfone e usar a Wake Word.</span>
            </div>
          ) : (
            <p className={`italic font-medium transition-all max-w-md truncate ${status === 'active_command' ? 'text-sky-600' : 'text-slate-400'
              }`}>
              "{transcript || (status === 'standby' ? 'Estou atenta...' : 'Diga algo...')}"
            </p>
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-end pr-4">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${status === 'standby' ? 'bg-amber-50 border-amber-100 text-amber-600' :
          status === 'active_command' ? 'bg-sky-50 border-sky-100 text-sky-600' :
            'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'standby' ? 'bg-amber-500' :
            status === 'active_command' ? 'bg-sky-500' :
              'bg-slate-300'
            }`}></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {status === 'idle' ? 'Offline' : 'Escuta Ativa'}
          </span>
        </div>
        <span className="text-[9px] text-slate-300 mt-1 font-mono uppercase">Gatilho: "Oi Fini"</span>
      </div>
    </div>
  );
};

export default VoiceControl;
