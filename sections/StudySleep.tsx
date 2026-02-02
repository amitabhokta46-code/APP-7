
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, Square, Moon, Plus, Clock, 
  BarChart3, Activity, AlertCircle, 
  CheckCircle2, X, BookOpen,
  ChevronLeft, ChevronRight, Zap, CalendarDays,
  Target, Award, ZapOff, Star,
  AreaChart as AreaIcon, ShieldCheck, Flame, History,
  TrendingUp, PieChart as PieIcon, Bell, BellRing, Trash2, Save, AlarmClock
} from 'lucide-react';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine, AreaChart, Area, PieChart, Pie,
  Legend
} from 'recharts';
import { AppState, StudySession, SleepSession, Subject, SyllabusNode, Reminder } from '../types';
import { SUBJECT_COLORS } from '../constants';

interface StudySleepProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

type Tab = 'tracker' | 'dashboard' | 'consistency' | 'reminders';

const StudySleep: React.FC<StudySleepProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  
  // SHARED DATE NAVIGATION for both Matrix and Charts
  const [viewDate, setViewDate] = useState(new Date());

  // Study Timer State
  const [isStudying, setIsStudying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState(state.subjects[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Sleep Timer State
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepElapsed, setSleepElapsed] = useState(0);

  // Manual Entry States
  const [isStudyManualModalOpen, setIsStudyManualModalOpen] = useState(false);
  const [isSleepManualModalOpen, setIsSleepManualModalOpen] = useState(false);
  
  const [tempManualStudy, setTempManualStudy] = useState({
    durationHours: 1,
    durationMins: 0,
    subjectId: state.subjects[0]?.id || '',
    date: new Date().toISOString().split('T')[0]
  });

  const [tempManualSleep, setTempManualSleep] = useState({
    durationHours: 8,
    quality: 3,
    date: new Date().toISOString().split('T')[0]
  });

  // Reminder State
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: 'Study Session Prompt',
    time: '09:00',
    type: 'daily',
    soundEnabled: true
  });

  useEffect(() => {
    let interval: number;
    if (isStudying) {
      interval = window.setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying]);

  useEffect(() => {
    let interval: number;
    if (isSleeping) {
      interval = window.setInterval(() => setSleepElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isSleeping]);

  const stopAndSaveStudy = () => {
    if (elapsed > 5) {
      const newSession: StudySession = {
        id: Math.random().toString(36).substr(2, 9),
        subjectId: selectedSubjectId,
        subTopic: notes || 'Deep Focus Block',
        notes,
        duration: Math.floor(elapsed / 60),
        timestamp: Date.now(),
        type: (elapsed / 60) > 50 ? 'deep' : 'light'
      };
      setState(prev => ({ ...prev, studySessions: [newSession, ...prev.studySessions] }));
    }
    setIsStudying(false);
    setElapsed(0);
    setNotes('');
  };

  const stopAndSaveSleep = () => {
    if (sleepElapsed > 30) {
      const hours = parseFloat((sleepElapsed / 3600).toFixed(2));
      const newSession: SleepSession = {
        id: Math.random().toString(36).substr(2, 9),
        duration: hours,
        quality: 3, 
        timestamp: Date.now() - (sleepElapsed * 1000)
      };
      setState(prev => ({ ...prev, sleepSessions: [newSession, ...prev.sleepSessions] }));
    }
    setIsSleeping(false);
    setSleepElapsed(0);
  };

  const addReminder = () => {
    if (!newReminder.title) return;
    const reminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      title: newReminder.title,
      description: 'Neural prompt triggered via Study & Sleep module.',
      time: newReminder.time || '09:00',
      date: new Date().toISOString().split('T')[0],
      type: newReminder.type as any,
      status: 'active',
      soundEnabled: newReminder.soundEnabled ?? true
    };
    setState(prev => ({ ...prev, reminders: [reminder, ...prev.reminders] }));
    setIsAddingReminder(false);
  };

  const deleteReminder = (id: string) => {
    setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayStats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const studyMins = state.studySessions
      .filter(s => new Date(s.timestamp).setHours(0,0,0,0) === today)
      .reduce((acc, s) => acc + s.duration, 0);
    const sleepHours = state.sleepSessions
      .filter(s => new Date(s.timestamp).setHours(0,0,0,0) === today)
      .reduce((acc, s) => acc + s.duration, 0);
    return { studyMins, studyHours: (studyMins / 60).toFixed(1), sleepHours: sleepHours.toFixed(1) };
  }, [state.studySessions, state.sleepSessions]);

  const distributionData = useMemo(() => {
    const data: Record<string, number> = {};
    state.studySessions.forEach(s => {
      const sub = state.subjects.find(sub => sub.id === s.subjectId)?.name || 'General';
      data[sub] = (data[sub] || 0) + s.duration;
    });
    return Object.entries(data).map(([name, value], i) => ({ 
      name, 
      value, 
      color: state.subjects.find(s => s.name === name)?.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length] 
    }));
  }, [state.studySessions, state.subjects]);

  // MONTHLY DATA FOR THE CHART
  const monthChartData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const startOfDay = date.setHours(0, 0, 0, 0);
      
      const studyMins = state.studySessions
        .filter(s => new Date(s.timestamp).setHours(0, 0, 0, 0) === startOfDay)
        .reduce((acc, s) => acc + s.duration, 0);
        
      const sleepH = state.sleepSessions
        .filter(s => new Date(s.timestamp).setHours(0, 0, 0, 0) === startOfDay)
        .reduce((acc, s) => acc + s.duration, 0);
        
      data.push({ 
        day: d,
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        study: parseFloat((studyMins / 60).toFixed(1)), 
        sleep: sleepH 
      });
    }
    return data;
  }, [viewDate, state.studySessions, state.sleepSessions]);

  const monthGridDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Leading padding for the start of the week
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dStr = date.setHours(0,0,0,0);
      const hasStudy = state.studySessions.some(s => new Date(s.timestamp).setHours(0,0,0,0) === dStr);
      const hasSleep = state.sleepSessions.some(s => new Date(s.timestamp).setHours(0,0,0,0) === dStr);
      days.push({ day: d, date, hasStudy, hasSleep });
    }
    return days;
  }, [viewDate, state.studySessions, state.sleepSessions]);

  return (
    <div className="space-y-6 pb-24 px-2 md:px-0">
      {/* Global Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-100 w-fit shadow-sm overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'tracker', label: 'Tracker', icon: <Clock size={16} /> },
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
            { id: 'consistency', label: 'Matrix', icon: <CalendarDays size={16} /> },
            { id: 'reminders', label: 'Alarms', icon: <Bell size={16} /> }
          ].map((t) => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)} 
              className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-800'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Global Month Selection Toggle */}
        {(activeTab === 'dashboard' || activeTab === 'consistency') && (
          <div className="flex items-center bg-white border border-slate-100 p-1.5 rounded-[20px] gap-1 shadow-sm">
             <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft size={18}/></button>
             <span className="text-[10px] font-black uppercase tracking-widest px-4 min-w-[140px] text-center">{viewDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
             <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronRight size={18}/></button>
          </div>
        )}
      </div>

      {activeTab === 'tracker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-8 bg-slate-900 rounded-[44px] md:rounded-[64px] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
            <div className="relative z-10 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight">Focus Immersion</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isStudying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isStudying ? 'Deep Work Cycle' : 'System Standby'}</span>
                  </div>
                </div>
                <button onClick={() => setIsStudyManualModalOpen(true)} title="Manual Log Study" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm transition-all"><Plus size={20}/></button>
              </div>

              <div className="text-center my-12 md:my-16">
                <div className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter tabular-nums drop-shadow-2xl">{formatTime(elapsed)}</div>
                <p className="text-indigo-400 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] mt-4 opacity-60">Chronos Sequence</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Focus Domain</label>
                    <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                      {state.subjects.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Current Objective</label>
                    <input type="text" placeholder="e.g. Chapter 4 Synthesis" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => isStudying ? stopAndSaveStudy() : setIsStudying(true)} className={`flex-1 flex items-center justify-center gap-3 py-5 md:py-7 rounded-[28px] md:rounded-[36px] font-black text-lg md:text-xl transition-all shadow-2xl active:scale-95 ${isStudying ? 'bg-rose-600 text-white shadow-rose-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
                    {isStudying ? <Square size={24} /> : <Play size={24} />}
                    <span>{isStudying ? 'Terminate Session' : 'Initialize Focus'}</span>
                  </button>
                  {isStudying && (
                    <button onClick={() => setIsStudying(false)} className="w-20 md:w-24 flex items-center justify-center bg-amber-500 rounded-[28px] md:rounded-[36px] transition-all text-white shadow-xl active:scale-95"><Pause size={24} /></button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group transition-all hover:shadow-xl">
               <button onClick={() => setIsSleepManualModalOpen(true)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"><Plus size={18} /></button>
               <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Moon size={32} /></div>
               <h3 className="text-xl font-black mb-1 text-slate-800">Neural Reset</h3>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">Restoration Mode</p>
               <div className="text-4xl md:text-5xl font-black tabular-nums my-4 text-slate-900 tracking-tighter">{formatTime(sleepElapsed)}</div>
               <div className="flex gap-3 w-full max-w-[240px]">
                  <button onClick={() => isSleeping ? stopAndSaveSleep() : setIsSleeping(true)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${isSleeping ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-900 text-white shadow-xl'}`}>{isSleeping ? 'Finish Rest' : 'Begin Rest'}</button>
               </div>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex-1">
               <div className="flex justify-between items-center mb-8">
                  <div><h3 className="text-lg font-black text-slate-800">Recent Cycles</h3><p className="text-[10px] font-black uppercase text-slate-400 mt-1">Focus Logs</p></div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-indigo-600">{todayStats.studyHours}h</p>
                    <p className="text-[9px] font-black uppercase text-slate-400">Total Today</p>
                  </div>
               </div>
               <div className="space-y-4 max-h-[250px] overflow-y-auto no-scrollbar">
                 {state.studySessions.slice(0, 5).map((s, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm border border-indigo-50">{s.duration}m</div>
                        <div className="truncate max-w-[140px]"><p className="font-black text-slate-700 text-sm truncate leading-none mb-1">{s.subTopic}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p></div>
                      </div>
                      <Star size={16} className="text-slate-200 group-hover:text-amber-400 transition-colors" />
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3"><PieIcon className="text-indigo-600" /> Topic Saturation (All Time)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3"><AreaIcon className="text-emerald-600" /> Productivity Flux ({viewDate.toLocaleDateString([], { month: 'short' })})</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthChartData}>
                    <defs>
                      <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    <Legend verticalAlign="top" height={36}/>
                    <Area type="monotone" dataKey="study" name="Study (Hrs)" stroke="#6366f1" fillOpacity={1} fill="url(#colorStudy)" strokeWidth={3} />
                    <Area type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="#10b981" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'consistency' && (
        <div className="bg-white p-10 rounded-[44px] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
              <div>
                <h3 className="text-2xl font-black">Adherence Matrix</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Permanent Immersion Log</p>
              </div>
              {/* Note: Month Navigation is handled at the top level for better sync */}
           </div>

           <div className="grid grid-cols-7 gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-black uppercase text-slate-400 text-center mb-2">{d}</div>
              ))}
              {monthGridDays.map((d, i) => (
                <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center border transition-all ${
                  !d ? 'border-transparent' : 
                  d.hasStudy && d.hasSleep ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105' : 
                  d.hasStudy ? 'bg-indigo-200 border-indigo-100 text-indigo-600' :
                  d.hasSleep ? 'bg-emerald-100 border-emerald-50 text-emerald-600' :
                  'bg-slate-50 border-slate-100 text-slate-200 hover:border-slate-300'
                }`}>
                  {d && <span className="text-[10px] font-black">{d.day}</span>}
                </div>
              ))}
           </div>

           <div className="mt-10 flex flex-wrap gap-6 text-[10px] font-black uppercase text-slate-400 tracking-widest justify-center">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Sync Mastery</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-200 rounded-sm"></div> Focus Only</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-100 rounded-sm"></div> Recovery Only</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-50 border border-slate-100 rounded-sm"></div> Inactive</div>
           </div>
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="flex justify-between items-center px-4">
              <div>
                <h3 className="text-2xl font-black">Neural Triggers</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Study & Sleep Prompts</p>
              </div>
              <button 
                onClick={() => setIsAddingReminder(true)} 
                className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus size={24}/> <span className="hidden sm:inline font-black uppercase text-xs">Set Alarm</span>
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.reminders.filter(r => r.status === 'active').map(alarm => (
                <div key={alarm.id} className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><AlarmClock size={28}/></div>
                      <button onClick={() => deleteReminder(alarm.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>
                   </div>
                   <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{alarm.title}</h4>
                   <div className="flex items-center gap-2 text-2xl font-black text-indigo-600 tabular-nums">
                      <Clock size={20} className="text-slate-400"/> {alarm.time}
                   </div>
                   <div className="mt-6 flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${alarm.type === 'daily' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                         {alarm.type} Protocol
                      </span>
                      <div className={`w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></div>
                   </div>
                </div>
              ))}
              {state.reminders.filter(r => r.status === 'active').length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[44px] border-2 border-dashed border-slate-200">
                   <BellRing size={48} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No Active Neural Triggers</p>
                   <p className="text-slate-300 text-[10px] font-bold uppercase mt-2">Initialize alarms to automate your focus schedule</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Manual Study Modal */}
      {isStudyManualModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsStudyManualModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-2xl font-black">Manual Focus</h3>
              <button onClick={() => setIsStudyManualModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Focus Domain</label>
                <select value={tempManualStudy.subjectId} onChange={(e) => setTempManualStudy({...tempManualStudy, subjectId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm outline-none">
                  {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Hrs</label>
                   <input type="number" value={tempManualStudy.durationHours} onChange={e => setTempManualStudy({...tempManualStudy, durationHours: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-center" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mins</label>
                   <input type="number" value={tempManualStudy.durationMins} onChange={e => setTempManualStudy({...tempManualStudy, durationMins: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-center" />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date</label>
                 <input type="date" value={tempManualStudy.date} onChange={e => setTempManualStudy({...tempManualStudy, date: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black" />
              </div>
            </div>
            <button onClick={() => { 
                const mins = (tempManualStudy.durationHours * 60) + tempManualStudy.durationMins;
                if (mins > 0) {
                  const s: StudySession = { 
                    id: Math.random().toString(36).substr(2, 9), 
                    subjectId: tempManualStudy.subjectId, 
                    subTopic: 'Manual Entry', 
                    duration: mins, 
                    timestamp: new Date(tempManualStudy.date).getTime(), 
                    type: mins > 50 ? 'deep' : 'light' 
                  };
                  setState(prev => ({ ...prev, studySessions: [s, ...prev.studySessions] }));
                }
                setIsStudyManualModalOpen(false);
            }} className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-xs uppercase shadow-2xl">Synchronize Study</button>
          </div>
        </div>
      )}

      {/* Manual Sleep Modal */}
      {isSleepManualModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsSleepManualModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-2xl font-black">Manual Reset</h3>
              <button onClick={() => setIsSleepManualModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Sleep Duration (Hrs)</label>
                <input type="number" step="0.5" value={tempManualSleep.durationHours} onChange={e => setTempManualSleep({...tempManualSleep, durationHours: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-center" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Quality (1-5)</label>
                 <div className="flex gap-2">
                   {[1, 2, 3, 4, 5].map(q => (
                     <button key={q} onClick={() => setTempManualSleep({...tempManualSleep, quality: q})} className={`flex-1 py-3 rounded-xl font-black transition-all ${tempManualSleep.quality === q ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{q}</button>
                   ))}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date</label>
                 <input type="date" value={tempManualSleep.date} onChange={e => setTempManualSleep({...tempManualSleep, date: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black" />
              </div>
            </div>
            <button onClick={() => { 
                if (tempManualSleep.durationHours > 0) {
                  const s: SleepSession = { 
                    id: Math.random().toString(36).substr(2, 9), 
                    duration: tempManualSleep.durationHours, 
                    quality: tempManualSleep.quality, 
                    timestamp: new Date(tempManualSleep.date).getTime() 
                  };
                  setState(prev => ({ ...prev, sleepSessions: [s, ...prev.sleepSessions] }));
                }
                setIsSleepManualModalOpen(false);
            }} className="w-full py-6 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase shadow-2xl">Synchronize Sleep</button>
          </div>
        </div>
      )}

      {/* Reminder Add Modal */}
      {isAddingReminder && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsAddingReminder(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
             <div className="flex justify-between items-center border-b pb-6">
                <h3 className="text-2xl font-black">Set Trigger</h3>
                <button onClick={() => setIsAddingReminder(false)} className="p-2 text-slate-300 hover:text-rose-500"><X size={28}/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Prompt Title</label>
                   <input 
                    type="text" 
                    value={newReminder.title} 
                    onChange={e => setNewReminder({...newReminder, title: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-sm outline-none" 
                    placeholder="e.g. Bedtime Prep"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Trigger Time</label>
                      <input type="time" value={newReminder.time} onChange={e => setNewReminder({...newReminder, time: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 font-black text-sm outline-none" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Protocol Type</label>
                      <select value={newReminder.type} onChange={e => setNewReminder({...newReminder, type: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 font-black text-xs outline-none">
                         <option value="daily">Daily Loop</option>
                         <option value="one-time">One-Time</option>
                      </select>
                   </div>
                </div>
             </div>
             <button onClick={addReminder} className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95"><Save size={20}/> Synchronize Alarm</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySleep;
