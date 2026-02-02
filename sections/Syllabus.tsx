
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Plus, Flame, Brain, Info, AlertCircle, 
  CalendarClock, Search, Filter, MoreVertical, Layers,
  ChevronRight, ArrowUpRight, Zap, Target, BookOpen,
  Map, Star, RefreshCw, AlertTriangle, ShieldAlert,
  ChevronDown, Trash2, Edit3, Clock, BarChart2, X as XIcon,
  Bell, BellRing, History, Timer
} from 'lucide-react';
import { AppState, SyllabusNode, Subject, StudySession, MockTest, Reminder } from '../types';
import { SYLLABUS_STAGES, SUBJECT_COLORS } from '../constants';

interface SyllabusProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Syllabus: React.FC<SyllabusProps> = ({ state, setState }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(state.subjects[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'due'>('all');
  
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [parentIdForNewTopic, setParentIdForNewTopic] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');

  const activeSubject = useMemo(() => 
    state.subjects.find(s => s.id === selectedSubjectId), 
    [state.subjects, selectedSubjectId]
  );

  // Helper to recursively calculate total stages and completed stages in a node tree
  const getNodeStats = (node: SyllabusNode): { total: number, done: number } => {
    let total = SYLLABUS_STAGES.length;
    let done = node.stages.filter(Boolean).length;
    if (node.subTopics && node.subTopics.length > 0) {
      node.subTopics.forEach(sub => {
        const stats = getNodeStats(sub);
        total += stats.total;
        done += stats.done;
      });
    }
    return { total, done };
  };

  const calculateNodeProgress = (node: SyllabusNode): number => {
    const { total, done } = getNodeStats(node);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const activeSubjectMastery = useMemo(() => {
    if (!activeSubject) return 0;
    const nodes = state.syllabus[activeSubject.name] || [];
    let total = 0, done = 0;
    nodes.forEach(node => {
      const stats = getNodeStats(node);
      total += stats.total;
      done += stats.done;
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [state.syllabus, activeSubject]);

  const topics = useMemo(() => {
    const raw = (activeSubject ? state.syllabus[activeSubject.name] || [] : [])
      .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterMode === 'due') {
      const today = new Date().setHours(0,0,0,0);
      return raw.filter(t => t.nextRevisionDate && t.nextRevisionDate <= today);
    }
    return raw;
  }, [activeSubject, state.syllabus, searchQuery, filterMode]);

  const globalMastery = useMemo(() => {
    let total = 0, done = 0;
    (Object.values(state.syllabus) as SyllabusNode[][]).forEach((nodes: SyllabusNode[]) => {
      nodes.forEach(node => {
        const stats = getNodeStats(node);
        total += stats.total;
        done += stats.done;
      });
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [state.syllabus]);

  const handleToggleStage = (nodeId: string, stageIdx: number) => {
    setState(prev => {
      const newSyllabus = { ...prev.syllabus };
      if (!activeSubject) return prev;
      const updateNodeInList = (list: SyllabusNode[]): SyllabusNode[] => {
        return list.map(node => {
          if (node.id === nodeId) {
            const newStages = [...node.stages];
            const newVal = !newStages[stageIdx];
            newStages[stageIdx] = newVal;
            
            // Basic Spaced Repetition Logic (Simple example)
            let nextRev = node.nextRevisionDate;
            if (newVal) {
              const days = [1, 1, 1, 3, 7, 7, 15, 30, 30, 60, 60, 90, 90, 180];
              nextRev = Date.now() + (days[stageIdx] * 24 * 60 * 60 * 1000);
            }

            return { 
              ...node, 
              stages: newStages, 
              lastRevisionDate: Date.now(),
              nextRevisionDate: nextRev 
            };
          }
          if (node.subTopics) return { ...node, subTopics: updateNodeInList(node.subTopics) };
          return node;
        });
      };
      newSyllabus[activeSubject.name] = updateNodeInList(newSyllabus[activeSubject.name] || []);
      return { ...prev, syllabus: newSyllabus };
    });
  };

  const renderSyllabusNode = (node: SyllabusNode, depth: number = 0) => {
    const isExpanded = expandedNodes[node.id];
    const progress = calculateNodeProgress(node);
    const today = new Date().setHours(0,0,0,0);
    const isDue = node.nextRevisionDate && node.nextRevisionDate <= today;

    return (
      <div key={node.id} className={`space-y-4 animate-in slide-in-from-left-2 duration-300 ${depth > 0 ? 'ml-4 md:ml-10 border-l-2 border-slate-100 pl-4 md:pl-8 my-3' : ''}`}>
        <div className={`bg-white rounded-[32px] md:rounded-[48px] border shadow-sm transition-all duration-300 hover:shadow-xl group ${isDue ? 'border-rose-300 bg-rose-50/20 shadow-rose-100 ring-2 ring-rose-500/10' : 'border-slate-100'}`}>
          <div className="p-5 md:p-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setExpandedNodes(prev => ({...prev, [node.id]: !prev[node.id]}))} className="p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-90">
                  {node.subTopics && node.subTopics.length > 0 ? (isExpanded ? <ChevronDown size={20}/> : <ChevronRight size={20}/>) : <div className="w-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate">{node.name}</h4>
                    {isDue && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-rose-600 text-white text-[8px] font-black uppercase rounded-full animate-pulse shadow-lg shadow-rose-200">
                        <Timer size={10}/> Revision Due
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400">
                      <History size={12}/> Last Sync: {node.lastRevisionDate ? new Date(node.lastRevisionDate).toLocaleDateString() : 'Initial State'}
                    </div>
                    {node.nextRevisionDate && (
                      <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${isDue ? 'text-rose-500' : 'text-emerald-500'}`}>
                        <CalendarClock size={12}/> Next Wave: {new Date(node.nextRevisionDate).toLocaleDateString()}
                      </div>
                    )}
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{progress}% Mastery</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 px-1">
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                   <div className={`h-full transition-all duration-1000 ease-out rounded-full ${isDue ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>

            <div className="w-full xl:w-auto overflow-x-auto no-scrollbar py-1">
              <div className="grid grid-cols-7 sm:grid-cols-7 lg:grid-cols-14 gap-1.5 min-w-[280px]">
                {SYLLABUS_STAGES.map((stageName, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleToggleStage(node.id, idx)} 
                    title={stageName}
                    className={`h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center transition-all active:scale-90 relative ${node.stages[idx] ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 border border-transparent hover:border-indigo-100 group/stage'}`}
                  >
                    {node.stages[idx] ? <CheckCircle2 size={16}/> : <span className="text-[10px] font-black">{idx + 1}</span>}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[8px] font-black uppercase rounded opacity-0 pointer-events-none group-hover/stage:opacity-100 transition-opacity whitespace-nowrap z-20">
                      {stageName}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 w-full xl:w-auto justify-end border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-50">
              <button onClick={() => { setParentIdForNewTopic(node.id); setIsAddTopicModalOpen(true); }} className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Add Sub-topic"><Plus size={20}/></button>
              <button onClick={() => {
                if(confirm("CRITICAL: Deleting this node will purge all historical data for this branch. Proceed?")) {
                  setState(prev => {
                    const newSyllabus = { ...prev.syllabus };
                    const removeFromList = (list: SyllabusNode[]): SyllabusNode[] => list.filter(n => n.id !== node.id).map(n => ({...n, subTopics: n.subTopics ? removeFromList(n.subTopics) : []}));
                    newSyllabus[activeSubject!.name] = removeFromList(newSyllabus[activeSubject!.name] || []);
                    return { ...prev, syllabus: newSyllabus };
                  });
                }
              }} className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all" title="Purge Node"><Trash2 size={20}/></button>
            </div>
          </div>
        </div>
        {isExpanded && node.subTopics?.map(sub => renderSyllabusNode(sub, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24 px-2 md:px-0">
      {/* Header Stat Card */}
      <div className="bg-slate-900 rounded-[44px] md:rounded-[64px] p-8 md:p-16 text-white shadow-2xl flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <div className="flex-1 text-center md:text-left relative z-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">Neural Roadmap</h2>
            <p className="text-indigo-400 font-bold text-sm md:text-base uppercase tracking-[0.4em] opacity-80">Universal Coverage Matrix</p>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Active Subject</p>
                <p className="text-2xl font-black">{activeSubject?.name}</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${activeSubjectMastery}%` }}></div>
                   </div>
                   <span className="text-xs font-black">{activeSubjectMastery}%</span>
                </div>
             </div>
             
             <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase text-rose-400 mb-1">Action items</p>
                <p className="text-2xl font-black text-rose-500">
                  {(Object.values(state.syllabus) as SyllabusNode[][]).flat().filter(n => n.nextRevisionDate && n.nextRevisionDate <= new Date().setHours(0,0,0,0)).length} Due
                </p>
                <p className="text-[9px] font-bold opacity-40 uppercase mt-2">Strategic re-sync required</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto md:mx-0">
            <button onClick={() => setFilterMode('all')} className={`p-5 rounded-[28px] border transition-all flex flex-col items-center gap-2 ${filterMode === 'all' ? 'bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}><Layers size={22}/><span className="text-[10px] font-black uppercase tracking-widest">Full Index</span></button>
            <button onClick={() => setFilterMode('due')} className={`p-5 rounded-[28px] border transition-all flex flex-col items-center gap-2 ${filterMode === 'due' ? 'bg-rose-600 text-white border-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.4)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}><RefreshCw size={22}/><span className="text-[10px] font-black uppercase tracking-widest">Revision Due</span></button>
          </div>
        </div>
        
        <div className="w-44 h-44 md:w-64 md:h-64 relative flex items-center justify-center shrink-0 z-10 group">
          <svg className="w-full h-full -rotate-90">
            <circle cx="50%" cy="50%" r="42%" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
            <circle cx="50%" cy="50%" r="42%" stroke="#6366f1" strokeWidth="12" fill="none" strokeDasharray="300" strokeDashoffset={300 - (300 * globalMastery) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(99,102,241,0.5)]"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl md:text-6xl font-black tracking-tighter group-hover:scale-110 transition-transform">{globalMastery}%</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Syllabus Mastery</span>
          </div>
          <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* Subject Tab Bar */}
      <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-100 overflow-x-auto no-scrollbar shadow-sm sticky top-0 md:top-4 z-40 backdrop-blur-md bg-white/80">
        {state.subjects.map(sub => {
           // Calculate mastery for this specific tab badge
           const subNodes = state.syllabus[sub.name] || [];
           let t = 0, d = 0;
           subNodes.forEach(node => {
             const s = getNodeStats(node);
             t += s.total; d += s.done;
           });
           const mastery = t > 0 ? Math.round((d / t) * 100) : 0;
           
           return (
            <button key={sub.id} onClick={() => setSelectedSubjectId(sub.id)} className={`px-6 py-3.5 rounded-[18px] text-xs font-black whitespace-nowrap transition-all flex items-center gap-3 ${selectedSubjectId === sub.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}>
              <span>{sub.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${selectedSubjectId === sub.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{mastery}%</span>
            </button>
           );
        })}
      </div>

      <div className="flex items-center justify-between px-4 mt-12 mb-6">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-600"/>
            Active Logic Branches
          </h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Syllabus Partition: {activeSubject?.name}</p>
        </div>
        <button onClick={() => { setParentIdForNewTopic(null); setIsAddTopicModalOpen(true); }} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2 active:scale-95">
          <Plus size={16}/> Root Node
        </button>
      </div>

      <div className="space-y-6">
        {topics.map(topic => renderSyllabusNode(topic))}
        {topics.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-[44px] border-2 border-dashed border-slate-200 animate-in fade-in zoom-in-95">
             <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No nodes identified in this branch</p>
             <p className="text-slate-300 text-[10px] font-bold uppercase mt-2">Initialize root nodes to begin tracking</p>
          </div>
        )}
      </div>

      {isAddTopicModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddTopicModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[44px] p-8 md:p-12 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-2xl font-black tracking-tight">Expand Matrix</h3>
              <button onClick={() => setIsAddTopicModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><XIcon size={28}/></button>
            </div>
            <div className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Node Name</label>
                 <input type="text" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="e.g. Fundamental Rights"/>
               </div>
               <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Info size={12}/> Placement</p>
                 <p className="text-[11px] font-bold text-indigo-900 mt-1">This will be added as a {parentIdForNewTopic ? 'sub-topic' : 'root topic'} under {activeSubject?.name}.</p>
               </div>
            </div>
            <button onClick={() => { 
                if(!newTopicName.trim()) return;
                const newNode: SyllabusNode = { 
                  id: Math.random().toString(36).substr(2, 9), 
                  name: newTopicName, 
                  stages: Array(14).fill(false), 
                  stageTimestamps: Array(14).fill(null), 
                  confidence: 1, 
                  difficulty: 'moderate', 
                  weightage: 'Medium', 
                  expectedQuestions: 0, 
                  revisionLevel: 0, 
                  subTopics: [],
                  lastRevisionDate: Date.now()
                };
                setState(prev => {
                  const newSyllabus = { ...prev.syllabus };
                  if (parentIdForNewTopic === null) newSyllabus[activeSubject!.name] = [...(newSyllabus[activeSubject!.name] || []), newNode];
                  else {
                    const insert = (list: SyllabusNode[]): SyllabusNode[] => list.map(n => n.id === parentIdForNewTopic ? {...n, subTopics: [...(n.subTopics || []), newNode]} : {...n, subTopics: n.subTopics ? insert(n.subTopics) : []});
                    newSyllabus[activeSubject!.name] = insert(newSyllabus[activeSubject!.name] || []);
                  }
                  return { ...prev, syllabus: newSyllabus };
                });
                setIsAddTopicModalOpen(false); setNewTopicName('');
            }} className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all shadow-indigo-200">Construct Node</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Syllabus;
