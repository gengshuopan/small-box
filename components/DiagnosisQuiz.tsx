
import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface DiagnosisQuizProps {
  questions: QuizQuestion[];
  onComplete: (results: Record<string, boolean>) => void;
  isSubmitting: boolean;
}

const DiagnosisQuiz: React.FC<DiagnosisQuizProps> = ({ questions, onComplete, isSubmitting }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // questionId -> selectedOptionIndex

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleOptionSelect = (optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIndex
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate results
      const results: Record<string, boolean> = {};
      questions.forEach(q => {
        const selected = answers[q.id];
        results[q.id] = selected === q.correctIndex;
      });
      onComplete(results);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const isCurrentAnswered = answers[currentQ.id] !== undefined;

  const difficultyMap: Record<string, { label: string, color: string }> = {
    easy: { label: '简单', color: 'bg-emerald-100 text-emerald-700' },
    medium: { label: '中等', color: 'bg-amber-100 text-amber-700' },
    hard: { label: '困难', color: 'bg-rose-100 text-rose-700' },
  };

  const difficultyInfo = difficultyMap[currentQ.difficulty || 'medium'];

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 border border-slate-100 overflow-hidden flex flex-col min-h-[550px] animate-fade-in-up">
      {/* Header with Progress */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">学情诊断测试</h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">请认真作答，AI将为您生成详细分析</p>
            </div>
            <div className="text-3xl font-bold text-indigo-400 tracking-tighter">
              {currentIndex + 1}<span className="text-lg text-slate-600 font-medium opacity-60">/{questions.length}</span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-8 flex-1 flex flex-col bg-white">
        <div className="mb-6 flex gap-3">
           <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-bold uppercase tracking-wider">
             {currentQ.knowledgePoint || "综合测试"}
           </span>
           <span className={`inline-flex items-center px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${difficultyInfo.color}`}>
             {difficultyInfo.label}
           </span>
        </div>
        
        <h3 className="text-xl sm:text-2xl text-slate-800 font-bold leading-relaxed mb-8">
          {currentQ.question}
        </h3>

        <div className="space-y-3 flex-1">
          {currentQ.options.map((option, idx) => {
            const isSelected = answers[currentQ.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`
                  w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-md ring-1 ring-indigo-500/20' 
                    : 'border-slate-100 bg-white hover:border-indigo-300 hover:bg-slate-50 text-slate-600 hover:shadow-sm hover:-translate-y-0.5'}
                `}
              >
                <div className="flex items-center">
                  <span className={`
                    w-8 h-8 rounded-lg flex items-center justify-center mr-4 text-sm font-bold border-2 transition-colors
                    ${isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-500'}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`font-medium text-base sm:text-lg ${isSelected ? 'font-bold' : ''}`}>{option}</span>
                </div>
                {isSelected && <CheckCircle2 className="text-indigo-600 animate-scale-in" size={22} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!isCurrentAnswered || isSubmitting}
          className={`
            flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300
            ${!isCurrentAnswered || isSubmitting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0'}
          `}
        >
          {isSubmitting ? (
             <span className="flex items-center gap-2">
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               正在分析...
             </span>
          ) : (
             <>
               {isLastQuestion ? '提交试卷' : '下一题'}
               {!isLastQuestion && <ArrowRight size={20} />}
             </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DiagnosisQuiz;
