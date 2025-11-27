
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
  Target, 
  BrainCircuit, 
  Sparkles,
  ArrowRight,
  ClipboardList,
  RefreshCcw,
  Database,
  Trophy,
  TrendingUp,
  Lightbulb
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

      // 3. For each topic, try to find 2 custom questions (Mixed difficulty)
      topicDefs.forEach(topic => {
        // Find questions matching this topic
        const matches = relevantCustomQuestions.filter(q => q.knowledgePoint === topic.name);
        
        if (matches.length >= 2) {
            // Ideally pick one easy/medium and one hard if available, or just random 2
            // Simple shuffle for now
            const shuffled = [...matches].sort(() => 0.5 - Math.random());
            questionsToUse.push(shuffled[0]);
            questionsToUse.push(shuffled[1]);
        } else if (matches.length === 1) {
             questionsToUse.push(matches[0]);
             topicsNeedingAi.push(topic.name); // Generate AI backup to ensure enough coverage
        } else {
          // No custom question found, add to AI list
          topicsNeedingAi.push(topic.name);
        }
      });
      
      // 4. Generate missing questions via AI
      let aiQuestions: QuizQuestion[] = [];
      if (topicsNeedingAi.length > 0) {
        // The AI service now generates 2 questions per topic requested
        aiQuestions = await generateDiagnosticQuiz(profile.grade, profile.subject, topicsNeedingAi);
      }
      
      // 5. Combine results and set state
      const finalQuestions = [...questionsToUse, ...aiQuestions];
      
      // Remove potential duplicates if topics overlap
      const uniqueQuestions = Array.from(new Map(finalQuestions.map(q => [q.id, q])).values());
      
      if (uniqueQuestions.length === 0) {
        throw new Error("Failed to generate any questions");
      }

      setDiagnosticQuestions(uniqueQuestions);
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
      // If total is 0 (shouldn't happen usually), default to 50
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
    
    // Find the associated learning goal and Current Score
    const point = knowledgePoints.find(p => p.name === pointName);
    const goal = point?.learningGoal || '';
    const currentScore = point?.score || 0;

    setActiveLearningGoal(goal);

    try {
      // Logic: Check custom questions first for training
      const trainingMatches = customQuestions.filter(
        q => q.grade === profile.grade && 
             q.subject === profile.subject && 
             q.knowledgePoint === pointName
      );

      let questions: QuizQuestion[] = [];

      // If we have enough custom questions (e.g., at least 5), use them
      if (trainingMatches.length >= 5) {
        // Shuffle array
        const shuffled = [...trainingMatches].sort(() => 0.5 - Math.random());
        questions = shuffled.slice(0, 5);
        // Add artificial ID suffix to ensure unique keys if re-used
        questions = questions.map(q => ({...q, id: `${q.id}-${Date.now()}`}));
      } else {
        // Otherwise use AI, passing the current score for adaptive difficulty
        questions = await generateTrainingQuiz(
            profile.grade, 
            profile.subject, 
            pointName, 
            goal, 
            currentScore
        );
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-12 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">智学AI <span className="text-indigo-600 font-medium ml-1">诊断系统</span></h1>
          </div>
          {step === 'dashboard' && (
            <button 
              onClick={() => setStep('setup')}
              className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-lg border border-transparent hover:border-indigo-100"
            >
              重新诊断
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative">
        
        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="max-w-lg mx-auto mt-8 relative animate-fade-in-up">
            
            {/* Teacher Mode Button */}
            <div className="absolute -top-14 right-0">
               <button 
                 onClick={() => setIsQuestionBankOpen(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-white hover:text-indigo-600 hover:shadow-md hover:border-indigo-100 transition-all duration-300"
               >
                 <Database size={16} /> 
                 <span>题库管理 (教师)</span>
               </button>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-white p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl mb-6 shadow-inner">
                  <ClipboardList size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">开始学情诊断</h2>
                <p className="text-slate-500 text-base leading-relaxed">
                  {customQuestions.length > 0 
                    ? `AI 将结合题库中的 ${customQuestions.length} 道精选题目为您生成专属试题`
                    : 'AI 将为您生成分层诊断试题，精准定位知识薄弱点'}
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">学生姓名</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="请输入您的姓名"
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-slate-800 placeholder:text-slate-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">所在年级</label>
                  <div className="grid grid-cols-3 gap-3">
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        onClick={() => setProfile({ ...profile, grade: g })}
                        className={`py-3 px-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                          profile.grade === g
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30 transform scale-[1.02]'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">诊断学科</label>
                  <div className="grid grid-cols-3 gap-3">
                    {SUBJECTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setProfile({ ...profile, subject: s })}
                        className={`py-3 px-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                          profile.subject === s
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30 transform scale-[1.02]'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
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
                  className={`w-full py-4 mt-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform ${
                     !profile.name.trim() 
                     ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                     : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] shadow-xl hover:shadow-2xl shadow-slate-900/20'
                  }`}
                >
                  开始智能诊断
                  <ArrowRight size={20} className={!profile.name.trim() ? '' : 'animate-bounce-x'} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Loading State */}
        {(step === 'diagnosing' || step === 'analyzing') && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
             <div className="relative mb-8">
               <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
               <div className="w-20 h-20 border-4 border-t-indigo-600 rounded-full animate-spin absolute top-0 left-0"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <BrainCircuit className="text-indigo-600 animate-pulse" size={32} />
               </div>
             </div>
             <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
               {step === 'diagnosing' ? '正在生成诊断试卷...' : 'AI 正在分析答题数据...'}
             </h3>
             <p className="text-slate-500 mt-3 font-medium">
               {step === 'diagnosing' ? '构建多维度知识点测试矩阵' : '生成雷达图与个性化学习建议'}
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
          <div className="space-y-8 animate-fade-in">
            {/* Header section for dashboard */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {profile.name}的{profile.subject}诊断报告
                </h2>
                <p className="text-slate-500 mt-1">生成时间: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {profile.grade}
                </span>
                <span className="w-px h-4 bg-slate-200 mx-1"></span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                   <Target size={14} className="text-indigo-500" />
                   {profile.subject}
                </span>
              </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trophy size={80} className="text-indigo-600" />
                </div>
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">综合掌握度</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">
                    {Math.round(knowledgePoints.reduce((acc, curr) => acc + curr.score, 0) / knowledgePoints.length) || 0}
                  </div>
                  <span className="text-xl text-slate-400 font-bold">%</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                   <TrendingUp size={16} className="text-green-500" />
                   <span>超越了同级 85% 的用户</span>
                </div>
              </div>
              
              <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Sparkles size={140} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-100">
                    <Sparkles size={20} className="text-yellow-300" /> 
                    AI 智能导师点评
                  </h3>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                    <p className="text-indigo-50 text-lg leading-relaxed font-medium">
                      "{aiComment || "分析完成。"}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Radar Chart Section */}
              <div className="lg:col-span-5 bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Target className="text-indigo-500" />
                    知识图谱
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center min-h-[350px]">
                  <RadarView data={knowledgePoints} />
                </div>
                <div className="text-center text-xs text-slate-400 mt-2">
                  * 维度越饱满，代表该知识点掌握越牢固
                </div>
              </div>

              {/* Weak Points & Actions */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-8 h-full flex flex-col">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-8">
                    <Lightbulb className="text-amber-500" />
                    薄弱项专项突破
                  </h3>
                  
                  {weakPoints.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 bg-green-50/50 rounded-2xl border border-green-100/50 dashed border-2">
                      <div className="inline-block p-4 bg-green-100 text-green-600 rounded-full mb-4 animate-bounce-slow">
                        <Trophy size={32} />
                      </div>
                      <p className="text-green-800 font-bold text-lg">太棒了！测试显示暂无明显薄弱项</p>
                      <p className="text-green-600 text-sm mt-2 opacity-80">建议挑战更高年级或尝试其他学科</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      {weakPoints.map((point) => (
                        <div key={point.name} className="group flex flex-col p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                             <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="font-bold text-slate-800 text-lg">{point.name}</div>
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${point.score < 60 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {point.score}分
                                  </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${point.score < 60 ? 'bg-red-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.max(5, point.score)}%` }}
                                  ></div>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                               <button
                                 onClick={() => startTraining(point.name)}
                                 disabled={loadingQuiz}
                                 className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 text-sm active:scale-95"
                               >
                                 {loadingQuiz && activeWeakPoint === point.name ? (
                                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                 ) : (
                                   <Sparkles size={16} />
                                 )}
                                 AI 专项训练
                               </button>
                               
                               <button 
                                 onClick={() => startTraining(point.name)}
                                 disabled={loadingQuiz}
                                 title="生成更多题目"
                                 className="px-3 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 text-sm font-medium active:bg-slate-100"
                               >
                                 <RefreshCcw size={18} className={loadingQuiz && activeWeakPoint === point.name ? "animate-spin" : ""} />
                               </button>
                             </div>
                          </div>
                          
                          {/* Display Learning Goal */}
                          {point.learningGoal && (
                            <div className="relative pl-4 text-sm text-slate-500 leading-relaxed border-l-2 border-indigo-100 bg-slate-50/50 p-3 rounded-r-lg">
                              <span className="font-bold text-slate-700 mr-1">🎯 提升目标:</span> 
                              {point.learningGoal}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-8 pt-6 border-t border-slate-100">
                     <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                       <div className="w-8 h-px bg-slate-200"></div>
                       强项保持
                       <div className="flex-1 h-px bg-slate-200"></div>
                     </h4>
                     <div className="flex flex-wrap gap-3">
                        {sortedPoints.filter(p => p.score >= 80).map(p => (
                          <span key={p.name} className="px-4 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            <CheckIcon size={14} />
                            {p.name} <span className="opacity-70 text-xs">| {p.score}</span>
                          </span>
                        ))}
                        {sortedPoints.filter(p => p.score >= 80).length === 0 && (
                          <span className="text-sm text-slate-400 italic">暂无明显强项，继续加油！</span>
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

// Helper for check icon
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default App;
