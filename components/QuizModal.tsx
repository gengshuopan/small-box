
import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle, XCircle, ChevronRight, X, AlertCircle } from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  topic: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, questions, topic }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return; // Prevent changing answer
    setSelectedOption(index);
    setShowExplanation(true);
    if (index === currentQ.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onClose();
      // Reset for next time (in a real app, we might save this state differently)
      setTimeout(() => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setScore(0);
      }, 300);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const difficultyMap: Record<string, { label: string, color: string }> = {
    easy: { label: '简单', color: 'bg-emerald-100 text-emerald-700' },
    medium: { label: '中等', color: 'bg-amber-100 text-amber-700' },
    hard: { label: '困难', color: 'bg-rose-100 text-rose-700' },
  };

  const difficultyInfo = difficultyMap[currentQ.difficulty || 'medium'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10 animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 sm:p-6 text-white flex justify-between items-center border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
               专项训练
               <span className="text-slate-500 font-normal">|</span>
               <span className="text-indigo-300">{topic}</span>
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-100">
          <div 
             className="h-full bg-indigo-500 transition-all duration-300"
             style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
          <div className="flex justify-between items-start mb-6">
             <span className={`inline-flex px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${difficultyInfo.color}`}>
               {difficultyInfo.label}
             </span>
             <span className="text-sm font-bold text-slate-400">
               第 {currentIndex + 1} / {questions.length} 题
             </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              let btnClass = "w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ";
              let circleClass = "w-8 h-8 rounded-lg flex items-center justify-center mr-4 text-sm font-bold border-2 transition-colors ";
              
              if (selectedOption === null) {
                btnClass += "border-slate-100 bg-white hover:border-indigo-300 hover:bg-slate-50 hover:shadow-sm";
                circleClass += "bg-white border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-500";
              } else {
                if (idx === currentQ.correctIndex) {
                  btnClass += "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm";
                  circleClass += "bg-emerald-500 border-emerald-500 text-white";
                } else if (idx === selectedOption) {
                  btnClass += "border-rose-500 bg-rose-50 text-rose-900 shadow-sm";
                  circleClass += "bg-rose-500 border-rose-500 text-white";
                } else {
                  btnClass += "border-slate-100 opacity-50";
                  circleClass += "bg-white border-slate-200 text-slate-300";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  className={btnClass}
                  disabled={selectedOption !== null}
                >
                  <div className="flex items-center">
                    <span className={circleClass}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-lg">{option}</span>
                  </div>
                  
                  {selectedOption !== null && idx === currentQ.correctIndex && (
                    <CheckCircle className="text-emerald-600 animate-scale-in" size={24} />
                  )}
                  {selectedOption !== null && idx === selectedOption && idx !== currentQ.correctIndex && (
                    <XCircle className="text-rose-600 animate-scale-in" size={24} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in">
              <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold">
                <AlertCircle size={20} className="text-indigo-500" />
                解析
              </div>
              <p className="text-slate-600 leading-relaxed text-base">{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className={`
              flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all duration-200 shadow-lg
              ${selectedOption === null 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5'}
            `}
          >
            {isLastQuestion ? '完成训练' : '下一题'}
            {!isLastQuestion && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
