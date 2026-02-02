
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, Play, X, CheckCircle2, 
  Timer, AlertCircle, FileText, BrainCircuit, Trophy,
  Save, BarChart3, Languages, ShieldCheck, Flag,
  ChevronDown, ArrowRight, Brain, Filter, History,
  Trash2, ClipboardCheck, Sparkles, BookOpen, Clock, Zap,
  RefreshCw, FileDown, RotateCcw, AlertTriangle,
  CheckCircle, XCircle, HelpCircle, Target, Layers
} from 'lucide-react';
import { AppState, GovExamType, GovQuestion, GovMockInstance, GovMistake } from '../types';
import { generateGovMCQs, analyzeGovPerformance } from '../services/gemini';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface GovExamMockProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const EXAMS: GovExamType[] = ['UPSC', 'SSC', 'Banking', 'Defence', 'Railways', 'State PSC', 'Insurance'];

const SUBJECT_DOMAINS = [
  { 
    name: 'General Studies', 
    topics: ['Indian Polity', 'Modern History', 'Ancient & Medieval History', 'Geography', 'Environment', 'Economy', 'Science & Tech', 'Art & Culture'] 
  },
  { 
    name: 'Aptitude & Logic', 
    topics: ['Arithmetic', 'Algebra', 'Geometry', 'Data Interpretation', 'Logical Reasoning', 'Analytical Ability'] 
  },
  { 
    name: 'Language & Verbal', 
    topics: ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Error Spotting', 'Sentence Rearrangement'] 
  },
  { 
    name: 'Specialized Awareness', 
    topics: ['Current Affairs', 'Banking Awareness', 'Static GK', 'Computer Awareness', 'Insurance Terms'] 
  }
];

const QUESTION_COUNTS = [10, 15, 20, 25, 30, 40, 50];

const GovExamMock: React.FC<GovExamMockProps> = ({ state, setState }) => {
  // Test Config State
  const [view, setView] = useState<'config' | 'test' | 'result' | 'history' | 'notebook'>('config');
  const [selectedExam, setSelectedExam] = useState<GovExamType>('UPSC');
  const [selectedDomain, setSelectedDomain] = useState(SUBJECT_DOMAINS[0]);
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [customCountInput, setCustomCountInput] = useState('10');
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  
  // Active Test State
  const [isLoading, setIsLoading] = useState(false);
  const [currentMock, setCurrentMock] = useState<GovMockInstance | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // Seconds
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Mistake Notebook filter
  const [notebookFilter, setNotebookFilter] = useState<string>('all');

  // Question refs for scrolling to solutions
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Timer Logic
  useEffect(() => {
    let timer: number;
    if (view === 'test' && timeLeft > 0 && !isTestFinished) {
      timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && view === 'test' && !isTestFinished) {
      submitTest();
    }
    return () => clearInterval(timer);
  }, [view, timeLeft, isTestFinished]);

  const startGeneration = async () => {
    setIsLoading(true);
    const count = isCustomCount ? parseInt(customCountInput) || 10 : questionCount;
    // We combine the domain and specific topic/chapter for the AI
    const subjectContext = selectedDomain.name;
    const topicContext = topic || selectedDomain.topics[0];
    
    const questions = await generateGovMCQs(selectedExam, subjectContext, topicContext, count, language);
    
    if (questions.length === 0) {
      alert("Neural core could not synthesize questions. Please retry parameters.");
      setIsLoading(false);
      return;
    }

    const newMock: GovMockInstance = {
      id: Math.random().toString(36).substr(2, 9),
      exam: selectedExam,
      subject: subjectContext,
      topic: topicContext,
      questions,
      userAnswers: Array(questions.length).fill(null),
      markedForReview: Array(questions.length).fill(false),
      startTime: Date.now(),
      score: 0,
      totalMarks: questions.length * 2,
      negativeMarking: selectedExam === 'UPSC' ? 0.66 : (selectedExam === 'SSC' ? 0.5 : 0.25),
      language,
      mistakesAnalyzed: false
    };

    setCurrentMock(newMock);
    setTimeLeft(questions.length * 60); // 1 min per question
    setCurrentQuestionIndex(0);
    setView('test');
    setIsLoading(false);
    setAiAnalysis(null);
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentMock) return;
    const updatedAnswers = [...currentMock.userAnswers];
    updatedAnswers[currentQuestionIndex] = updatedAnswers[currentQuestionIndex] === optionIndex ? null : optionIndex;
    setCurrentMock({ ...currentMock, userAnswers: updatedAnswers });
  };

  const toggleReview = () => {
    if (!currentMock) return;
    const updatedReview = [...currentMock.markedForReview];
    updatedReview[currentQuestionIndex] = !updatedReview[currentQuestionIndex];
    setCurrentMock({ ...currentMock, markedForReview: updatedReview });
  };

  const submitTest = async () => {
    if (!currentMock) return;
    
    let correct = 0;
    let incorrect = 0;
    const mistakes: GovMistake[] = [];

    currentMock.questions.forEach((q, i) => {
      const userAns = currentMock.userAnswers[i];
      if (userAns === null) return;
      if (userAns === q.correctIndex) {
        correct++;
      } else {
        incorrect++;
        mistakes.push({
          id: Math.random().toString(36).substr(2, 9),
          question: q,
          userAnswerIndex: userAns,
          timestamp: Date.now(),
          category: q.type === 'Numerical' ? 'Calculation' : 'Conceptual'
        });
      }
    });

    const finalScore = (correct * 2) - (incorrect * currentMock.negativeMarking);
    const finishedMock = { 
      ...currentMock, 
      endTime: Date.now(), 
      score: Math.max(0, parseFloat(finalScore.toFixed(2))) 
    };

    setState(prev => ({
      ...prev,
      govMockHistory: [finishedMock, ...prev.govMockHistory],
      mistakeNotebook: [...mistakes, ...prev.mistakeNotebook]
    }));
    
    setCurrentMock(finishedMock);
    setView('result');
    
    const feedback = await analyzeGovPerformance(finishedMock);
    setAiAnalysis(feedback);
  };

  const reattemptMistakes = (mistakes: GovMistake[]) => {
    if (mistakes.length === 0) return;
    const questions = mistakes.map(m => m.question);
    const newMock: GovMockInstance = {
      id: `re-${Math.random().toString(36).substr(2, 5)}`,
      exam: selectedExam,
      subject: 'Mistake Correction',
      topic: 'Neural Re-attempt',
      questions,
      userAnswers: Array(questions.length).fill(null),
      markedForReview: Array(questions.length).fill(false),
      startTime: Date.now(),
      score: 0,
      totalMarks: questions.length * 2,
      negativeMarking: 0,
      language: 'EN',
      mistakesAnalyzed: false
    };
    setCurrentMock(newMock);
    setTimeLeft(questions.length * 60);
    setCurrentQuestionIndex(0);
    setView('test');
  };

  const scrollToQuestion = (index: number) => {
    const el = questionRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resultsData = useMemo(() => {
    if (!currentMock) return [];
    const attempted = currentMock.userAnswers.filter(a => a !== null).length;
    const correct = currentMock.questions.filter((q, i) => currentMock.userAnswers[i] === q.correctIndex).length;
    const incorrect = attempted - correct;
    const skipped = currentMock.questions.length - attempted;
    return [
      { name: 'Correct', value: correct, color: '#10b981' },
      { name: 'Incorrect', value: incorrect, color: '#f43f5e' },
      { name: 'Skipped', value: skipped, color: '#94a3b8' }
    ];
  }, [currentMock]);

  return (
    <div className="space-y-8 pb-24 px-2 md:px-0 h-full">
      <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-100 w-fit shadow-sm overflow-x-auto no-scrollbar max-w-full">
         <button onClick={() => setView('config')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'config' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>New Test</button>
         <button onClick={() => setView('history')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>History</button>
         <button onClick={() => setView('notebook')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${view === 'notebook' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Mistake Log</button>
      </div>

      {view === 'config' && (
        <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-6 duration-700">
           <div className="bg-white rounded-[44px] md:rounded-[64px] p-8 md:p-14 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10 space-y-12">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-50 pb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-500"><Target size={40}/></div>
                        <div>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Diagnostic Architect</h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Configure High-Fidelity Simulations</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                        <button onClick={() => setLanguage('EN')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${language === 'EN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
                        <button onClick={() => setLanguage('HI')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${language === 'HI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>HI</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Col: Primary Parameters */}
                    <div className="lg:col-span-4 space-y-8">
                       <div className="space-y-4">
                          <label className="text-[11px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-2">
                             <ShieldCheck size={14}/> Exam Authority
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                             {EXAMS.map(exam => (
                               <button 
                                key={exam} 
                                onClick={() => setSelectedExam(exam)} 
                                className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase text-left border transition-all flex justify-between items-center group/btn ${selectedExam === exam ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-white hover:border-slate-200'}`}
                               >
                                 {exam}
                                 {selectedExam === exam && <ChevronRight size={16}/>}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Right Col: Targeted Logic */}
                    <div className="lg:col-span-8 space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                             {/* Fixed missing import for 'Layers' icon */}
                             <label className="text-[11px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-2"><Layers size={14}/> Subject Domain</label>
                             <div className="space-y-2">
                               {SUBJECT_DOMAINS.map(domain => (
                                 <button 
                                  key={domain.name} 
                                  onClick={() => { setSelectedDomain(domain); setTopic(''); }}
                                  className={`w-full p-6 rounded-[28px] border text-left transition-all relative overflow-hidden group/dom ${selectedDomain.name === domain.name ? 'border-indigo-600 bg-indigo-50/30' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                                 >
                                    <h4 className={`font-black text-sm uppercase tracking-tight ${selectedDomain.name === domain.name ? 'text-indigo-600' : 'text-slate-700'}`}>{domain.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1">{domain.topics.slice(0, 3).join(', ')}...</p>
                                    {selectedDomain.name === domain.name && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 size={16}/></div>}
                                 </button>
                               ))}
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-2"><Target size={14}/> Targeted Topic / Chapter</label>
                                <div className="space-y-4">
                                   <input 
                                    value={topic} 
                                    onChange={e => setTopic(e.target.value)} 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" 
                                    placeholder="Type specific chapter or select below..."
                                   />
                                   <div className="flex flex-wrap gap-2">
                                      {selectedDomain.topics.map(t => (
                                        <button 
                                          key={t} 
                                          onClick={() => setTopic(t)}
                                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${topic === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                                        >
                                          {t}
                                        </button>
                                      ))}
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase text-slate-400 ml-2 tracking-widest">Question Quota</label>
                                <div className="flex flex-wrap gap-3">
                                   {QUESTION_COUNTS.map(count => (
                                     <button 
                                      key={count} 
                                      onClick={() => { setQuestionCount(count); setIsCustomCount(false); }} 
                                      className={`w-14 h-14 rounded-2xl text-[12px] font-black transition-all flex items-center justify-center shadow-sm ${questionCount === count && !isCustomCount ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                     >
                                       {count}
                                     </button>
                                   ))}
                                   <div className={`flex-1 min-w-[120px] flex items-center gap-2 p-2 pl-4 rounded-2xl border transition-all ${isCustomCount ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
                                      <label className="text-[9px] font-black uppercase text-slate-400">Custom</label>
                                      <input type="number" value={customCountInput} onChange={e => { setCustomCountInput(e.target.value); setIsCustomCount(true); }} className="w-full bg-white border-none rounded-xl text-center font-black py-2 text-sm outline-none" />
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>

                       <button 
                        onClick={startGeneration} 
                        disabled={isLoading}
                        className="w-full py-7 md:py-9 bg-slate-900 text-white rounded-[36px] md:rounded-[56px] font-black uppercase tracking-[0.6em] text-xs md:text-sm shadow-2xl flex items-center justify-center gap-6 hover:bg-indigo-600 active:scale-95 transition-all shadow-indigo-100"
                       >
                         {isLoading ? <><RefreshCw className="animate-spin" size={24}/> Synthesizing Logic...</> : <><Sparkles size={24}/> Initialize Targeted Mock</>}
                       </button>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px]"></div>
           </div>
        </div>
      )}

      {view === 'test' && currentMock && (
        <div className="fixed inset-0 z-[500] bg-white flex flex-col md:flex-row animate-in fade-in duration-500">
           {/* Navigation Panel */}
           <div className="w-full md:w-80 bg-slate-50 border-r flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b bg-white">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Question Matrix</h3>
                    <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-mono font-black animate-pulse">{formatTime(timeLeft)}</div>
                 </div>
                 <div className="grid grid-cols-5 gap-2">
                    {currentMock.questions.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setCurrentQuestionIndex(i)}
                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-[11px] font-black transition-all ${
                          currentQuestionIndex === i ? 'ring-4 ring-indigo-500/20' : ''
                        } ${
                          currentMock.userAnswers[i] !== null 
                            ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-md' 
                            : currentMock.markedForReview[i] 
                              ? 'bg-purple-500 text-white shadow-purple-200 shadow-md' 
                              : 'bg-white border border-slate-200 text-slate-400'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
                 <div className="p-6 bg-slate-900 rounded-[32px] text-white">
                    <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Protocol: {currentMock.exam}</p>
                    <p className="text-xl font-black">{currentMock.subject}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{currentMock.topic}</p>
                    <div className="h-px bg-white/10 my-4"></div>
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase text-slate-500">
                        <span>Negative Mark</span>
                        <span className="text-rose-400">-{currentMock.negativeMarking}</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-2">
                    <button onClick={toggleReview} className="w-full py-4 bg-purple-50 text-purple-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-100 transition-all flex items-center justify-center gap-2">
                        <Flag size={14}/> {currentMock.markedForReview[currentQuestionIndex] ? 'Unmark review' : 'Mark for Review'}
                    </button>
                    <button onClick={() => {if(confirm("Terminate and Submit?")) submitTest()}} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-rose-700 transition-all">Submit Protocol</button>
                 </div>
              </div>
           </div>

           {/* Question Canvas */}
           <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-16 space-y-12 no-scrollbar">
                 <div className="max-w-3xl mx-auto flex justify-between items-center border-b border-slate-100 pb-6">
                    <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Question {currentQuestionIndex + 1} of {currentMock.questions.length}</span>
                    <div className="flex gap-2">
                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{currentMock.questions[currentQuestionIndex].difficulty}</span>
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{currentMock.questions[currentQuestionIndex].type}</span>
                    </div>
                 </div>

                 <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                       {currentMock.questions[currentQuestionIndex].text}
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                       {currentMock.questions[currentQuestionIndex].options.map((opt, idx) => (
                         <button 
                          key={idx} 
                          onClick={() => handleAnswer(idx)}
                          className={`w-full text-left p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-2 transition-all flex items-center justify-between group ${
                            currentMock.userAnswers[currentQuestionIndex] === idx 
                              ? 'bg-indigo-50 border-indigo-600 shadow-lg' 
                              : 'bg-white border-slate-100 hover:border-slate-300'
                          }`}
                         >
                           <div className="flex items-center gap-6">
                              <span className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                                currentMock.userAnswers[currentQuestionIndex] === idx ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                              }`}>{String.fromCharCode(65 + idx)}</span>
                              <span className={`font-bold text-base md:text-lg ${currentMock.userAnswers[currentQuestionIndex] === idx ? 'text-indigo-900' : 'text-slate-600'}`}>{opt}</span>
                           </div>
                           {currentMock.userAnswers[currentQuestionIndex] === idx && <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 size={16}/></div>}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="p-6 md:p-8 border-t bg-slate-50 flex items-center justify-between">
                 <button 
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 transition-all disabled:opacity-30 active:scale-95"
                 >
                   <ChevronLeft size={18}/> PREVIOUS
                 </button>
                 <button 
                  onClick={() => {
                    if (currentQuestionIndex < currentMock.questions.length - 1) {
                      setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                      if (confirm("End of sequence. Submit results?")) submitTest();
                    }
                  }}
                  className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
                 >
                   {currentQuestionIndex === currentMock.questions.length - 1 ? 'FINISH TEST' : 'NEXT QUESTION'} <ChevronRight size={18}/>
                 </button>
              </div>
           </div>
        </div>
      )}

      {view === 'result' && currentMock && (
        <div className="max-w-6xl mx-auto space-y-10 animate-in zoom-in-95 duration-700">
           <div className="bg-white rounded-[44px] md:rounded-[64px] p-8 md:p-16 border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-16 items-center overflow-hidden relative">
              <div className="flex-1 space-y-10 relative z-10 w-full">
                 <div>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4">Diagnostic Output</h2>
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.4em]">Integrated Intelligence Summary</p>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
                       <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{currentMock.score}</p>
                       <p className="text-[9px] font-black uppercase text-slate-400 mt-2">Score Secured</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 text-center">
                       <p className="text-4xl md:text-5xl font-black text-emerald-600 tracking-tighter">{Math.round((currentMock.questions.filter((q,i)=>currentMock.userAnswers[i]===q.correctIndex).length/currentMock.questions.length)*100)}%</p>
                       <p className="text-[9px] font-black uppercase text-emerald-400 mt-2">Accuracy Rate</p>
                    </div>
                    <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 text-center">
                       <p className="text-4xl md:text-5xl font-black text-indigo-600 tracking-tighter">{Math.round((Date.now() - currentMock.startTime)/60000)}</p>
                       <p className="text-[9px] font-black uppercase text-indigo-400 mt-2">Mins Expended</p>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-[32px] text-center">
                       <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">{currentMock.userAnswers.filter(a => a !== null).length}</p>
                       <p className="text-[9px] font-black uppercase text-slate-500 mt-2">Attempts Made</p>
                    </div>
                 </div>

                 {aiAnalysis && (
                    <div className="p-8 bg-indigo-50 rounded-[32px] border border-indigo-100 relative overflow-hidden group">
                        <div className="flex items-center gap-2 text-indigo-600 mb-4">
                            <Sparkles size={20} className="animate-pulse" />
                            <h5 className="text-[10px] font-black uppercase tracking-widest">Neural Strategy Feedback</h5>
                        </div>
                        <p className="text-slate-700 font-bold leading-relaxed">{aiAnalysis}</p>
                        <div className="absolute -right-10 -bottom-10 text-indigo-200/20 group-hover:scale-110 transition-transform"><Brain size={120}/></div>
                    </div>
                 )}

                 <div className="flex flex-wrap gap-4">
                   <button onClick={() => setView('notebook')} className="flex-1 py-6 bg-indigo-600 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"><BookOpen size={20}/> Mistake Archive</button>
                   <button onClick={() => window.print()} className="px-8 py-6 bg-white border border-slate-200 rounded-[32px] font-black uppercase text-xs tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"><FileDown size={20}/> Export PDF</button>
                   <button onClick={() => setView('config')} className="px-8 py-6 bg-slate-100 rounded-[32px] font-black uppercase text-xs tracking-widest text-slate-600 hover:bg-slate-200 transition-all active:scale-95"><RotateCcw size={20}/></button>
                 </div>
              </div>
              
              <div className="w-full xl:w-[450px] space-y-8 relative z-10">
                 <div className="h-64 md:h-80 bg-slate-50 rounded-[44px] p-8 relative shadow-inner">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={resultsData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value">
                             {resultsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <ReTooltip />
                       </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-4xl font-black tracking-tighter">{currentMock.questions.length}</span>
                       <span className="text-[8px] font-black uppercase text-slate-400">Total MCQs</span>
                    </div>
                 </div>
                 <div className="space-y-3">
                    {resultsData.map(item => (
                      <div key={item.name} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                         <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.name}</span></div>
                         <span className="font-black text-slate-900">{item.value}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[44px] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Master Answer Key</h3>
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Question to Jump</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-3">
                 {currentMock.questions.map((q, i) => {
                    const userAns = currentMock.userAnswers[i];
                    const isCorrect = userAns === q.correctIndex;
                    const isSkipped = userAns === null;

                    return (
                      <button 
                        key={i} 
                        onClick={() => scrollToQuestion(i)}
                        className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm border ${
                          isSkipped ? 'bg-slate-50 border-slate-200 text-slate-400' :
                          isCorrect ? 'bg-emerald-500 border-emerald-600 text-white' :
                          'bg-rose-500 border-rose-600 text-white'
                        }`}
                      >
                         <span className="text-lg font-black">{i + 1}</span>
                         {isCorrect && <CheckCircle size={10} className="mt-1" />}
                         {!isCorrect && !isSkipped && <XCircle size={10} className="mt-1" />}
                         {isSkipped && <HelpCircle size={10} className="mt-1" />}
                      </button>
                    );
                 })}
              </div>
           </div>

           <div className="space-y-8 pb-20">
              <div className="flex items-center justify-between px-6">
                 <h3 className="text-2xl font-black">Question Sequence Audit</h3>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-black uppercase text-slate-400">Correct</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-full"></div><span className="text-[10px] font-black uppercase text-slate-400">Incorrect</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 rounded-full"></div><span className="text-[10px] font-black uppercase text-slate-400">Skipped</span></div>
                 </div>
              </div>
              <div className="space-y-6">
                 {currentMock.questions.map((q, i) => {
                   const userAns = currentMock.userAnswers[i];
                   const isCorrect = userAns === q.correctIndex;
                   const isSkipped = userAns === null;

                   return (
                     <div 
                        key={i} 
                        ref={el => questionRefs.current[i] = el}
                        className={`p-8 md:p-12 rounded-[44px] border-2 transition-all ${
                          isSkipped ? 'bg-white border-slate-100 shadow-sm' :
                          isCorrect ? 'bg-white border-emerald-100 shadow-sm' : 
                          'bg-rose-50 border-rose-100 shadow-inner'
                        }`}
                     >
                        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
                           <div className="flex items-center gap-4">
                              <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">Q{i + 1}</span>
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                isSkipped ? 'bg-slate-200 text-slate-600' :
                                isCorrect ? 'bg-emerald-500 text-white' : 
                                'bg-rose-600 text-white'
                              }`}>
                                {isSkipped ? 'Sequence Skipped' : isCorrect ? 'Correct Synthesis' : 'Logic Disruption'}
                              </span>
                           </div>
                           <div className="flex gap-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type: {q.type}</span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diff: {q.difficulty}</span>
                           </div>
                        </div>
                        <h4 className="text-xl md:text-2xl font-black text-slate-900 mb-8 leading-tight">{q.text}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
                           {q.options.map((opt, idx) => {
                             const isThisCorrect = idx === q.correctIndex;
                             const isThisUserAns = idx === userAns;
                             
                             return (
                               <div 
                                key={idx} 
                                className={`p-5 rounded-2xl border-2 font-bold text-sm flex items-center justify-between ${
                                  isThisCorrect ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg' : 
                                  isThisUserAns ? 'bg-rose-600 text-white border-rose-700' : 
                                  'bg-slate-50 border-slate-100 text-slate-400'
                                }`}
                               >
                                  <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                                  {isThisCorrect && <CheckCircle size={16} />}
                                  {isThisUserAns && !isThisCorrect && <XCircle size={16} />}
                               </div>
                             );
                           })}
                        </div>
                        <div className="p-8 bg-slate-950 rounded-[32px] text-white space-y-4">
                           <div className="flex items-center gap-2 text-indigo-400"><BrainCircuit size={18}/><h5 className="text-[10px] font-black uppercase tracking-widest">Strategic Insight & Solution</h5></div>
                           <p className="text-xs md:text-sm leading-relaxed text-slate-300 italic">{q.explanation}</p>
                           <div className="pt-4 border-t border-white/10 flex items-center gap-6">
                              <div><p className="text-[8px] font-black uppercase text-slate-500">Correct Answer</p><p className="text-emerald-400 font-black">Option {String.fromCharCode(65 + q.correctIndex)}</p></div>
                              <div><p className="text-[8px] font-black uppercase text-slate-500">Your Response</p><p className={`${isCorrect ? 'text-emerald-400' : isSkipped ? 'text-slate-400' : 'text-rose-400'} font-black`}>{isSkipped ? 'Not Attempted' : `Option ${String.fromCharCode(65 + (userAns || 0))}`}</p></div>
                           </div>
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}

      {view === 'history' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between px-4">
              <div><h2 className="text-3xl font-black text-slate-900 tracking-tighter">Neural Archive</h2><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Past Simulation Sequences</p></div>
              <div className="p-3 bg-slate-50 text-slate-400 rounded-xl"><History size={20}/></div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.govMockHistory.map(mock => (
                <div key={mock.id} onClick={() => { setCurrentMock(mock); setView('result'); }} className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{mock.exam} Mock</h4>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{mock.subject}: {mock.topic}</p>
                      </div>
                      <span className="text-3xl font-black text-indigo-600">{mock.score}</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 mb-8 px-2">
                      <div className="flex items-center gap-2"><Clock size={12}/> {new Date(mock.startTime).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2 text-indigo-600"><Languages size={12}/> {mock.language}</div>
                   </div>
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(mock.score/mock.totalMarks)*100}%` }}></div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {view === 'notebook' && (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
           <div className="bg-rose-600 rounded-[44px] md:rounded-[64px] p-8 md:p-16 text-white flex flex-col md:flex-row items-center gap-12 relative overflow-hidden shadow-2xl">
              <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
                 <div className="space-y-2">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">Error Repository</h2>
                    <p className="text-rose-200 font-bold text-sm md:text-base uppercase tracking-[0.3em] opacity-80">Neural Improvement Loop</p>
                 </div>
                 <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <button 
                        onClick={() => reattemptMistakes(state.mistakeNotebook)}
                        disabled={state.mistakeNotebook.length === 0}
                        className="px-8 py-4 bg-white text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Zap size={18}/> Re-attempt Failures
                    </button>
                 </div>
              </div>
              <div className="w-40 h-40 md:w-56 md:h-56 bg-white/10 rounded-full flex items-center justify-center border border-white/20 relative z-10 shadow-2xl"><AlertTriangle size={80} className="text-rose-200" /></div>
           </div>

           <div className="flex items-center justify-between px-4">
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                 {['all', 'Conceptual', 'Factual', 'Calculation'].map(cat => (
                   <button key={cat} onClick={() => setNotebookFilter(cat)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${notebookFilter === cat ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{cat}</button>
                 ))}
              </div>
              <button onClick={() => {if(confirm("Purge Archive?")) setState(p=>({...p, mistakeNotebook: []}))}} className="p-3 bg-white text-rose-500 rounded-xl shadow-sm border border-slate-100 hover:bg-rose-50 active:scale-95 transition-all"><Trash2 size={20}/></button>
           </div>

           <div className="space-y-6">
              {state.mistakeNotebook.filter(m => notebookFilter === 'all' || m.category === notebookFilter).map(mistake => (
                <div key={mistake.id} className="bg-white p-8 md:p-12 rounded-[44px] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative group overflow-hidden">
                   <div className="flex justify-between items-start mb-8">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em]">Module: {mistake.question.topic}</p>
                         <h4 className="text-lg md:text-xl font-black text-slate-900 leading-tight">{mistake.question.text}</h4>
                      </div>
                      <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{mistake.category}</span>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                         <p className="text-[9px] font-black uppercase text-rose-400 mb-2">Previous Deviation</p>
                         <p className="text-sm font-bold text-rose-900">{mistake.question.options[mistake.userAnswerIndex]}</p>
                      </div>
                      <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                         <p className="text-[9px] font-black uppercase text-emerald-400 mb-2">Neural Solution</p>
                         <p className="text-sm font-bold text-emerald-900">{mistake.question.options[mistake.question.correctIndex]}</p>
                      </div>
                   </div>

                   <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                      <div className="flex items-center gap-2 text-indigo-400 mb-4"><Sparkles size={16}/><h5 className="text-[9px] font-black uppercase tracking-widest">Correction Sync</h5></div>
                      <p className="text-xs md:text-sm leading-relaxed text-slate-600 italic font-medium">{mistake.question.explanation}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default GovExamMock;
