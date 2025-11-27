import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle, XCircle, ChevronRight, X } from 'lucide-react';

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
    easy: { label: '简单', color: 'bg-green-100 text-green-700' },
    medium: { label: '中等', color: 'bg-yellow-100 text-yellow-700' },
    hard: { label: '困难', color: 'bg-red-100 text-red-700' },
  };

  const difficultyInfo = difficultyMap[currentQ.difficulty || 'medium'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">专项训练: {topic}</h2>
            <p className="text-indigo-200 text-sm">第 {currentIndex + 1} / {questions.length} 题</p>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-500 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
             <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${difficultyInfo.color}`}>
               难度：{difficultyInfo.label}
             </span>
          </div>

          <h3 className="text-xl font-medium text-slate-800 mb-6 leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ";
              
              if (selectedOption === null) {
                btnClass += "border-slate-200 hover:border-indigo-400 hover:bg-slate-50";
              } else {
                if (idx === currentQ.correctIndex) {
                  btnClass += "border-green-500 bg-green-50 text-green-900";
                } else if (idx === selectedOption) {
                  btnClass += "border-red-500 bg-red-50 text-red-900";
                } else {
                  btnClass += "border-slate-200 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  className={btnClass}
                  disabled={selectedOption !== null}
                >
                  <span className="font-medium text-lg mr-4 opacity-70">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span>{option}</span>
                  {selectedOption !== null && idx === currentQ.correctIndex && (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                  {selectedOption !== null && idx === selectedOption && idx !== currentQ.correctIndex && (
                    <XCircle className="text-red-600" size={20} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
              <h4 className="font-bold text-slate-700 mb-2">解析：</h4>
              <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
              ${selectedOption === null 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30'}
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