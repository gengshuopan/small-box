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
        // If question has a knowledge point, key it by ID or handle logic in parent. 
        // Here we just pass back if it was correct.
        results[q.id] = selected === q.correctIndex;
      });
      onComplete(results);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const isCurrentAnswered = answers[currentQ.id] !== undefined;

  const difficultyMap: Record<string, { label: string, color: string }> = {
    easy: { label: '简单', color: 'bg-green-100 text-green-700' },
    medium: { label: '中等', color: 'bg-yellow-100 text-yellow-700' },
    hard: { label: '困难', color: 'bg-red-100 text-red-700' },
  };

  const difficultyInfo = difficultyMap[currentQ.difficulty || 'medium'];

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
      {/* Header with Progress */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl font-bold">学情诊断测试</h2>
            <p className="text-slate-400 text-sm mt-1">请认真作答，AI将根据结果生成分析报告</p>
          </div>
          <div className="text-2xl font-bold text-indigo-400">
            {currentIndex + 1}<span className="text-lg text-slate-500 font-normal">/{questions.length}</span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="p-8 flex-1 flex flex-col">
        <div className="mb-4 flex gap-2">
           <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
             {currentQ.knowledgePoint || "综合测试"}
           </span>
           <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${difficultyInfo.color}`}>
             {difficultyInfo.label}
           </span>
        </div>
        
        <h3 className="text-xl text-slate-800 font-medium leading-relaxed mb-8">
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
                  w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm' 
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-600'}
                `}
              >
                <div className="flex items-center">
                  <span className={`
                    w-8 h-8 rounded-full flex items-center justify-center mr-4 text-sm font-bold border transition-colors
                    ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300 text-slate-400'}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>
                {isSelected && <CheckCircle2 className="text-indigo-600" size={20} />}
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
            flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
            ${!isCurrentAnswered || isSubmitting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5'}
          `}
        >
          {isSubmitting ? (
             <span className="flex items-center gap-2">
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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