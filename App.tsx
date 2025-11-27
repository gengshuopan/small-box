
import React, { useState } from 'react';
import { 
  GradeLevel, 
  Subject, 
  StudentProfile, 
  KnowledgePoint,
  QuizQuestion 
} from './types';
import { GRADES, SUBJECTS, SUBJECT_TOPICS } from './constants';
import RadarView from './components/RadarView';
import QuizModal from './components/QuizModal';
import DiagnosisQuiz from './components/DiagnosisQuiz';
import QuestionBankModal from './components/QuestionBankModal';
import { 
  generateTrainingQuiz, 
  generateAnalysisComment, 
  generateDiagnosticQuiz 
} from './services/geminiService';
import { 
  BookOpen, 
  GraduationCap, 
  Target, 
  BrainCircuit, 
  Sparkles,
  ArrowRight,
  ClipboardList,
  RefreshCcw,
  Settings,
  Database
} from 'lucide-react';

const App: React.FC = () => {
  // Application Flow State
  const [step, setStep] = useState<'setup' | 'diagnosing' | 'quiz' | 'analyzing' | 'dashboard'>('setup');
  
  // Data State
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    grade: GradeLevel.Eight,
    subject: Subject.Math,
  });
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [aiComment, setAiComment] = useState<string>('');
  
  // Custom Question Bank State
  const [customQuestions, setCustomQuestions] = useState<QuizQuestion[]>([]);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  
  // Diagnosis Quiz State
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<QuizQuestion[]>([]);
  
  // Training Quiz State
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [activeWeakPoint, setActiveWeakPoint] = useState<string>('');
  const [activeLearningGoal, setActiveLearningGoal] = useState<string>('');

  // Handle adding a manual question
  const handleAddQuestion = (q: QuizQuestion) => {
    setCustomQuestions(prev => [q, ...prev]);
  };

  // Handle deleting a manual question
  const handleDeleteQuestion = (id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleStartDiagnosis = async () => {
    if (!profile.name.trim()) return;
    
    setStep('diagnosing');
    try {
      // 1. Get standard topic definitions for the selected subject
      const topicDefs = SUBJECT_TOPICS[profile.subject];
      
      const questionsToUse: QuizQuestion[] = [];
      const topicsNeedingAi: string[] = [];

      // 2. Filter custom questions for this student's profile
      const relevantCustomQuestions = customQuestions.filter(
        q => q.grade === profile.grade && q.subject === profile.subject
      );

      // 3. For each topic, try to find a custom question first
      topicDefs.forEach(topic => {
        // Find questions matching this topic
        const matches = relevantCustomQuestions.filter(q => q.knowledgePoint === topic.name);
        
        if (matches.length > 0) {
          // If multiple exist, pick a random one for the diagnosis
          const randomMatch = matches[Math.floor(Math.random() * matches.length)];
          questionsToUse.push(randomMatch);
        } else {
          // No custom question found, add to AI list
          topicsNeedingAi.push(topic.name);
        }
      });
      
      // 4. Generate missing questions via AI
      let aiQuestions: QuizQuestion[] = [];
      if (topicsNeedingAi.length > 0) {
        aiQuestions = await generateDiagnosticQuiz(profile.grade, profile.subject, topicsNeedingAi);
      }
      
      // 5. Combine results and set state
      const finalQuestions = [...questionsToUse, ...aiQuestions];
      
      // Sort questions to match the topic order roughly (optional, but good for flow)
      // or just shuffle them. Let's keep them mixed.
      
      if (finalQuestions.length === 0) {
        throw new Error("Failed to generate any questions");
      }

      setDiagnosticQuestions(finalQuestions);
      setStep('quiz');
    } catch (error) {
      console.error(error);
      alert("生成试卷失败，请重试。");
      setStep('setup');
    }
  };

  const handleDiagnosticComplete = async (results: Record<string, boolean>) => {
    setStep('analyzing');
    
    // 1. Calculate scores per knowledge point
    const topicDefs = SUBJECT_TOPICS[profile.subject];
    const pointScores: Record<string, { total: number, correct: number }> = {};
    
    // Initialize
    topicDefs.forEach(t => {
      pointScores[t.name] = { total: 0, correct: 0 };
    });
    
    // Aggregate results
    diagnosticQuestions.forEach(q => {
      const point = q.knowledgePoint;
      if (point && pointScores[point]) {
        pointScores[point].total += 1;
        if (results[q.id]) {
          pointScores[point].correct += 1;
        }
      }
    });
    
    // Convert to KnowledgePoint array with goals
    const calculatedPoints: KnowledgePoint[] = topicDefs.map(def => {
      const data = pointScores[def.name];
      const score = data.total > 0 
        ? Math.round((data.correct / data.total) * 100) 
        : 50; 
        
      return { 
        name: def.name, 
        score, 
        fullMark: 100, 
        learningGoal: def.goal 
      };
    });
    
    setKnowledgePoints(calculatedPoints);

    // 2. Generate Comment
    try {
      const comment = await generateAnalysisComment(profile.grade, profile.subject, calculatedPoints);
      setAiComment(comment);
    } catch (e) {
      setAiComment("分析生成中...");
    }

    setStep('dashboard');
  };

  const startTraining = async (pointName: string) => {
    setLoadingQuiz(true);
    setActiveWeakPoint(pointName);
    
    // Find the associated learning goal
    const point = knowledgePoints.find(p => p.name === pointName);
    const goal = point?.learningGoal || '';
    setActiveLearningGoal(goal);

    try {
      // Logic: Check custom questions first for training
      // For training, we need ~3 questions.
      const trainingMatches = customQuestions.filter(
        q => q.grade === profile.grade && 
             q.subject === profile.subject && 
             q.knowledgePoint === pointName
      );

      let questions: QuizQuestion[] = [];

      // If we have enough custom questions (e.g., at least 3), use them (shuffled)
      if (trainingMatches.length >= 3) {
        // Shuffle array
        const shuffled = [...trainingMatches].sort(() => 0.5 - Math.random());
        questions = shuffled.slice(0, 3);
        // Add artificial ID suffix to allow retaking same questions if needed
        questions = questions.map(q => ({...q, id: `${q.id}-${Date.now()}`}));
      } else {
        // Otherwise use AI
        questions = await generateTrainingQuiz(profile.grade, profile.subject, pointName, goal);
      }

      setQuizQuestions(questions);
      setIsQuizOpen(true);
    } catch (error) {
      alert("生成题目失败，请检查 API Key 或稍后重试。");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const sortedPoints = [...knowledgePoints].sort((a, b) => a.score - b.score);
  const weakPoints = sortedPoints.filter(p => p.score < 80); // Consider < 80 as potential weak points

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">智学AI <span className="text-indigo-600 font-normal ml-1">诊断系统</span></h1>
          </div>
          {step === 'dashboard' && (
            <button 
              onClick={() => setStep('setup')}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              重新诊断
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="max-w-md mx-auto mt-8 relative">
            
            {/* Teacher Mode Button */}
            <div className="absolute -top-12 right-0">
               <button 
                 onClick={() => setIsQuestionBankOpen(true)}
                 className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors px-3 py-1 rounded-full hover:bg-white"
               >
                 <Database size={16} /> 题库管理 (教师)
               </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-fade-in-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                  <ClipboardList size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">开始您的学情诊断</h2>
                <p className="text-slate-500 mt-2">
                  {customQuestions.length > 0 
                    ? `AI 将结合题库中的 ${customQuestions.length} 道题目为您生成专属试题`
                    : 'AI 将为您生成专属试题以分析知识盲区'}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">学生姓名</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="请输入姓名"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">所在年级</label>
                  <div className="grid grid-cols-3 gap-3">
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        onClick={() => setProfile({ ...profile, grade: g })}
                        className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                          profile.grade === g
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">诊断学科</label>
                  <div className="grid grid-cols-3 gap-3">
                    {SUBJECTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setProfile({ ...profile, subject: s })}
                        className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                          profile.subject === s
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartDiagnosis}
                  disabled={!profile.name.trim()}
                  className={`w-full py-4 mt-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                     !profile.name.trim() 
                     ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                     : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  生成诊断试卷
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Loading State */}
        {(step === 'diagnosing' || step === 'analyzing') && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
             <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
             <h3 className="text-xl font-bold text-slate-800">
               {step === 'diagnosing' ? '正在生成诊断试卷...' : 'AI 正在分析您的答题结果...'}
             </h3>
             <p className="text-slate-500 mt-2">
               {step === 'diagnosing' ? '融合教师题库与AI生成题目中' : '生成雷达图与个性化建议'}
             </p>
          </div>
        )}

        {/* Step 3: Diagnostic Quiz */}
        {step === 'quiz' && (
          <DiagnosisQuiz 
            questions={diagnosticQuestions} 
            onComplete={handleDiagnosticComplete}
            isSubmitting={false}
          />
        )}

        {/* Step 4: Dashboard */}
        {step === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
                <div className="text-slate-500 text-sm font-medium mb-1">综合掌握度</div>
                <div className="text-4xl font-bold text-indigo-600">
                  {Math.round(knowledgePoints.reduce((acc, curr) => acc + curr.score, 0) / knowledgePoints.length) || 0}
                  <span className="text-lg text-slate-400 font-normal ml-2">%</span>
                </div>
              </div>
              
              <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={100} />
                </div>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Sparkles size={20} /> AI 智能点评
                </h3>
                <p className="text-indigo-100 leading-relaxed text-sm md:text-base">
                  {aiComment || "分析完成。"}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Radar Chart Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Target className="text-indigo-500" />
                    知识图谱
                  </h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
                    {profile.grade} {profile.subject}
                  </span>
                </div>
                <RadarView data={knowledgePoints} />
              </div>

              {/* Weak Points & Actions */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">
                    <BookOpen className="text-orange-500" />
                    薄弱项专项突破
                  </h3>
                  
                  {weakPoints.length === 0 ? (
                    <div className="text-center py-12 bg-green-50 rounded-xl border border-green-100 flex-1 flex flex-col items-center justify-center">
                      <div className="inline-block p-3 bg-green-100 text-green-600 rounded-full mb-3">
                        <Sparkles size={24} />
                      </div>
                      <p className="text-green-800 font-medium">太棒了！测试显示暂无明显薄弱项。</p>
                      <p className="text-green-600 text-sm mt-1">您可以尝试其他学科或更高年级挑战。</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      {weakPoints.map((point) => (
                        <div key={point.name} className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3">
                             <div className="mb-2 sm:mb-0">
                                <div className="font-bold text-slate-800">{point.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${point.score < 60 ? 'bg-red-500' : 'bg-orange-500'}`}
                                      style={{ width: `${Math.max(5, point.score)}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-xs font-bold ${point.score < 60 ? 'text-red-600' : 'text-orange-600'}`}>
                                    {point.score}分
                                  </span>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2 self-end sm:self-auto">
                               <button
                                 onClick={() => startTraining(point.name)}
                                 disabled={loadingQuiz}
                                 className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-sm text-sm whitespace-nowrap"
                               >
                                 {loadingQuiz && activeWeakPoint === point.name ? (
                                   <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                 ) : (
                                   <Sparkles size={16} />
                                 )}
                                 AI 专项训练
                               </button>
                               
                               <button 
                                 onClick={() => startTraining(point.name)}
                                 disabled={loadingQuiz}
                                 title="生成更多题目"
                                 className="px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-1 text-sm font-medium"
                               >
                                 <RefreshCcw size={16} className={loadingQuiz && activeWeakPoint === point.name ? "animate-spin" : ""} />
                                 <span className="hidden sm:inline">再练一组</span>
                               </button>
                             </div>
                          </div>
                          
                          {/* Display Learning Goal */}
                          {point.learningGoal && (
                            <div className="mt-2 text-xs text-slate-500 bg-white/50 p-2 rounded border border-slate-100">
                              <span className="font-semibold text-slate-600">目标：</span> {point.learningGoal}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-8 pt-6 border-t border-slate-100">
                     <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">强项保持</h4>
                     <div className="flex flex-wrap gap-2">
                        {sortedPoints.filter(p => p.score >= 80).map(p => (
                          <span key={p.name} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium">
                            {p.name} ({p.score})
                          </span>
                        ))}
                        {sortedPoints.filter(p => p.score >= 80).length === 0 && (
                          <span className="text-sm text-slate-400">暂无明显强项，继续加油！</span>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <QuizModal 
        isOpen={isQuizOpen} 
        onClose={() => setIsQuizOpen(false)} 
        questions={quizQuestions}
        topic={`${activeWeakPoint} - 专项训练`}
      />

      {/* Teacher's Question Bank Modal */}
      <QuestionBankModal 
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        existingQuestions={customQuestions}
        onAddQuestion={handleAddQuestion}
        onDeleteQuestion={handleDeleteQuestion}
      />
    </div>
  );
};

export default App;
