
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Bot, User, Loader2, Sparkles, TrendingUp, ShieldCheck,
  Zap, PieChart, BarChart3, Calculator, Info, RotateCcw, ZapOff
} from 'lucide-react';
import { chatWithFinancialAssistant, performDeepAnalysis } from '../geminiService';
import { Transaction, Account, Goal, Budget } from '../types';

interface FinancialAssistantProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  budgets: Budget[];
}

interface Message {
  role: 'ai' | 'user';
  text: string;
  isAnalysis?: boolean;
  isFromCache?: boolean;
}

const FinancialAssistant: React.FC<FinancialAssistantProps> = ({ transactions, accounts, goals, budgets }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Olá! A assistência por IA está temporariamente desativada.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cache persistente durante a sessão do componente
  const responseCache = useRef<Record<string, string>>({});

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    if (!customPrompt) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);

    setIsLoading(true);

    try {
      // Check Cache
      if (responseCache.current[textToSend]) {
        setMessages(prev => [...prev, { role: 'ai', text: responseCache.current[textToSend], isFromCache: true }]);
        setIsLoading(false);
        return;
      }

      const response = await chatWithFinancialAssistant(textToSend, transactions, accounts, goals, budgets);

      responseCache.current[textToSend] = response;
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setIsLoading(false);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Desculpe, tive um problema ao processar sua solicitação.' }]);
      setIsLoading(false);
    }
  };

  const runFullAnalysis = async () => {
    setMessages(prev => [...prev, { role: 'user', text: 'Gere um relatório completo de saúde financeira.' }]);
    setIsLoading(true);
    const response = await performDeepAnalysis(transactions, accounts, goals);
    setMessages(prev => [...prev, { role: 'ai', text: response, isAnalysis: true }]);
    setIsLoading(false);
  };

  const clearCache = () => {
    responseCache.current = {};
    setMessages(prev => [...prev, { role: 'ai', text: 'Cache de conversas limpo com sucesso. Próximas perguntas serão processadas em tempo real.' }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white rounded-3xl shadow-xl shadow-sky-100/50 border border-sky-100 overflow-hidden">
      {/* Header with Tools */}
      <div className="p-6 border-b border-sky-50 bg-gradient-to-r from-sky-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-600 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-200">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-lg leading-tight">FinAI Intelligence</h2>
            <div className="flex items-center text-[10px] text-sky-600 font-bold uppercase tracking-wider mt-0.5">
              <Sparkles size={10} className="mr-1" /> Gemini 3 Pro + Cache Ativo
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={runFullAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white border border-sky-200 text-sky-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-all shadow-sm"
          >
            <ShieldCheck size={14} /> Análise de Saúde
          </button>
          <button
            onClick={() => handleSend("Qual minha projeção de patrimônio para 5 anos?")}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white border border-sky-200 text-sky-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-all shadow-sm"
          >
            <Calculator size={14} /> Projeção Patrimonial
          </button>
          <button
            onClick={clearCache}
            title="Limpar cache de respostas"
            className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`p-2 rounded-xl flex-shrink-0 shadow-sm ${m.role === 'user' ? 'bg-sky-600 text-white' : 'bg-white text-sky-600 border border-sky-100'}`}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm relative ${m.role === 'user'
                ? 'bg-sky-600 text-white rounded-tr-none'
                : m.isAnalysis
                  ? 'bg-white text-slate-700 border-2 border-sky-200 rounded-tl-none prose prose-sky max-w-none'
                  : 'bg-white text-slate-700 border border-sky-100 rounded-tl-none'
                }`}>
                {m.text.split('\n').map((line, idx) => (
                  <p key={idx} className={line.trim() === '' ? 'h-2' : 'mb-2'}>
                    {line.startsWith('#') ? <strong className="text-sky-800 text-base">{line.replace(/#/g, '')}</strong> : line}
                  </p>
                ))}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-sky-50">
                  {m.isAnalysis ? (
                    <div className="flex items-center text-[10px] text-slate-400 font-medium italic">
                      <Info size={10} className="mr-1" /> Validar com profissional.
                    </div>
                  ) : <div />}

                  {m.isFromCache && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full text-[9px] font-black uppercase tracking-tighter">
                      <Zap size={10} /> Instantâneo via Cache
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3 max-w-[80%]">
              <div className="p-2 rounded-xl bg-white text-sky-600 border border-sky-100 animate-spin">
                <Loader2 size={20} />
              </div>
              <div className="p-5 rounded-2xl text-sm bg-white text-slate-400 border border-sky-50 animate-pulse shadow-sm italic">
                A IA está processando seus dados em tempo real...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-6 border-t border-sky-50 bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ex: Qual será meu patrimônio em 10 anos?"
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-700 placeholder:text-slate-400 font-medium"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-2.5 p-2.5 bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all disabled:opacity-50 disabled:shadow-none transform active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialAssistant;
