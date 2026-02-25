
import React, { useState } from 'react';
import { X, Brain, CheckCircle2, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface FinancialQuizProps {
    userId: string;
    onClose: () => void;
    onComplete: () => void;
}

const QUESTIONS = [
    { id: 'q1', text: 'Com que frequência você sente ansiedade ao pensar nos seus boletos ou gastos?', weight: -1 },
    { id: 'q2', text: 'Você costuma comprar coisas por impulso quando está estressado(a)?', weight: -1 },
    { id: 'q3', text: 'Quão confiante você se sente em relação ao seu planejamento para a aposentadoria?', weight: 1 },
    { id: 'q4', text: 'Você sente que tem controle total sobre seu fluxo de caixa mensal?', weight: 1 },
    { id: 'q5', text: 'Com que frequência você revisa seus investimentos ou metas financeiras?', weight: 1 },
    { id: 'q6', text: 'Você se sente confortável em dizer "não" para gastos sociais que não cabem no orçamento?', weight: 1 },
];

const FinancialQuiz: React.FC<FinancialQuizProps> = ({ userId, onClose, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);

    const currentQuestion = QUESTIONS[currentStep];

    const handleSelect = (value: number) => {
        setAnswers({ ...answers, [currentQuestion.id]: value });
    };

    const handleNext = () => {
        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        const currentMonth = new Date().toISOString().slice(0, 7);
        try {
            const { error } = await supabase
                .from('financial_quiz_responses')
                .upsert({
                    user_id: userId,
                    responses: answers,
                    month: currentMonth
                }, { onConflict: 'user_id, month' });

            if (error) throw error;
            onComplete();
            onClose();
        } catch (err) {
            console.error('Erro ao salvar quiz:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden relative animate-in zoom-in-95 duration-500">

                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-center text-center">
                    <div className="w-10"></div>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 mb-4 shadow-sm">
                            <Brain size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Psicologia Financeira</h3>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Question Area */}
                <div className="p-8 pt-4">
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Questão {currentStep + 1} de {QUESTIONS.length}</span>
                            <span className="text-xs font-bold text-slate-400">{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="min-h-[120px] mb-8">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                            {currentQuestion.text}
                        </h4>
                    </div>

                    <div className="flex justify-between items-center gap-2 mb-10">
                        {[1, 2, 3, 4, 5].map((val) => (
                            <button
                                key={val}
                                onClick={() => handleSelect(val)}
                                className={`w-full py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${answers[currentQuestion.id] === val
                                        ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100'
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-purple-200'
                                    }`}
                            >
                                <span className="text-sm font-black">{val}</span>
                                <span className="text-[8px] font-bold uppercase opacity-60">
                                    {val === 1 ? 'Nunca' : val === 5 ? 'Sempre' : ''}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            disabled={currentStep === 0}
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="flex-1 py-4 px-6 rounded-2xl border border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronLeft size={16} />
                            Anterior
                        </button>
                        <button
                            disabled={!answers[currentQuestion.id] || isSaving}
                            onClick={handleNext}
                            className="flex-[2] py-4 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-30 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 dark:shadow-none"
                        >
                            {currentStep === QUESTIONS.length - 1 ? (isSaving ? 'Salvando...' : 'Finalizar') : 'Próxima'}
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3 justify-center">
                    <HelpCircle size={14} className="text-slate-400" />
                    <p className="text-[10px] font-medium text-slate-400">Suas respostas são privadas e usadas apenas para calcular sua maturidade.</p>
                </div>
            </div>
        </div>
    );
};

export default FinancialQuiz;
