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
import { canUseAI } from '../planConstraints';

interface FinancialAssistantProps {
  userName: string;
  transactions: Transaction[];
  accounts: Account[];
  goals: any[];
  budgets: any[];
  onAddTransaction: (t: any) => void;
  userPlan: 'free' | 'premium';
  userRole: string;
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
  onAddTransaction,
  userPlan,
  userRole
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('finai_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error('Error parsing chat history', e);
      }
    }
    return [
      {
        role: 'assistant',
        content: `Olá, ${userName}! Sou sua IA Financeira. Posso analisar seus gastos, dar dicas de economia ou **importar notificações** de app de banco.`,
        timestamp: new Date()
      }
    ];
  });

  useEffect(() => {
    if (userName && userName !== 'undefined') {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].content.includes('IA Financeira')) {
          return [{
            ...prev[0],
            content: `Olá, ${userName}! Sou sua IA Financeira (Powered by Gemini). Posso analisar seus gastos, dar dicas de economia ou **importar notificações**.`
          }];
        }
        return prev;
      });
    }
  }, [userName]);
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
    localStorage.setItem('finai_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check Plan Limits
    const today = new Date().toDateString();
    const dailyCount = messages.filter(m =>
      m.role === 'user' &&
      new Date(m.timestamp).toDateString() === today
    ).length;

    if (userRole !== 'admin' && !canUseAI(userPlan, dailyCount)) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Você atingiu o limite de ${dailyCount} mensagens diárias do plano Gratuito. Faça o upgrade para Premium para ter uma consultoria ilimitada! 🚀`,
        timestamp: new Date()
      }]);
      setInput('');
      return;
    }

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Use Groq AI
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
    <div className="flex flex-col h-[700px] bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative">

      {/* Header */}
      <div className="p-6 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-200">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base tracking-tight">FinAI Intelligence</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-sky-600 font-black uppercase tracking-widest">Google Gemini 1.5 Flash</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="p-2.5 hover:bg-sky-50 rounded-xl text-sky-600 hover:text-sky-700 transition-all flex items-center gap-2 bg-sky-50/50 border border-sky-100"
            title="Importar Notificação"
          >
            <Bell size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Importar</span>
          </button>
          <button
            onClick={clearChat}
            className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
            title="Limpar conversa"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user'
              ? 'bg-sky-600 text-white'
              : 'bg-gradient-to-tr from-sky-50 to-indigo-50 text-sky-600 border border-sky-100'
              }`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>

            <div className={`max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
              ? 'bg-sky-600 text-white rounded-tr-none'
              : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
              <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, msg.role === 'user' ? '<strong class="font-black text-white">$1</strong>' : '<strong class="font-black text-sky-600">$1</strong>') }} />
              <span className={`text-[10px] font-bold block mt-3 uppercase tracking-widest ${msg.role === 'user' ? 'text-sky-100' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-50 to-indigo-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={18} />
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl rounded-tl-none border border-slate-100 flex gap-1.5 shadow-sm">
              <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && !isTyping && (
        <div className="px-6 pb-4 flex gap-3 overflow-x-auto scrollbar-hide">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-black text-sky-600 uppercase tracking-widest hover:bg-sky-50 hover:border-sky-300 transition-all shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:ring-4 focus-within:ring-sky-500/5 focus-within:border-sky-500/30 focus-within:bg-white transition-all shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Peça uma análise ou dica..."
            className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-700 font-medium placeholder:text-slate-300 outline-none"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-xl shadow-sky-100 active:scale-95"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>

      {/* Import Modal Overlay */}
      {showImportModal && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative ring-1 ring-black/5">
            <button
              onClick={() => { setShowImportModal(false); setParsedData(null); setNotificationText(''); }}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
            >
              <XCircle size={24} />
            </button>

            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-sky-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-sky-600 border border-sky-100 shadow-sm">
                <ClipboardPaste size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Importar Notificação</h3>
              <p className="text-sm font-medium text-slate-500 mt-2">Cole o texto do SMS ou notificação do banco</p>
            </div>

            {!parsedData ? (
              <div className="space-y-6">
                <textarea
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  placeholder='Ex: "Compra Aprovada R$ 50,00 Padaria Central..."'
                  className="w-full h-40 bg-slate-50 rounded-[2rem] border border-slate-200 p-6 text-sm text-slate-700 font-medium placeholder:text-slate-300 focus:bg-white focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 outline-none resize-none transition-all shadow-inner"
                />
                <button
                  onClick={handleParseNotification}
                  disabled={!notificationText.trim() || isParsing}
                  className="w-full py-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-3"
                >
                  {isParsing ? <Loader2 size={20} className="animate-spin" /> : <><Sparkles size={20} /> Analisar e Importar</>}
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Valor</span>
                    <span className={`text-2xl font-black ${parsedData.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      R$ {parsedData.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Descrição</span>
                    <span className="text-slate-900 font-black truncate max-w-[200px]">{parsedData.description}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Categoria</span>
                    <span className="text-sky-600 bg-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100 shadow-sm">
                      {parsedData.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={confirmImport}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                >
                  <CheckCircle size={20} />
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
