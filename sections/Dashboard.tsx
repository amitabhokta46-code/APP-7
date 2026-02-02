
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, ArrowUpRight, CheckCircle2, Moon, Activity, 
  Clock, Layers, ShieldCheck, Brain, ChevronRight, 
  Flame, Trophy, AlertTriangle, Target, Calendar,
  Star, Timer, Zap, History, Info, HeartPulse, RefreshCw,
  Plus, AlertCircle, TrendingUp, ShieldAlert, Gauge,
  ArrowRight, LayoutDashboard, ListTodo, ClipboardCheck,
  ZapOff, Droplets, Thermometer, ExternalLink,
  BookOpen, CircleCheck, LayoutGrid, Bell, BellRing,
  MessageSquare, Send, X, Bot, Rocket, Shield, Trash2,
  CalendarDays, Flag, Hourglass, CalendarRange
} from 'lucide-react';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, 
  Legend, AreaChart, Area, ReferenceLine, ScatterChart, Scatter
} from 'recharts';
import { AppSection, AppState, SyllabusNode, ExamPhase, Task, MockTest, AIChatMessage, ExamGoal } from '../types';
import { getAIInsights, getNeuralAssistantChat } from '../services/gemini';

interface DashboardProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onNavigate: (section: AppSection) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, setState, onNavigate }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // New Exam Form State
  const [newExam, setNewExam] = useState<Partial<ExamGoal>>({
    name: '',
    date: Date.now() + 86400000 * 30,
    priority: 'Medium',
    type: 'Prelims'
  });

  // Countdown Logic for Primary Exam
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, state.examDate - now);
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [state.examDate]);

  // Strategic Countdown Data
  const countdownMeta = useMemo(() => {
    const daysLeft = timeLeft.days;
    const weeksLeft = Math.floor(daysLeft / 7);
    const totalPotentialStudyHours = daysLeft * (state.profile.dailyGoalHours || 8);
    
    // Estimate weekends left
    let weekends = 0;
    const d = new Date();
    for (let i = 0; i < daysLeft; i++) {
      const day = d.getDay();
      if (day === 0 || day === 6) weekends++;
      d.setDate(d.getDate() + 1);
    }

    let phase = "Foundation";
    let phaseColor = "text-emerald-500";
    let phaseBg = "bg-emerald-50";
    let urgency = "Standard Protocol";

    if (daysLeft < 15) {
      phase = "Final Sprint";
      phaseColor = "text-rose-600";
      phaseBg = "bg-rose-50";
      urgency = "MAXIMUM URGENCY";
    } else if (daysLeft < 30) {
      phase = "Rapid Revision";
      phaseColor = "text-orange-600";
      phaseBg = "bg-orange-50";
      urgency = "Critical Focus";
    } else if (daysLeft < 90) {
      phase = "Intensification";
      phaseColor = "text-indigo-600";
      phaseBg = "bg-indigo-50";
      urgency = "High Priority";
    }

    return { weeksLeft, weekends, totalPotentialStudyHours, phase, phaseColor, phaseBg, urgency };
  }, [timeLeft, state.profile.dailyGoalHours]);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      const res = await getAIInsights(state);
      setInsights(res);
      setLoadingInsights(false);
    };
    fetchInsights();
  }, [state]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [state.aiChatHistory]);

  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: AIChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
    setIsChatLoading(true);
    setChatInput('');
    const response = await getNeuralAssistantChat(chatInput, [...(state.aiChatHistory || []), userMsg], state);
    setIsChatLoading(false);
  };

  const correlationData = useMemo(() => {
    return state.sleepSessions.map(sleep => {
      const dayStart = new Date(sleep.timestamp).setHours(0,0,0,0);
      const studyMins = state.studySessions
        .filter(s => new Date(s.timestamp).setHours(0,0,0,0) === dayStart)
        .reduce((acc, s) => acc + s.duration, 0);
      return { x: sleep.duration, y: studyMins, quality: sleep.quality };
    });
  }, [state.sleepSessions, state.studySessions]);

  const revisionDue = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const due: string[] = [];
    (Object.values(state.syllabus) as SyllabusNode[][]).forEach(nodes => {
      nodes.forEach(node => {
        if (node.nextRevisionDate && node.nextRevisionDate <= today) due.push(node.name);
      });
    });
    return due;
  }, [state.syllabus]);

  const readinessIndex = 72;

  const updateExamDate = (dateStr: string) => {
    const newDate = new Date(dateStr).getTime();
    if (!isNaN(newDate)) {
      setState(prev => ({ ...prev, examDate: newDate }));
      setShowDatePicker(false);
    }
  };

  const addExtraExam = () => {
    if (!newExam.name) return;
    const exam: ExamGoal = {
      id: Math.random().toString(36).substr(2, 9),
      name: newExam.name,
      date: newExam.date || Date.now(),
      priority: newExam.priority as any,
      type: newExam.type as any,
      status: 'Upcoming',
      totalHoursRequired: 500,
      totalSyllabusUnits: 10,
      restDaysPerWeek: 1
    };
    setState(prev => ({ ...prev, exams: [exam, ...prev.exams] }));
    setIsAddExamModalOpen(false);
    setNewExam({ name: '', priority: 'Medium', type: 'Prelims' });
  };

  const removeExam = (id: string) => {
    setState(prev => ({ ...prev, exams: prev.exams.filter(e => e.id !== id) }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-24 md:pb-8 relative animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="px-2 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Command Center</h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">System Status: Optimization Active</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
             <div className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100">
                <ShieldCheck size={14}/> Readiness: {readinessIndex}%
             </div>
             {revisionDue.length > 0 && (
               <div className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm bg-rose-50 text-rose-600 border-rose-100 animate-pulse">
                 <RefreshCw size={14}/> {revisionDue.length} Revisions Due
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Prominent Mission Countdown - ENHANCED */}
      <div className="bg-white rounded-[44px] md:rounded-[64px] border border-slate-100 shadow-xl overflow-hidden relative group">
        <div className="p-8 md:p-14 flex flex-col xl:flex-row items-start gap-12 relative z-10">
           <div className="flex-1 space-y-8 text-center xl:text-left w-full">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="space-y-2">
                    <div className="flex items-center justify-center xl:justify-start gap-3 text-indigo-600">
                       <Rocket size={24} className="animate-bounce" />
                       <p className="text-[12px] font-black uppercase tracking-[0.4em]">Integrated Intelligence Node</p>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Objective: Final Examination</h2>
                 </div>
                 <div className={`px-6 py-2.5 rounded-full border shadow-sm ${countdownMeta.phaseBg} ${countdownMeta.phaseColor} animate-in zoom-in duration-500`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{countdownMeta.urgency}</p>
                    <p className="text-lg font-black tracking-tight">{countdownMeta.phase}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto xl:mx-0">
                 {[
                    { label: 'Days Left', value: timeLeft.days },
                    { label: 'Hrs Remaining', value: timeLeft.hours },
                    { label: 'Mins Precision', value: timeLeft.minutes },
                    { label: 'Sec Pulse', value: timeLeft.seconds },
                 ].map((unit, i) => (
                    <div key={i} className="bg-slate-50 rounded-[32px] p-6 md:p-8 text-center border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all shadow-sm group-hover:shadow-md">
                       <p className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none mb-2">{unit.value.toString().padStart(2, '0')}</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{unit.label}</p>
                    </div>
                 ))}
              </div>

              {/* Journey Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                 <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white transition-all">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Hourglass size={20}/></div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400">Total Work Hours Left</p>
                       <p className="text-xl font-black text-slate-900 tracking-tight">{countdownMeta.totalPotentialStudyHours} Hrs</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white transition-all">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm"><CalendarRange size={20}/></div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400">Strategic Blocks (Weeks)</p>
                       <p className="text-xl font-black text-slate-900 tracking-tight">{countdownMeta.weeksLeft} Cycles</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white transition-all">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><Activity size={20}/></div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400">Rest Intervals (Weekends)</p>
                       <p className="text-xl font-black text-slate-900 tracking-tight">{countdownMeta.weekends} Units</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="w-full xl:w-80 space-y-6">
              <div className="p-8 bg-slate-900 rounded-[44px] text-white shadow-2xl relative overflow-hidden">
                 <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Terminal Date</p>
                       <Shield size={16} className="text-emerald-400" />
                    </div>
                    <div className="text-xl font-black">
                       {new Date(state.examDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    
                    {/* Visual Journey Bar */}
                    <div className="space-y-2">
                       <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                          <span>Journey Progress</span>
                          <span className="text-indigo-400">Tactical Window</span>
                       </div>
                       <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: `${Math.max(10, 100 - (timeLeft.days / 365 * 100))}%` }}></div>
                       </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                         onClick={() => setShowDatePicker(true)}
                         className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                         Sync Primary
                      </button>
                      <button 
                         onClick={() => setIsAddExamModalOpen(true)}
                         className="p-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-white shadow-lg transition-all"
                         title="Add Extra Objective"
                      >
                         <Plus size={20}/>
                      </button>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              </div>
           </div>
        </div>

        {/* Inline Date Picker Overlay */}
        {showDatePicker && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300">
             <div className="max-w-md w-full space-y-8 text-center">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] mx-auto flex items-center justify-center shadow-inner"><Calendar size={40}/></div>
                <div>
                   <h3 className="text-3xl font-black tracking-tight text-slate-900">Configure Mission</h3>
                   <p className="text-slate-400 text-sm font-medium mt-2">Select the terminal examination date for logic sync.</p>
                </div>
                <input 
                   type="date" 
                   className="w-full bg-slate-50 border border-slate-100 rounded-[32px] px-8 py-5 font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-center text-lg"
                   defaultValue={new Date(state.examDate).toISOString().split('T')[0]}
                   onChange={(e) => updateExamDate(e.target.value)}
                />
                <button onClick={() => setShowDatePicker(false)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel Modification</button>
             </div>
          </div>
        )}
        
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-all"></div>
      </div>

      {/* Extra Exam Targets Grid */}
      {state.exams.length > 0 && (
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <Flag size={20} className="text-slate-400" />
                 <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Secondary Objectives</h3>
              </div>
              <button onClick={() => setIsAddExamModalOpen(true)} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2"><Plus size={14}/> Add New Target</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {state.exams.map(exam => {
                const daysLeft = Math.ceil((exam.date - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={exam.id} className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                       <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getPriorityColor(exam.priority)}`}>
                          {exam.priority} Priority
                       </div>
                       <button onClick={() => removeExam(exam.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                    <div className="space-y-4 relative z-10">
                       <div>
                          <h4 className="font-black text-slate-900 leading-tight truncate">{exam.name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(exam.date).toLocaleDateString()}</p>
                       </div>
                       <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">{daysLeft < 0 ? 0 : daysLeft}</span>
                          <span className="text-[10px] font-black uppercase text-slate-400">Days To Go</span>
                       </div>
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors"></div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddExamModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-lg rounded-[48px] p-10 md:p-14 shadow-2xl space-y-10 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center border-b pb-8">
                 <h3 className="text-3xl font-black tracking-tighter">New Mission Target</h3>
                 <button onClick={() => setIsAddExamModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={32}/></button>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Exam Designation</label>
                    <input 
                      value={newExam.name} 
                      onChange={e => setNewExam({...newExam, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                      placeholder="e.g. UPSC CSE Prelims"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Terminal Date</label>
                       <input 
                         type="date"
                         onChange={e => setNewExam({...newExam, date: new Date(e.target.value).getTime()})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-xs outline-none"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Priority Index</label>
                       <select 
                         value={newExam.priority}
                         onChange={e => setNewExam({...newExam, priority: e.target.value as any})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-xs outline-none"
                       >
                          <option value="High">High (Immediate)</option>
                          <option value="Medium">Medium (Steady)</option>
                          <option value="Low">Low (Long-term)</option>
                       </select>
                    </div>
                 </div>
              </div>

              <button 
                 onClick={addExtraExam}
                 className="w-full py-7 bg-indigo-600 text-white rounded-[36px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all shadow-indigo-100 flex items-center justify-center gap-4"
              >
                 <Plus size={20}/> Synchronize Objective
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Chart Card */}
             <div className="bg-white rounded-[40px] md:rounded-[56px] p-6 md:p-10 border border-slate-100 shadow-sm transition-all hover:shadow-xl group">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-lg md:text-xl font-black text-slate-800">Rest Efficiency</h3>
                   <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors"><Activity size={18} className="text-indigo-600"/></div>
                </div>
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" dataKey="x" name="Sleep" unit="h" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: 'Sleep', position: 'bottom', fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis type="number" dataKey="y" name="Study" unit="m" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} label={{ value: 'Study', angle: -90, position: 'left', fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                          cursor={{ strokeDasharray: '3 3' }} 
                        />
                        <Scatter name="Efficiency" data={correlationData} fill="#6366f1">
                           {correlationData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.quality > 3 ? '#10b981' : '#f59e0b'} />
                           ))}
                        </Scatter>
                      </ScatterChart>
                   </ResponsiveContainer>
                </div>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black uppercase text-slate-400">Restorative</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[9px] font-black uppercase text-slate-400">Sub-optimal</span></div>
                </div>
             </div>

             {/* AI Insights Card */}
             <div className="bg-slate-900 rounded-[40px] md:rounded-[56px] p-8 md:p-12 text-white relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                   <div className="w-12 h-12 bg-white/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md"><Bot size={24}/></div>
                   <h3 className="text-xl md:text-2xl font-black tracking-tight">Neural Protocol</h3>
                   <div className="space-y-4">
                      {loadingInsights ? (
                        <div className="animate-pulse space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-4 bg-white/5 rounded-full w-full"></div>)}</div>
                      ) : (
                        insights.map((ins, i) => (
                          <div key={i} className="flex gap-4 items-start p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                             <p className="text-xs md:text-sm font-medium text-slate-300 leading-relaxed">{ins}</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>
                <div className="absolute -bottom-10 -right-10 text-white/5 opacity-40 group-hover:scale-110 transition-transform duration-1000"><Sparkles size={200}/></div>
             </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
             {[
               { icon: <Timer size={20}/>, label: 'Start Focus', section: AppSection.FOCUS, color: 'text-indigo-600 bg-indigo-50' },
               { icon: <Target size={20}/>, label: 'Syllabus', section: AppSection.SYLLABUS, color: 'text-emerald-600 bg-emerald-50' },
               { icon: <Trophy size={20}/>, label: 'Mock Test', section: AppSection.MOCK_TESTS, color: 'text-rose-600 bg-rose-50' },
               { icon: <BookOpen size={20}/>, label: 'Revise', section: AppSection.STUDY_SLEEP, color: 'text-amber-600 bg-amber-50' },
             ].map((action, i) => (
               <button key={i} onClick={() => onNavigate(action.section)} className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[44px] border border-slate-100 shadow-sm flex flex-col items-center gap-3 transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95 group">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[28px] flex items-center justify-center transition-all group-hover:scale-110 ${action.color}`}>{action.icon}</div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-600">{action.label}</span>
               </button>
             ))}
          </div>
        </div>

        {/* Sidebar / Stats for Desktop */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-[40px] md:rounded-[56px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Flame size={20}/></div>
                 <h3 className="text-xl font-black text-slate-800">Neural Streak</h3>
              </div>
              <div className="text-center py-6">
                 <p className="text-7xl md:text-8xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{state.disciplineStreak}</p>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">Consecutive Days</p>
              </div>
              <div className="pt-4 border-t border-slate-50">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 mb-3 px-2">
                    <span>Performance index</span>
                    <span className="text-indigo-600">Top 2%</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: '88%' }}></div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Floating Chat Interface - Mobile Optimized */}
      <div className={`fixed inset-x-4 bottom-24 md:inset-auto md:bottom-10 md:right-10 z-[200] transition-all duration-500 ${isChatOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'}`}>
         <div className="w-full md:w-96 bg-white rounded-[32px] md:rounded-[44px] shadow-2xl border border-indigo-100 overflow-hidden flex flex-col h-[70vh] md:h-[550px]">
            <div className="bg-indigo-600 p-5 md:p-6 text-white flex justify-between items-center shadow-lg">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20"><Bot size={20}/></div>
                  <div><h4 className="font-black text-sm">Neural Assistant</h4><p className="text-[10px] opacity-70">Synthesizing Query...</p></div>
               </div>
               <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 no-scrollbar bg-slate-50/50">
               {(state.aiChatHistory || []).map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-lg'}`}>
                       {msg.content}
                    </div>
                 </div>
               ))}
               {isChatLoading && <div className="flex justify-start"><div className="bg-white p-4 rounded-3xl border shadow-sm"><div className="flex gap-1.5"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div></div></div></div>}
               <div ref={chatEndRef}></div>
            </div>
            <div className="p-4 bg-white border-t flex gap-3">
               <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleChat()} 
                  placeholder="Ask the Neural Core..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
               />
               <button onClick={handleChat} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-90 transition-all flex items-center justify-center"><Send size={20}/></button>
            </div>
         </div>
      </div>
      
      {/* Floating Chat Trigger */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[200] w-16 h-16 bg-slate-900 text-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all hover:bg-indigo-600">
         {isChatOpen ? <X size={28}/> : <MessageSquare size={28}/>}
         {!isChatOpen && <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-4 border-slate-50 animate-pulse"></span>}
      </button>
    </div>
  );
};

export default Dashboard;
