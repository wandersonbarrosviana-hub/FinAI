
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  Trash2,
  User,
  Loader2,
  CreditCard,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { Transaction, Account } from '../types';
import { processLocalQuery } from '../localIntelligence';

interface FinancialAssistantProps {
  userName: string;
  transactions: Transaction[];
  accounts: Account[];
  goals: any[];
  budgets: any[];
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
  budgets
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá, ${userName}! Sou sua Assistente Virtual. Posso te ajudar com saldos, resumos e dúvidas sobre suas finanças.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

    // Simulate thinking delay for natural feel
    setTimeout(() => {
      const response = processLocalQuery(userMsg.content, transactions, accounts);

      const assistantMsg: Message = {
        role: 'assistant',
        content: response.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1000);
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

  // Quick Actions (Suggestions)
  const suggestions = [
    "Qual meu saldo?",
    "Resumo do mês",
    "Gasto com Alimentação",
    "Minhas Receitas"
  ];

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    // Optional: Auto send? Let's just fill input for now or auto send.
    // Better UX: Auto send.
    // But we need to update state, so let's call logic directly conceptually but clean implementation needs state update first.
    // simpler to just set input and let user press enter, OR refactor handleSend to take arg.
    // Let's refactor handleSend slightly or just mimic it.

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setTimeout(() => {
      const response = processLocalQuery(text, transactions, accounts);
      setMessages(prev => [...prev, { role: 'assistant', content: response.text, timestamp: new Date() }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Assistente Virtual</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
          title="Limpar conversa"
        >
          <Trash2 size={18} />
        </button>
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
                : 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/20'
              }`}>
              {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
            </div>

            <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
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
            <div className="w-8 h-8 rounded-full bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex gap-1">
              <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (Only if chat is empty or short) */}
      {messages.length < 3 && !isTyping && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="whitespace-nowrap px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-full text-xs text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-700 ring-1 ring-white/5 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre seus gastos..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white rounded-xl transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialAssistant;
