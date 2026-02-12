import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  Trash2,
  User,
  Loader2,
  Bell,
  CheckCircle,
  XCircle,
  ClipboardPaste
} from 'lucide-react';
import { Transaction, Account } from '../types';
// import { processLocalQuery } from '../localIntelligence'; // Legacy
import { chatWithFinancialAssistant, parseNotification } from '../aiService';

interface FinancialAssistantProps {
  userName: string;
  transactions: Transaction[];
  accounts: Account[];
  goals: any[];
  budgets: any[];
  onAddTransaction: (t: any) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const FinancialAssistant: React.FC<FinancialAssistantProps> = ({
  userName,
  transactions,
  accounts,
  goals,
  budgets,
  onAddTransaction
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá, ${userName}! Sou sua IA Financeira. Posso analisar seus gastos, dar dicas de economia ou **importar notificações** de app de banco.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Notification Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Use Real Gemini AI
      const responseText = await chatWithFinancialAssistant(
        userMsg.content,
        transactions,
        accounts,
        goals,
        budgets
      );

      const assistantMsg: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Desculpe, tive um problema de conexão. Tente novamente.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Chat limpo! Como posso ajudar agora?`,
        timestamp: new Date()
      }
    ]);
  };

  // --- Notification Import Logic ---
  const handleParseNotification = async () => {
    if (!notificationText.trim()) return;
    setIsParsing(true);
    setParsedData(null);

    const result = await parseNotification(notificationText);

    if (result) {
      setParsedData(result);
    } else {
      // Handle error (maybe show strict toast or inline error)
      alert("Não consegui identificar uma transação válida neste texto.");
    }
    setIsParsing(false);
  };

  const confirmImport = () => {
    if (parsedData) {
      onAddTransaction({
        ...parsedData,
        date: parsedData.date || new Date().toISOString().split('T')[0],
        isPaid: true // Assume notifications are for completed transactions generally
      });
      setShowImportModal(false);
      setNotificationText('');
      setParsedData(null);

      // Add success message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **Transação Importada!**\n\n${parsedData.description} - R$ ${parsedData.amount}`,
        timestamp: new Date()
      }]);
    }
  };

  // Quick Actions (Suggestions)
  const suggestions = [
    "Qual meu saldo total?",
    "Analise meus gastos",
    "Dicas de economia",
    "Meta de férias"
  ];

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    // Auto-send logic could go here, but let's let user confirm for now or just trigger.
    // Triggering directly for better UX
    setTimeout(() => {
      // We reuse the logic but need to update state correctly. 
      // Since handleSend relies on 'input' state, checking if we can just call logic.
      // Let's just set input and call a version that takes text.
      // Actually, just append user msg and call AI.
      const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      chatWithFinancialAssistant(text, transactions, accounts, goals, budgets)
        .then(res => {
          setMessages(prev => [...prev, { role: 'assistant', content: res, timestamp: new Date() }]);
        })
        .catch(() => { })
        .finally(() => setIsTyping(false));
    }, 100);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">

      {/* Header */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">FinAI Intelligence</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Gemini Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="p-2 hover:bg-slate-800 rounded-xl text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 bg-cyan-950/30 border border-cyan-500/20"
            title="Importar Notificação"
          >
            <Bell size={16} />
            <span className="text-xs font-bold hidden sm:inline">Importar</span>
          </button>
          <button
            onClick={clearChat}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
            title="Limpar conversa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
              ? 'bg-slate-700 text-slate-300'
              : 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/20'
              }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-slate-800 text-white rounded-tr-none'
              : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none'
              }`}>
              <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              <span className="text-[10px] text-slate-500 block mt-2 opacity-70">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3 animate-in fade-in zoom-in-90">
            <div className="w-8 h-8 rounded-full bg-indigo-900/30 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && !isTyping && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="whitespace-nowrap px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-full text-xs text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-700 ring-1 ring-white/5 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Peça uma análise ou dica..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {/* Import Modal Overlay */}
      {showImportModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative">
            <button
              onClick={() => { setShowImportModal(false); setParsedData(null); setNotificationText(''); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <XCircle size={20} />
            </button>

            <div className="mb-6 text-center">
              <div className="w-12 h-12 bg-cyan-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-cyan-400 border border-cyan-500/20">
                <ClipboardPaste size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Importar Notificação</h3>
              <p className="text-xs text-slate-400 mt-1">Cole o texto do SMS ou notificação do banco</p>
            </div>

            {!parsedData ? (
              <div className="space-y-4">
                <textarea
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  placeholder='Ex: "Compra Aprovada R$ 50,00 Padaria Central..."'
                  className="w-full h-32 bg-slate-950 rounded-xl border border-slate-800 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none resize-none"
                />
                <button
                  onClick={handleParseNotification}
                  disabled={!notificationText.trim() || isParsing}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isParsing ? <Loader2 size={18} className="animate-spin" /> : 'Analisar e Importar'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-bottom-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Valor</span>
                    <span className={`font-bold ${parsedData.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {parsedData.amount?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Descrição</span>
                    <span className="text-white font-medium truncate max-w-[150px]">{parsedData.description}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Categoria</span>
                    <span className="text-cyan-300 bg-cyan-950/30 px-2 py-0.5 rounded text-xs border border-cyan-500/20">
                      {parsedData.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={confirmImport}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Confirmar Importação
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialAssistant;
