
import React, { useState } from 'react';
import { GradeLevel, Subject, QuizQuestion } from '../types';
import { GRADES, SUBJECTS, SUBJECT_TOPICS } from '../constants';
import { Plus, Trash2, Save, X, BookOpen, Check } from 'lucide-react';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingQuestions: QuizQuestion[];
  onAddQuestion: (q: QuizQuestion) => void;
  onDeleteQuestion: (id: string) => void;
}

const QuestionBankModal: React.FC<QuestionBankModalProps> = ({ 
  isOpen, 
  onClose, 
  existingQuestions, 
  onAddQuestion, 
  onDeleteQuestion 
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  
  // Form State
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.Eight);
  const [subject, setSubject] = useState<Subject>(Subject.Math);
  const [topic, setTopic] = useState<string>(SUBJECT_TOPICS[Subject.Math][0].name);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState('');

  if (!isOpen) return null;

  // Update topics when subject changes
  const currentTopics = SUBJECT_TOPICS[subject];

  const handleSubjectChange = (s: Subject) => {
    setSubject(s);
    setTopic(SUBJECT_TOPICS[s][0].name);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOptions = [...options];
    newOptions[idx] = val;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (!questionText.trim() || options.some(o => !o.trim())) {
      alert("请完整填写题目和所有选项");
      return;
    }

    const newQuestion: QuizQuestion = {
      id: `custom-${Date.now()}`,
      grade,
      subject,
      knowledgePoint: topic,
      difficulty,
      question: questionText,
      options,
      correctIndex,
      explanation: explanation || "暂无解析",
    };

    onAddQuestion(newQuestion);
    
    // Reset form partially
    setQuestionText('');
    setOptions(['', '', '', '']);
    setExplanation('');
    alert("题目添加成功！");
  };

  const filteredQuestions = existingQuestions.filter(q => q.subject === subject && q.grade === grade);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-400" />
            <h2 className="text-xl font-bold">教师题库管理</h2>
          </div>
          <button onClick={onClose} className="hover:bg-slate-700 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'add' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Plus size={18} /> 录入新题
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={18} /> 已录入题目 ({existingQuestions.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* Add Question Form */}
          {activeTab === 'add' && (
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">年级</label>
                  <select 
                    value={grade} 
                    onChange={(e) => setGrade(e.target.value as GradeLevel)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
                  >
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">学科</label>
                  <select 
                    value={subject} 
                    onChange={(e) => handleSubjectChange(e.target.value as Subject)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">对应知识点</label>
                  <select 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
                  >
                    {currentTopics.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">难度</label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm border ${
                          difficulty === d 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">题干内容</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="请输入题目描述..."
                  className="w-full p-3 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                />
              </div>

              <div className="mb-6 space-y-3">
                <label className="block text-sm font-bold text-slate-700">选项设置 (勾选正确答案)</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <button
                      onClick={() => setCorrectIndex(idx)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                        correctIndex === idx 
                          ? 'bg-green-500 text-white border-green-500 shadow-md transform scale-110' 
                          : 'bg-white border-slate-300 text-slate-300 hover:border-green-300'
                      }`}
                    >
                      {correctIndex === idx && <Check size={16} />}
                    </button>
                    <span className="font-bold text-slate-500 w-6">{String.fromCharCode(65 + idx)}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2">题目解析</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="请输入该题目的答案解析..."
                  className="w-full p-3 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                保存题目到题库
              </button>
            </div>
          )}

          {/* List Questions */}
          {activeTab === 'list' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex gap-4 mb-4 bg-white p-4 rounded-xl shadow-sm">
                <select 
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="p-2 border border-slate-300 rounded-lg text-sm"
                >
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="p-2 border border-slate-300 rounded-lg text-sm"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                  <p>该年级学科暂无录入题目</p>
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 group relative">
                    <button 
                      onClick={() => onDeleteQuestion(q.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2"
                      title="删除题目"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded font-medium">{q.knowledgePoint}</span>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {q.difficulty === 'easy' ? '简单' : q.difficulty === 'hard' ? '困难' : '中等'}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 mb-3 pr-8">{q.question}</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-2 ${i === q.correctIndex ? 'text-green-600 font-bold' : ''}`}>
                           <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                             {String.fromCharCode(65 + i)}
                           </span>
                           {opt}
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 mt-2">
                      <span className="font-bold text-slate-600">解析：</span> {q.explanation}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBankModal;
