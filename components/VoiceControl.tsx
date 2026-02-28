
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, Sparkles, Volume2, Power } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const shouldStartActiveRef = useRef(true);

  // Sync ref with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isListeningModeRef.current = isListeningMode;
    console.log("[Voice] isListeningMode changed:", isListeningMode);
    if (isListeningMode) {
      if (status === 'idle') {
        console.log("[Voice] Starting listening from effect...");
        startListening(shouldStartActiveRef.current);
      }
    } else {
      console.log("[Voice] Stopping listening from effect...");
      stopListening();
    }
  }, [isListeningMode]);

  const handleInteraction = () => {
    console.log("[Voice] Button clicked. Mode:", isListeningMode, "Status:", status);
    if (!isListeningMode) {
      // Turn ON - Start Active
      shouldStartActiveRef.current = true;
      setIsListeningMode(true);
    } else {
      // Already ON
      if (status === 'standby') {
        // Force Wake
        setStatus('active_command');
        // Audio feedback could be nice here
      } else if (status === 'active_command' || status === 'idle') { // added idle just in case
        // Manual Submit / Stop
        if (transcript.length > 2) {
          stopListening();
          processFinalText(transcript);
        } else {
          // Cancel/Toggle Off if empty
          setIsListeningMode(false);
        }
      } else {
        // processing/success/error -> Toggle Off
        setIsListeningMode(false);
      }
    }
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
      setStatus(shouldStartActiveRef.current ? 'active_command' : 'standby');
      shouldStartActiveRef.current = false; // Reset for next loop
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
      if (currentText.length > 0) setTranscript(currentText);

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
        if (silenceTimer.current) clearTimeout(silenceTimer.current);

        silenceTimer.current = setTimeout(() => {
          console.log("Silence detected (1.5s). Processing command...");
          const cleanCommand = currentText.replace(/^(oi|olá|ei)?\s*fini\s*/i, '').trim();

          // Security: limit command length
          const safeCommand = cleanCommand.slice(0, 500);

          if (safeCommand.length > 2) {
            stopListening();
            processFinalText(safeCommand);
          } else {
            console.log("Command too short to process:", safeCommand);
          }
        }, 1500);
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
        alert("Permissão de microfone negada! \n\nPor favor, clique no ícone de cadeado na barra de endereço e permita o uso do microfone.");
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
      alert("Erro ao iniciar reconhecimento de voz: " + e);
      setIsListeningMode(false);
    }
  };

  const processFinalText = async (text: string) => {
    console.log("Starting processFinalText with:", text);
    setTranscript(text); // Keep text visible
    setStatus('processing');
    try {
      const { parseVoiceCommand } = await import('../aiService');
      const result = await parseVoiceCommand(text);
      console.log("AI Parse Result:", result);

      if (result.intent === 'UNKNOWN') {
        console.warn("Intent UNKNOWN");
        setStatus('error');
      } else {
        console.log("Executing onAddTransaction...");
        const success = onAddTransaction(result);
        console.log("onAddTransaction result:", success);
        setStatus(success !== false ? 'success' : 'error');
      }
    } catch (err) {
      console.error("Error in processFinalText:", err);
      setStatus('error');
    }

    // After processing, reset to standby loop
    // After processing, reset to standby loop
    setTimeout(() => {
      // Automatically turn off after processing (One-shot mode)
      setIsListeningMode(false);
      setStatus('idle');
      setTranscript('');
    }, 2500);
  };

  return (
    <motion.div 
      drag
      dragMomentum={false}
      dragElastic={0.1}
      className="fixed bottom-24 right-4 z-50 flex flex-col items-end pointer-events-auto pb-safe"
      style={{ touchAction: 'none' }}
    >

      {/* Transcript Bubble Feedback */}
      {(status === 'active_command' || status === 'processing' || (status === 'standby' && transcript)) && (
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200 mb-2 max-w-[200px] pointer-events-auto animate-in slide-in-from-right-10 fade-in duration-300">
          <p className="text-sm font-medium text-slate-600 truncate">
            {status === 'processing' ? "Processando..." : (status === 'active_command' && !transcript ? "Ouvindo..." : `"${transcript}"`)}
          </p>
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={handleInteraction}
        className={`p-4 rounded-full shadow-2xl transition-all duration-500 relative overflow-hidden group flex items-center justify-center ${!isListeningMode ? 'bg-slate-900 text-white w-14 h-14' : // OFF
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
    </motion.div>
  );
};

export default VoiceControl;
