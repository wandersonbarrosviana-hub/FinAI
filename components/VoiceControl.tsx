
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, Sparkles, Volume2, Power } from 'lucide-react';

interface VoiceControlProps {
  onAddTransaction: (result: any) => boolean | void;
}

type VoiceStatus = 'idle' | 'standby' | 'active_command' | 'processing' | 'success' | 'error';

const VoiceControl: React.FC<VoiceControlProps> = ({ onAddTransaction }) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  // Tentar iniciar ATIVADO por padrão
  const [isListeningMode, setIsListeningMode] = useState(false);

  // Refs to avoid obsolete closures
  const statusRef = useRef<VoiceStatus>('idle');
  const recognitionRef = useRef<any>(null);
  const isListeningModeRef = useRef(true); // Sync with default state
  const silenceTimer = useRef<any>(null);

  // Sync ref with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isListeningModeRef.current = isListeningMode;
    if (isListeningMode) {
      // Tentar iniciar imediatamente (pode falhar sem interação prévia dependendo do browser)
      if (status === 'idle') startListening();
    } else {
      stopListening();
    }
  }, [isListeningMode]);

  const toggleListeningMode = () => {
    setIsListeningMode(!isListeningMode);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent restart loop
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setStatus('idle');
    setTranscript('');
  };

  const startListening = (forceCommand = false) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Navegador incompatível. Use Chrome.');
      return;
    }
    if (recognitionRef.current) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR';
    recognition.continuous = true; // Changed to true to keep listening until silence
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus(forceCommand ? 'active_command' : 'standby');
    };

    recognition.onresult = (event: any) => {
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

      const currentText = (interimTranscript || finalTranscript).toLowerCase();

      // Update transcript only if it's significant
      if (currentText.length > 2) setTranscript(currentText);

      // WAKE WORD DETECTION
      if (statusRef.current === 'standby') {
        const wakeWordRegex = /(oi|olá|ei)?\s*fini/i;
        if (wakeWordRegex.test(currentText)) {
          setStatus('active_command');
          setTranscript(''); // Clear buffer for clean command
        }
      }

      // SILENCE DETECTION FOR ACTIVE COMMAND
      if (statusRef.current === 'active_command') {
        // Clear existing timer
        if (silenceTimer.current) clearTimeout(silenceTimer.current);

        // Set new timer (e.g. 2 seconds silence)
        silenceTimer.current = setTimeout(() => {
          const cleanCommand = currentText.replace(/^(oi|olá|ei)?\s*fini\s*/i, '').trim();

          if (cleanCommand.length > 2) {
            stopListening();
            processFinalText(cleanCommand);
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (silenceTimer.current) clearTimeout(silenceTimer.current);

      // RESTART LOOP
      if (isListeningModeRef.current) {
        if (statusRef.current === 'processing') return;

        // Return to standby loops
        if (statusRef.current === 'active_command') {
          setStatus('standby');
          startListening();
        } else {
          startListening();
        }
      } else {
        setStatus('idle');
      }
    };

    recognition.onerror = (event: any) => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);

      if (event.error === 'no-speech') {
        // Ignore
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListeningMode(false);
        setStatus('idle');
        alert("Para usar o 'Oi Fini', você precisa permitir o microfone.");
      } else if (event.error !== 'aborted') {
        setTimeout(() => {
          if (isListeningModeRef.current) startListening();
        }, 1000);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Start error:", e);
      setIsListeningMode(false);
    }
  };

  const processFinalText = async (text: string) => {
    setStatus('processing');
    try {
      const { parseVoiceCommand } = await import('../aiService');
      const result = await parseVoiceCommand(text);

      if (result.intent === 'UNKNOWN') {
        setStatus('error');
      } else {
        const success = onAddTransaction(result);
        setStatus(success !== false ? 'success' : 'error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }

    // After processing, reset to standby loop
    setTimeout(() => {
      if (isListeningModeRef.current) {
        setTranscript('');
        startListening(); // Restart loop
      } else {
        setStatus('idle');
      }
    }, 2500);
  };

  return (
    <div className={`fixed bottom-24 right-4 z-50 flex flex-col items-end pointer-events-none`}>

      {/* Transcript Bubble Feedback */}
      {(status === 'active_command' || status === 'processing' || (status === 'standby' && transcript)) && (
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200 mb-2 max-w-[200px] pointer-events-auto animate-in slide-in-from-right-10 fade-in duration-300">
          <p className="text-sm font-medium text-slate-600 truncate">
            {status === 'active_command' && !transcript ? "Ouvindo..." : `"${transcript}"`}
          </p>
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={toggleListeningMode}
        className={`p-4 rounded-full shadow-2xl transition-all duration-500 relative overflow-hidden group active:scale-95 flex items-center justify-center pointer-events-auto ${!isListeningMode ? 'bg-slate-900 text-white w-14 h-14' : // OFF
          status === 'standby' ? 'bg-sky-600 text-white w-16 h-16 ring-4 ring-sky-200 shadow-sky-400/50' : // ON - Waiting
            status === 'active_command' ? 'bg-sky-500 text-white w-16 h-16 animate-pulse ring-4 ring-sky-300' : // ON - Hearing
              status === 'processing' ? 'bg-indigo-600 text-white w-16 h-16' :
                status === 'success' ? 'bg-emerald-500 text-white w-14 h-14' :
                  'bg-rose-500 text-white w-14 h-14'
          }`}
      >
        {/* Visual Icons */}
        {!isListeningMode && <MicOff size={24} />}

        {isListeningMode && status === 'standby' && (
          <div className="relative">
            <Mic size={28} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-300"></span>
            </span>
          </div>
        )}

        {status === 'active_command' && <Sparkles size={28} className="animate-spin-slow" />}
        {status === 'processing' && <Loader2 size={28} className="animate-spin" />}
        {status === 'success' && <CheckCircle size={28} />}
        {status === 'error' && <AlertCircle size={28} />}
      </button>

      {/* Helper Label */}
      {!isListeningMode && (
        <div className="mt-2 pointer-events-auto">
          <span className="text-[10px] font-bold text-slate-400 bg-white/90 px-2 py-1 rounded-md shadow-sm border border-slate-100">
            Toque para ativar o "Oi Fini"
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceControl;
