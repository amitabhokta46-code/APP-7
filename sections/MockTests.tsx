
import React, { useState, useMemo } from 'react';
import { 
  Trophy, Target, TrendingUp, AlertCircle, Plus, ChevronRight, 
  Brain, Clock, ShieldCheck, Search, Filter, Save, X, ClipboardList, Trash2,
  BrainCircuit, FileText, Sparkles, RefreshCw, BarChart3, PieChart as PieIcon,
  ArrowUpRight, Info, History, LayoutGrid, CheckCircle2, XCircle, HelpCircle,
  RotateCcw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, 
  Scatter, ZAxis, Legend, ReferenceLine, AreaChart, Area
} from 'recharts';
import { AppState, MockTest, MockMistake, SyllabusNode, GovMockInstance } from '../types';
import { analyzeMockMistakes } from '../services/gemini';

interface MockTestsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

type Tab = 'all' | 'ai' | 'manual' | 'stats';

const MockTests: React.FC<MockTestsProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [inspectingTest, setInspectingTest] = useState<any | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const [newTest, setNewTest] = useState<Partial<MockTest>>({
    name: '',
    type: 'Full Length',
    totalMarks: 100,
    scoreObtained: 0,
    timeTaken: 60,
    timeLimit: 60,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    unattempted: 0,
    errorCategories: { conceptual: 0, calculation: 0, guessing: 0, timePressure: 0, silly: 0 }
  });

  // UNIFY AND NORMALIZE HISTORY
  const unifiedHistory = useMemo(() => {
    const manual = state.mockTests.map(t => ({
      ...t,
      sourceType: 'Manual' as const,
      displayScore: t.scoreObtained,
      displayTotal: t.totalMarks,
      displaySubject: state.subjects.find(s => s.id === t.subjectId)?.name || 'General'
    }));

    const ai = state.govMockHistory.map(t => ({
      ...t,
      sourceType: 'AI' as const,
      displayScore: t.score,
      displayTotal: t.totalMarks,
      displaySubject: t.subject,
      timestamp: t.startTime // Standardizing timestamp key
    }));

    const merged = [...manual, ...ai].sort((a, b) => b.timestamp - a.timestamp);

    if (activeTab === 'ai') return merged.filter(m => m.sourceType === 'AI');
    if (activeTab === 'manual') return merged.filter(m => m.sourceType === 'Manual');
    return merged;
  }, [state.mockTests, state.govMockHistory, activeTab, state.subjects]);

  const statsData = useMemo(() => {
    return unifiedHistory.slice().reverse().map(t => ({
      name: new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      score: (t.displayScore / t.displayTotal) * 100,
      raw: t.displayScore
    }));
  }, [unifiedHistory]);

  const saveManualTest = () => {
    if (!newTest.name || !newTest.subjectId) {
      alert("Missing mission parameters: Subject and Title required.");
      return;
    }
    const test: MockTest = { 
      ...newTest as MockTest, 
      id: Math.random().toString(36).substr(2, 9), 
      timestamp: Date.now(),
      mistakes: []
    };
    
    setState(prev => ({ ...prev, mockTests: [test, ...prev.mockTests] }));
    setIsEntryOpen(false);
    setNewTest({ name: '', totalMarks: 100, scoreObtained: 0 });
  };

  const handleDeepAnalysis = async (test: any) => {
    setIsSynthesizing(true);
    // AI Mock specific analysis logic
    const report = await analyzeMockMistakes(test);
    setState(prev => ({
      ...prev,
      govMockHistory: prev.govMockHistory.map(t => t.id === test.id ? { ...t, aiAnalysis: report } : t),
      mockTests: prev.mockTests.map(t => t.id === test.id ? { ...t, aiAnalysis: report } : t)
    }));
    setInspectingTest({ ...test, aiAnalysis: report });
    setIsSynthesizing(false);
  };

  return (
    <div className="space-y-8 pb-24 px-2 md:px-0">
      {/* Header Stat Area */}
      <div className="bg-slate-900 rounded-[44px] md:rounded-[64px] p-8 md:p-16 text-white shadow-2xl flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
           <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.5em] mb-2">Neural Archive</p>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">Simulation Logs</h2>
           </div>
           <p className="text-slate-400 font-medium text-sm md:text-lg max-w-xl">Comprehensive historical audit of all manual and AI-synthesized examination sequences.</p>
           <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button onClick={() => setIsEntryOpen(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"><Plus size={18}/> Log Offline Test</button>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 shrink-0 relative z-10">
           <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] text-center backdrop-blur-sm">
              <p className="text-4xl font-black tracking-tighter">{unifiedHistory.length}</p>
              <p className="text-[9px] font-black uppercase text-slate-500 mt-1">Total Cycles</p>
           </div>
           <div className="p-6 bg-indigo-600/20 border border-indigo-500/30 rounded-[32px] text-center backdrop-blur-sm">
              <p className="text-4xl font-black tracking-tighter text-indigo-400">{state.govMockHistory.length}</p>
              <p className="text-[9px] font-black uppercase text-indigo-300 mt-1">AI Simulations</p>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-100 w-fit shadow-sm overflow-x-auto no-scrollbar max-w-full">
         {[
           { id: 'all', label: 'Universal Archive', icon: <History size={16}/> },
           { id: 'ai', label: 'Neural AI Tests', icon: <BrainCircuit size={16}/> },
           { id: 'manual', label: 'Manual Entries', icon: <ClipboardList size={16}/> },
           { id: 'stats', label: 'Trend Matrix', icon: <TrendingUp size={16}/> }
         ].map(t => (
           <button 
             key={t.id} 
             onClick={() => setActiveTab(t.id as Tab)}
             className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-700'}`}
           >
             {t.icon} {t.label}
           </button>
         ))}
      </div>

      {activeTab === 'stats' ? (
        <div className="bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black">Accuracy Propagation</h3>
              <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest"><TrendingUp size={16}/> Growth Delta: +12%</div>
           </div>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={statsData}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} unit="%" />
                    <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#scoreColor)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
           {unifiedHistory.map((test, idx) => (
             <div 
               key={test.id} 
               onClick={() => setInspectingTest(test)}
               className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
             >
                <div className="flex justify-between items-start mb-6">
                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${test.sourceType === 'AI' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {test.sourceType === 'AI' ? 'Neural Simulation' : 'Manual Entry'}
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase">{new Date(test.timestamp).toLocaleDateString()}</span>
                </div>
                
                <div className="space-y-2 mb-8">
                   <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{test.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{test.displaySubject}</p>
                </div>

                <div className="flex items-end justify-between">
                   <div>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{test.displayScore}<span className="text-sm text-slate-300 font-bold ml-1">/ {test.displayTotal}</span></p>
                      <p className="text-[9px] font-black uppercase text-slate-400 mt-1">Final SECURED SCORE</p>
                   </div>
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><ArrowUpRight size={24}/></div>
                </div>

                {test.aiAnalysis && (
                  <div className="mt-6 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-indigo-600">
                       <Sparkles size={14} className="animate-pulse" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Neural Intel Available</span>
                    </div>
                  </div>
                )}
             </div>
           ))}
           {unifiedHistory.length === 0 && (
             <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[64px] border-2 border-dashed border-slate-200">
                <Trophy size={64} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">No Simulation Patterns Recorded</p>
                <p className="text-slate-300 text-xs font-bold uppercase mt-2">Initialize simulations via Gov Test AI or log external mocks</p>
             </div>
           )}
        </div>
      )}

      {/* Inspect Modal */}
      {inspectingTest && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-2xl animate-in fade-in" onClick={() => setInspectingTest(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[48px] md:rounded-[64px] p-8 md:p-16 shadow-2xl space-y-12 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-start border-b pb-8">
                <div>
                   <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Pattern Inspection: {inspectingTest.sourceType}</span>
                   <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{inspectingTest.name}</h3>
                   <div className="flex items-center gap-4 mt-4 text-[10px] font-black uppercase text-slate-400">
                      <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(inspectingTest.timestamp).toLocaleString()}</span>
                      <span className="flex items-center gap-1.5"><Target size={14}/> {inspectingTest.displaySubject}</span>
                   </div>
                </div>
                <button onClick={() => setInspectingTest(null)} className="p-3 text-slate-200 hover:text-rose-500 transition-colors"><X size={40}/></button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 text-center">
                   <p className="text-5xl font-black text-slate-900 tracking-tighter">{inspectingTest.displayScore}</p>
                   <p className="text-[10px] font-black uppercase text-slate-400 mt-2">Score Secured</p>
                </div>
                <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100 text-center">
                   <p className="text-5xl font-black text-emerald-600 tracking-tighter">{Math.round((inspectingTest.displayScore/inspectingTest.displayTotal)*100)}%</p>
                   <p className="text-[10px] font-black uppercase text-emerald-400 mt-2">Accuracy Index</p>
                </div>
                <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 text-center">
                   <p className="text-5xl font-black text-indigo-600 tracking-tighter">{inspectingTest.timeTaken || inspectingTest.questions?.length || '--'}</p>
                   <p className="text-[10px] font-black uppercase text-indigo-400 mt-2">Energy (Mins)</p>
                </div>
                <div className="p-8 bg-slate-900 rounded-[40px] text-center">
                   <p className="text-5xl font-black text-white tracking-tighter">{inspectingTest.correct || inspectingTest.questions?.length || '--'}</p>
                   <p className="text-[10px] font-black uppercase text-slate-500 mt-2">Total Solved</p>
                </div>
             </div>

             {inspectingTest.aiAnalysis ? (
                <div className="p-10 bg-indigo-50 rounded-[48px] border border-indigo-100 relative overflow-hidden group">
                   <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3 text-indigo-600">
                         <BrainCircuit size={28}/>
                         <h5 className="text-xl font-black uppercase tracking-tight">AI Neural Feedback</h5>
                      </div>
                      <p className="text-slate-700 font-bold text-lg leading-relaxed">{inspectingTest.aiAnalysis}</p>
                   </div>
                   <div className="absolute -right-20 -bottom-20 text-indigo-200/20 group-hover:scale-110 transition-transform"><Brain size={300}/></div>
                </div>
             ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[48px]">
                   <button 
                     onClick={() => handleDeepAnalysis(inspectingTest)}
                     disabled={isSynthesizing}
                     className="px-10 py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-4 mx-auto hover:bg-indigo-600 transition-all active:scale-95"
                   >
                     {isSynthesizing ? <RefreshCw className="animate-spin" size={24}/> : <Sparkles size={24}/>}
                     {isSynthesizing ? 'Synthesizing Neural Strategy...' : 'Synthesize AI Performance Strategy'}
                   </button>
                </div>
             )}

             <div className="flex justify-end gap-4 border-t pt-10">
                <button onClick={() => {
                  if(confirm("Expunge simulation from memory?")) {
                    setState(p => ({
                      ...p,
                      govMockHistory: p.govMockHistory.filter(h => h.id !== inspectingTest.id),
                      mockTests: p.mockTests.filter(h => h.id !== inspectingTest.id)
                    }));
                    setInspectingTest(null);
                  }
                }} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={24}/></button>
                <button onClick={() => setInspectingTest(null)} className="px-10 py-5 bg-slate-100 rounded-3xl font-black uppercase text-xs tracking-widest text-slate-500 hover:bg-slate-200 transition-all">Close Module</button>
             </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {isEntryOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsEntryOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[48px] p-10 md:p-14 shadow-2xl space-y-10 animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center border-b pb-8">
                <h3 className="text-3xl font-black tracking-tighter">Log External Test</h3>
                <button onClick={() => setIsEntryOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={32}/></button>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Test Designation</label>
                   <input 
                     value={newTest.name} 
                     onChange={e => setNewTest({...newTest, name: e.target.value})} 
                     className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                     placeholder="e.g. Vision IAS Mock 4"
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Focus Domain</label>
                      <select 
                        value={newTest.subjectId} 
                        onChange={e => setNewTest({...newTest, subjectId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-xs outline-none"
                      >
                         <option value="">Select Domain</option>
                         {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Mock Type</label>
                      <select 
                        value={newTest.type} 
                        onChange={e => setNewTest({...newTest, type: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-xs outline-none"
                      >
                         <option>Full Length</option>
                         <option>Sectional</option>
                         <option>Topic Wise</option>
                         <option>Previous Year</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Secured Score</label>
                      <input 
                        type="number" 
                        value={newTest.scoreObtained} 
                        onChange={e => setNewTest({...newTest, scoreObtained: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black text-lg text-center focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Maximum Marks</label>
                      <input 
                        type="number" 
                        value={newTest.totalMarks} 
                        onChange={e => setNewTest({...newTest, totalMarks: parseFloat(e.target.value) || 200})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black text-lg text-center focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                   </div>
                </div>
             </div>

             <button 
                onClick={saveManualTest}
                className="w-full py-7 bg-indigo-600 text-white rounded-[36px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all shadow-indigo-100 flex items-center justify-center gap-4"
             >
                <Save size={20}/> Synchronize Archive
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTests;
