
import React, { useState, useMemo } from 'react';
import { 
  Plus, Target, Flame, Calendar, Trash2, CheckCircle2, 
  ChevronRight, ArrowRight, Zap, Star, LayoutGrid, ListFilter,
  RefreshCw, TrendingUp, AlertCircle, Info, X, Circle, Bell,
  Clock, BellRing
} from 'lucide-react';
import { AppState, Habit, Reminder } from '../types';

interface HabitTrackerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const HABIT_CATEGORIES = ['Health', 'Focus', 'Learning', 'Personal', 'Mindset'];
const CATEGORY_COLORS: Record<string, string> = {
  Health: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Focus: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  Learning: 'bg-amber-50 text-amber-600 border-amber-100',
  Personal: 'bg-rose-50 text-rose-600 border-rose-100',
  Mindset: 'bg-purple-50 text-purple-600 border-purple-100',
};

const HabitTracker: React.FC<HabitTrackerProps> = ({ state, setState }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', category: 'Health', frequency: 'daily' as const });
  const [activeAlarmHabit, setActiveAlarmHabit] = useState<string | null>(null);
  const [alarmTime, setAlarmTime] = useState('09:00');
  const [alarmType, setAlarmType] = useState<'daily' | 'one-time'>('daily');
  
  const todayStr = new Date().toISOString().split('T')[0];

  const setHabitReminder = (habit: Habit) => {
    const reminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Habit: ${habit.name}`,
      description: `Time for your ${habit.category} discipline: ${habit.name}`,
      time: alarmTime,
      date: todayStr,
      type: alarmType,
      status: 'active',
      soundEnabled: true,
      linkedId: habit.id,
      linkedType: 'habit'
    };
    setState(prev => ({ ...prev, reminders: [reminder, ...prev.reminders] }));
    setActiveAlarmHabit(null);
  };

  const removeHabitReminder = (habitId: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => !(r.linkedId === habitId && r.linkedType === 'habit'))
    }));
  };

  const toggleHabit = (id: string) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => {
        if (h.id === id) {
          const history = { ...h.history };
          const completed = !history[todayStr];
          history[todayStr] = completed;
          let streak = h.streak;
          if (completed) streak += 1;
          else if (streak > 0) streak -= 1;
          return { ...h, history, streak, lastUpdated: todayStr };
        }
        return h;
      })
    }));
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    const habit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      name: newHabit.name,
      category: newHabit.category,
      frequency: newHabit.frequency,
      history: {},
      streak: 0,
      lastUpdated: todayStr
    };
    setState(prev => ({ ...prev, habits: [habit, ...prev.habits] }));
    setIsAddOpen(false);
    setNewHabit({ name: '', category: 'Health', frequency: 'daily' });
  };

  const deleteHabit = (id: string) => {
    if (confirm("Delete this habit from history?")) {
      setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
    }
  };

  const habitSummary = useMemo(() => {
    const total = state.habits.length;
    const doneToday = state.habits.filter(h => h.history[todayStr]).length;
    const pct = total > 0 ? Math.round((doneToday / total) * 100) : 0;
    return { total, doneToday, pct };
  }, [state.habits, todayStr]);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <div className="bg-white rounded-[48px] p-10 border border-slate-50 shadow-sm flex flex-col md:flex-row items-center gap-10">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90"><circle cx="80" cy="80" r="65" stroke="#f1f5f9" strokeWidth="12" fill="none" /><circle cx="80" cy="80" r="65" stroke="#6366f1" strokeWidth="12" fill="none" strokeDasharray="408.2" strokeDashoffset={408.2 - (408.2 * habitSummary.pct) / 100} strokeLinecap="round" className="transition-all duration-1000" /></svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-black">{habitSummary.pct}%</span><span className="text-[10px] font-black uppercase text-slate-400">Habit Score</span></div>
        </div>
        <div className="flex-1 space-y-4">
          <h2 className="text-3xl font-black tracking-tight">Daily Habit Matrix</h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed">System Adherence Protocol: 100% daily synchronization required for rank promotion.</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="px-10 py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center gap-3"><Plus size={20}/> New Habit</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {state.habits.map(habit => {
          const isDone = habit.history[todayStr];
          const isSettingAlarm = activeAlarmHabit === habit.id;
          const linkedReminders = state.reminders.filter(r => r.linkedId === habit.id && r.linkedType === 'habit' && r.status === 'active');
          
          return (
            <div key={habit.id} className={`p-8 rounded-[48px] border transition-all relative overflow-hidden group ${isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${CATEGORY_COLORS[habit.category]}`}>{habit.category}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setActiveAlarmHabit(isSettingAlarm ? null : habit.id)} className={`p-2 rounded-xl transition-all ${linkedReminders.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-indigo-600'}`} title="Set Reminder"><Bell size={18}/></button>
                  <button onClick={() => deleteHabit(habit.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
              
              {isSettingAlarm ? (
                <div className="mb-6 space-y-4 animate-in slide-in-from-top-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Neural Trigger Config</p>
                      <button onClick={() => setActiveAlarmHabit(null)}><X size={14} className="text-slate-400"/></button>
                   </div>
                   <div className="space-y-3">
                      <div className="flex gap-2">
                        <input type="time" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-sm outline-none" />
                        <select value={alarmType} onChange={e => setAlarmType(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl px-2 py-2 font-black text-[10px] outline-none">
                           <option value="daily">Daily</option>
                           <option value="one-time">Once</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setHabitReminder(habit)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Save Alarm</button>
                        {linkedReminders.length > 0 && (
                          <button onClick={() => removeHabitReminder(habit.id)} className="px-4 bg-rose-50 text-rose-600 py-3 rounded-xl font-black text-[10px] uppercase">Kill All</button>
                        )}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className={`text-2xl font-black tracking-tight leading-none mb-2 ${isDone ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>{habit.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {linkedReminders.map(rem => (
                      <div key={rem.id} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                        <BellRing size={10} className="animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{rem.time} ({rem.type})</span>
                        <button onClick={() => setState(p => ({...p, reminders: p.reminders.filter(r => r.id !== rem.id)}))} className="hover:text-rose-500"><X size={10}/></button>
                      </div>
                    ))}
                    {linkedReminders.length === 0 && (
                       <button onClick={() => setActiveAlarmHabit(habit.id)} className="text-[9px] font-black uppercase text-slate-400 border border-dashed border-slate-200 px-3 py-1 rounded-full hover:border-indigo-300 hover:text-indigo-400 transition-all">+ Add Neural Alarm</button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-8">
                 <div className="flex items-center gap-1.5"><Flame size={18} className={habit.streak > 0 ? 'text-rose-500 fill-current' : 'text-slate-200'}/><span className="text-lg font-black text-slate-700">{habit.streak}</span><span className="text-[10px] font-black uppercase text-slate-400">Streak</span></div>
              </div>
              <button onClick={() => toggleHabit(habit.id)} className={`w-full py-5 rounded-[28px] font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${isDone ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isDone ? <CheckCircle2 size={18}/> : <Circle size={18}/>}{isDone ? 'Marked Incomplete' : 'Complete Habit'}</button>
            </div>
          );
        })}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center border-b pb-6"><h3 className="text-2xl font-black">Design New Habit</h3><button onClick={() => setIsAddOpen(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={28}/></button></div>
            <div className="space-y-6">
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Action Name</label><input type="text" value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 5 AM Wakeup"/></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Vertical</label><select value={newHabit.category} onChange={e => setNewHabit({...newHabit, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black outline-none">{HABIT_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <button onClick={addHabit} className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl">Initialize Habit</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
