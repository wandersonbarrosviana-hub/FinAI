
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, Sparkles, MessageSquare, Volume2 } from 'lucide-react';
import { processVoiceAction } from '../localIntelligence';

interface VoiceControlProps {
  onAddTransaction: (result: any) => boolean | void;
}

type VoiceStatus = 'idle' | 'standby' | 'active_command' | 'processing' | 'success' | 'error';

const VoiceControl: React.FC<VoiceControlProps> = ({ onAddTransaction }) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');

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
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setStatus('idle');
    setTranscript('');
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR';
    recognition.continuous = true; // Keep true to allow longer phrases
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus('active_command');
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
        stopListening(); // Stop immediately on final result to process
        processFinalText(finalTranscript);
      }
    };

    recognition.onend = () => {
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

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Erro ao iniciar:", e);
    }
  };


  const processFinalText = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setStatus('processing');
    try {
      const result = await parseVoiceCommand(text);
      console.log("Voice command parsed:", result);

      if (result.intent === 'UNKNOWN') {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const success = onAddTransaction(result);
        if (success !== false) {
          setStatus('success');
          setTimeout(() => {
            setStatus('idle');
            setTranscript('');
          }, 3000);
        } else {
          setStatus('error');
          setTimeout(() => setStatus('idle'), 3000);
        }
      }
    } catch (err) {
      console.error("Erro ao processar comando:", err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className={`bg-white p-5 rounded-[2.5rem] border transition-all duration-500 flex items-center space-x-5 shadow-2xl relative overflow-hidden group ${status === 'standby' ? 'border-amber-200 shadow-amber-100/20' :
      status === 'active_command' ? 'border-sky-300 shadow-sky-200/40 ring-2 ring-sky-100' :
        status === 'processing' ? 'border-indigo-200 shadow-indigo-100' :
          'border-slate-800 shadow-slate-900/10' // Darker default border for contrast
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
          title={status === 'idle' ? 'Ativar escuta' : 'Desativar'}
          className={`p-6 rounded-[2rem] transition-all duration-500 shadow-2xl transform active:scale-95 z-10 relative ${status === 'idle' ? 'bg-slate-800 text-sky-400 hover:bg-slate-700 shadow-cyan-900/20' : // Dark theme button
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
            {status === 'idle' && 'Comando de Voz'}
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
              <span>Toque para ativar o assistente.</span>
            </div>
          ) : (
            <p className={`italic font-medium transition-all max-w-md truncate ${status === 'active_command' ? 'text-sky-600' : 'text-slate-400'
              }`}>
              "{transcript || (status === 'standby' ? 'Aguardando...' : 'Diga algo...')}"
            </p>
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-end pr-4">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${status === 'standby' ? 'bg-amber-50 border-amber-100 text-amber-600' :
          status === 'active_command' ? 'bg-sky-50 border-sky-100 text-sky-600' :
            'bg-slate-100 border-slate-200 text-slate-400'
          }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'standby' ? 'bg-amber-500' :
            status === 'active_command' ? 'bg-sky-500' :
              'bg-slate-400'
            }`}></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {status === 'idle' ? 'Aguardando' : 'Escuta Ativa'}
          </span>
        </div>
        <span className="text-[9px] text-slate-400 mt-1 font-mono uppercase">IA Pronta</span>
      </div>
    </div>
  );
};

export default VoiceControl;
