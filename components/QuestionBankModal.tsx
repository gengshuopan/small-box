
import React, { useState } from 'react';
import { GradeLevel, Subject, QuizQuestion } from '../types';
import { GRADES, SUBJECTS, SUBJECT_TOPICS } from '../constants';
import { Plus, Trash2, Save, X, BookOpen, Check, Layers, List } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="bg-white p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
               <BookOpen size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">教师题库管理</h2>
          </div>
          <button onClick={onClose} className="bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors text-slate-500 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Tabs - Segmented Control */}
        <div className="px-6 py-4 bg-white">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-2.5 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm ${
                activeTab === 'add' ? 'bg-white text-slate-900 shadow-md' : 'bg-transparent text-slate-500 hover:text-slate-700 shadow-none'
              }`}
            >
              <Plus size={16} /> 录入新题
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-2.5 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm ${
                activeTab === 'list' ? 'bg-white text-slate-900 shadow-md' : 'bg-transparent text-slate-500 hover:text-slate-700 shadow-none'
              }`}
            >
              <List size={16} /> 已录入题目 <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{existingQuestions.length}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* Add Question Form */}
          {activeTab === 'add' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Layers size={18} className="text-indigo-500" /> 
                  基础信息
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">年级</label>
                    <select 
                      value={grade} 
                      onChange={(e) => setGrade(e.target.value as GradeLevel)}
                      className="w-full p-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                    >
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">学科</label>
                    <select 
                      value={subject} 
                      onChange={(e) => handleSubjectChange(e.target.value as Subject)}
                      className="w-full p-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">对应知识点</label>
                    <select 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                    >
                      {currentTopics.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">难度</label>
                    <div className="flex gap-3">
                      {(['easy', 'medium', 'hard'] as const).map(d => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${
                            difficulty === d 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                              : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <BookOpen size={18} className="text-indigo-500" />
                   题目内容
                </h3>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">题干</label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="请输入题目描述..."
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-xl h-32 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">选项设置 (点击圆圈设置正确答案)</label>
                  <div className="space-y-3">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3 group">
                        <button
                          onClick={() => setCorrectIndex(idx)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                            correctIndex === idx 
                              ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-500/30' 
                              : 'bg-white border-slate-200 text-slate-300 hover:border-green-300 hover:text-green-300'
                          }`}
                        >
                          {correctIndex === idx ? <Check size={20} /> : <span className="font-bold text-sm">{String.fromCharCode(65 + idx)}</span>}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                          className={`flex-1 p-3 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium ${
                            correctIndex === idx ? 'bg-green-50 text-green-800 placeholder:text-green-300' : 'bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">题目解析</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="请输入该题目的答案解析..."
                  className="w-full p-4 bg-slate-50 border border-transparent rounded-xl h-24 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <div className="pt-4 pb-8">
                <button
                  onClick={handleSubmit}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  保存题目到题库
                </button>
              </div>
            </div>
          )}

          {/* List Questions */}
          {activeTab === 'list' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <select 
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="p-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="p-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                  <div className="bg-slate-100 p-6 rounded-full mb-4">
                     <BookOpen size={40} className="opacity-40" />
                  </div>
                  <p className="font-medium text-lg">该年级学科暂无录入题目</p>
                  <p className="text-sm mt-1 opacity-70">请切换到"录入新题"标签页添加题目</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredQuestions.map((q) => (
                    <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group relative hover:shadow-md transition-shadow">
                      <button 
                        onClick={() => onDeleteQuestion(q.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2 bg-slate-50 hover:bg-red-50 rounded-lg"
                        title="删除题目"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="flex gap-2 mb-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-bold border border-indigo-100">{q.knowledgePoint}</span>
                        <span className={`px-2.5 py-1 text-xs rounded-lg font-bold border ${
                          q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          q.difficulty === 'hard' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {q.difficulty === 'easy' ? '简单' : q.difficulty === 'hard' ? '困难' : '中等'}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-slate-800 mb-4 pr-10 text-lg">{q.question}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 mb-4">
                        {q.options.map((opt, i) => (
                          <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${i === q.correctIndex ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-slate-50'}`}>
                             <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${i === q.correctIndex ? 'bg-green-200 text-green-800' : 'bg-white text-slate-400 border border-slate-200'}`}>
                               {String.fromCharCode(65 + i)}
                             </span>
                             <span className="font-medium">{opt}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-500 border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">解析：</span> 
                        {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBankModal;
