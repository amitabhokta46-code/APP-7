
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Heart, Activity, Timer, Zap, Plus, Flame, Dumbbell, 
  Calendar as CalIcon, BarChart3, PieChart as PieIcon, 
  ChevronRight, Save, X, MoreHorizontal, TrendingUp,
  AlertTriangle, CheckCircle2, Info, Scale, Ruler, 
  CheckSquare, ClipboardList, RefreshCw, ChevronDown, ChevronUp,
  Target, ZapOff, Wind, ShieldCheck, Brain, Circle, Home, Utensils,
  Coffee, Apple, Egg, Cookie, Milk, Droplets, Moon, Sun, Search,
  Bell, BellRing
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import { AppState, ExerciseSession, BodyMetrics, Reminder } from '../types';

interface FitnessProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

type Tab = 'tracker' | 'plan' | 'analytics' | 'metrics';

const EXERCISE_TYPES = ['Walking', 'Running', 'Gym', 'Yoga', 'Stretching', 'HIIT', 'Sports'];
const INTENSITIES = ['Low', 'Medium', 'High'];

const colorMaps: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const Fitness: React.FC<FitnessProps> = ({ state, setState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [selection, setSelection] = useState({ id: new Date().getDay() || 7, source: 'gym' });
  
  // Reminder UI for Plan
  const [activeAlarmPlan, setActiveAlarmPlan] = useState<string | null>(null);
  const [alarmTime, setAlarmTime] = useState('06:00');

  const [checklists, setChecklists] = useState(() => {
    const saved = localStorage.getItem('fitness_checklists');
    return saved ? JSON.parse(saved) : {
      styles: { supersets: false, giantSets: false, tempo: false, functional: false, metabolic: false },
      benefits: { calorie: false, definition: false, cardio: false, mental: false },
      weekly: Array(7).fill(false),
      weeklyHome: Array(7).fill(false),
      dailyRules: { rest: false, weight: false, form: false, sleep: false, protein: false },
      monthly: { fatLoss: false, strength: false, consistency: false, focus: false },
      metabolicFinished: false,
      exerciseCompletion: {}
    };
  });

  useEffect(() => {
    localStorage.setItem('fitness_checklists', JSON.stringify(checklists));
  }, [checklists]);

  const [newExercise, setNewExercise] = useState<Partial<ExerciseSession>>({
    type: 'Gym',
    subCategory: '',
    duration: 30,
    intensity: 'Medium',
    calories: 200,
    notes: '',
    energyRating: 4,
    muscleSoreness: 1
  });

  const [newMetrics, setNewMetrics] = useState<Partial<BodyMetrics>>({ weight: 70, waist: 32, restingHR: 65 });

  const saveExercise = () => {
    const session: ExerciseSession = { ...newExercise as ExerciseSession, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    setState(prev => ({ ...prev, exerciseSessions: [session, ...prev.exerciseSessions] }));
    setIsEntryOpen(false);
  };

  const saveMetrics = () => {
    const metrics: BodyMetrics = { ...newMetrics as BodyMetrics, timestamp: Date.now() };
    setState(prev => ({ ...prev, bodyMetrics: [metrics, ...prev.bodyMetrics] }));
    setIsMetricsOpen(false);
  };

  const setPlanReminder = (planTitle: string, id: string) => {
    const reminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Workout: ${planTitle}`,
      description: `Training sequence initialized. Protocol: Physical Optimization.`,
      time: alarmTime,
      date: new Date().toISOString().split('T')[0],
      type: 'daily',
      status: 'active',
      soundEnabled: true,
      linkedId: id,
      linkedType: 'habit' // Reusing habit type for recurring nature
    };
    setState(prev => ({ ...prev, reminders: [reminder, ...prev.reminders] }));
    setActiveAlarmPlan(null);
  };

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const todaySessions = state.exerciseSessions.filter(s => new Date(s.timestamp).setHours(0,0,0,0) === today);
    const totalDuration = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    const totalCalories = todaySessions.reduce((acc, s) => acc + s.calories, 0);
    const streak = state.disciplineStreak;
    return [ { label: 'Today Workout', value: `${totalDuration}m`, icon: <Timer size={20} />, color: 'indigo' }, { label: 'Calories', value: totalCalories.toString(), icon: <Flame size={20} />, color: 'rose' }, { label: 'Energy Index', value: todaySessions.length > 0 ? `${todaySessions[0].energyRating}/5` : 'N/A', icon: <Zap size={20} />, color: 'amber' }, { label: 'Streak', value: `${streak} Days`, icon: <Activity size={20} />, color: 'emerald' }, ];
  }, [state.exerciseSessions, state.disciplineStreak]);

  const durationData = useMemo(() => [ { day: 'Mon', mins: 45 }, { day: 'Tue', mins: 30 }, { day: 'Wed', mins: 0 }, { day: 'Thu', mins: 60 }, { day: 'Fri', mins: 45 }, { day: 'Sat', mins: 20 }, { day: 'Today', mins: state.exerciseSessions.filter(s => new Date(s.timestamp).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)).reduce((a,b) => a+b.duration, 0) }, ], [state.exerciseSessions]);
  const distributionData = useMemo(() => { const counts: Record<string, number> = {}; state.exerciseSessions.forEach(s => counts[s.type] = (counts[s.type] || 0) + 1); return Object.entries(counts).map(([name, value]) => ({ name, value })); }, [state.exerciseSessions]);
  const consistencyData = useMemo(() => { const now = new Date(); const year = now.getFullYear(); const month = now.getMonth(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const days = []; for (let i = 1; i <= daysInMonth; i++) { const d = new Date(year, month, i).setHours(0,0,0,0); const hasExercise = state.exerciseSessions.some(s => new Date(s.timestamp).setHours(0,0,0,0) === d); days.push({ day: i, active: hasExercise }); } return { days, activeCount: days.filter(d => d.active).length, monthName: now.toLocaleString('default', { month: 'long' }) }; }, [state.exerciseSessions]);

  const workoutPlans = [ { id: 1, title: "Day 1 – Push Supersets", subtitle: "Chest–Shoulder–Triceps", color: "indigo", sets: [ { name: "Superset 1", items: ["Bench Press × 10", "Push-ups × max"] }, { name: "Superset 2", items: ["Incline DB Press × 12", "Lateral Raises × 15"] }, { name: "Superset 3", items: ["Shoulder Press × 10", "Triceps Dips × 12"] }, { name: "Finisher", items: ["Battle Rope – 5 × 30 sec"] } ] }, { id: 2, title: "Day 2 – Pull Supersets", subtitle: "Back–Biceps", color: "emerald", sets: [ { name: "Superset 1", items: ["Deadlift × 6", "Plank × 45 sec"] }, { name: "Superset 2", items: ["Lat Pulldown × 12", "Face Pull × 15"] }, { name: "Finisher", items: ["Rowing Machine – 10 min"] } ] }, { id: 3, title: "Day 3 – Legs Giant Set", subtitle: "Lower Body Dominance", color: "amber", sets: [ { name: "Giant Set", items: ["Squats × 10", "Leg Press × 15", "Walking Lunges × 20"] }, { name: "Calves", items: ["Standing Calf Raise × 25"] } ] }, { id: 4, title: "Day 4 – Functional + Core", subtitle: "Mobility & Stability", color: "blue", sets: [ { name: "Functional Circuit", items: ["Kettlebell Swings × 25", "Push-ups × 20", "TRX Rows × 15"] }, { name: "Core Complex", items: ["Hanging Leg Raises × 15", "Plank × 1 min"] } ] }, { id: 5, title: "Day 5 – Power + Condition", subtitle: "Explosive Energy", color: "purple", sets: [ { name: "Power Sets", items: ["Power Cleans – 5 × 3", "Push Press – 4 × 6"] }, { name: "Sprint Intervals", items: ["30 sec sprint + 60 sec walk × 10"] } ] }, { id: 6, title: "Day 6 – Metabolic Fat-Loss", subtitle: "High Intensity Burn", color: "rose", sets: [ { name: "40 sec ON / 20 sec OFF", items: ["Burpees", "Mountain Climbers", "Jump Rope"] } ] }, { id: 7, title: "Day 7 – Rest / Mobility", subtitle: "Recovery & Restoration", color: "slate", sets: [ { name: "Recovery Checklist", items: ["Light walking (30–40 min)", "Full body stretching"] } ] } ];
  const noGymPlans = [ { id: 1, title: "Day 1 – Full Body Burn", subtitle: "Metabolism + sweat", color: "rose", sets: [{ name: "Main Circuit", items: ["Jumping Jacks × 40 sec", "Squats × 15", "Push-ups × 12"] }] }, { id: 2, title: "Day 2 – Lower Body + Core", subtitle: "Fat loss + strength", color: "amber", sets: [{ name: "Strength Set", items: ["Bodyweight Squats × 20", "Lunges × 12", "Leg Raises × 15"] }] }, { id: 3, title: "Day 3 – Upper Body", subtitle: "Chest, arms, shoulders", color: "indigo", sets: [{ name: "Hypertrophy Set", items: ["Push-ups × 15", "Shoulder Taps × 20", "Arm Circles × 30 sec"] }] }, { id: 4, title: "Day 4 – HIIT + Abs", subtitle: "Maximum fat burn", color: "orange", sets: [{ name: "HIIT Circuit", items: ["Mountain Climbers × 40 sec", "Burpees × 10", "Plank × 40 sec"] }] }, { id: 5, title: "Day 5 – Full Body Strength", subtitle: "Muscle toning", color: "emerald", sets: [{ name: "Stability Set", items: ["Squat Hold × 30 sec", "Step-ups × 15", "Plank × 45 sec"] }] }, { id: 6, title: "Day 6 – Mobility + Cardio", subtitle: "Recovery + flex", color: "blue", sets: [{ name: "Session Flow", items: ["Spot jogging – 5 min", "Surya Namaskar – 8 rounds", "Deep breathing – 5 min"] }] }, { id: 7, title: "Day 7 – Rest / Recovery", subtitle: "Active restoration", color: "slate", sets: [{ name: "Rest Checklist", items: ["Light walking", "Full body stretching"] }] } ];

  const handleCheck = (category: string, key: string | number) => { setChecklists(prev => { const updated = { ...prev }; if (typeof key === 'number') updated[category][key] = !updated[category][key]; else updated[category][key] = !updated[category][key]; return updated; }); };
  const handleExerciseCheck = (source: string, day: number, setIdx: number, itemIdx: number) => { const key = `${source}-${day}-${setIdx}-${itemIdx}`; setChecklists(prev => ({ ...prev, exerciseCompletion: { ...prev.exerciseCompletion, [key]: !prev.exerciseCompletion?.[key] } })); };
  const activePlan = selection.source === 'gym' ? workoutPlans.find(p => p.id === selection.id) : noGymPlans.find(p => p.id === selection.id);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex bg-white p-1 rounded-2xl border w-fit shadow-sm overflow-x-auto no-scrollbar max-w-full">
        <button onClick={() => setActiveTab('tracker')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'tracker' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}><Activity size={16} /> Tracker</button>
        <button onClick={() => setActiveTab('plan')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'plan' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}><ClipboardList size={16} /> Training Plan</button>
        <button onClick={() => setActiveTab('analytics')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}><BarChart3 size={16} /> Insights</button>
        <button onClick={() => setActiveTab('metrics')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'metrics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}><Scale size={16} /> Body Metrics</button>
      </div>

      {activeTab === 'tracker' && (
        <><div className="grid grid-cols-1 md:grid-cols-4 gap-4">{stats.map((s, i) => (<div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:shadow-lg transition-all"><div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colorMaps[s.color]}`}>{s.icon}</div><p className="text-xs text-slate-500 font-bold uppercase mb-1">{s.label}</p><h4 className="text-2xl font-black">{s.value}</h4></div>))}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm"><div className="flex justify-between items-center mb-8"><div><h3 className="text-xl font-bold">Activity Log</h3><p className="text-xs text-slate-400 font-medium">Keep your energy levels peaked</p></div><button onClick={() => setIsEntryOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"><Plus size={18} /> Add Session</button></div><div className="space-y-4">{state.exerciseSessions.slice(0, 5).map((session, i) => (<div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">{session.type === 'Gym' ? <Dumbbell /> : session.type === 'Yoga' ? <Heart /> : <Activity />}</div><div><p className="font-bold text-slate-800">{session.type}{session.subCategory ? `: ${session.subCategory}` : ''}</p><p className="text-xs text-slate-400 font-medium">{session.duration}m • {session.intensity} • {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div></div><div className="flex items-center gap-3"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${session.intensity === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{session.calories} kcal</span><ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors" /></div></div>))}</div></div><div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-center items-center text-center"><div className="relative z-10"><div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse shadow-2xl"><Heart size={36} fill="white" /></div><h3 className="text-2xl font-bold mb-2">Energy Correlation</h3><p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">Focus Score increases by 22% on exercise days.</p><div className="flex gap-4"><div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[10px] font-bold uppercase opacity-60 mb-1">Retention Index</p><p className="text-xl font-bold text-emerald-400">Peak</p></div><div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-[10px] font-bold uppercase opacity-60 mb-1">Fatigue Level</p><p className="text-xl font-bold text-amber-400">Low</p></div></div></div></div></div></>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Dumbbell size={24} /></div>
                    <h3 className="text-xl font-black text-slate-800">Gym Regimen</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {workoutPlans.map((day, idx) => {
                    const isSettingAlarm = activeAlarmPlan === `gym-${day.id}`;
                    return (
                      <div key={day.id} className="space-y-2">
                        <div 
                          onClick={() => setSelection({ id: day.id, source: 'gym' })}
                          className={`flex items-center gap-4 p-5 rounded-[32px] border transition-all cursor-pointer ${selection.id === day.id && selection.source === 'gym' ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-white border-slate-100'}`}
                        >
                          <button onClick={(e) => { e.stopPropagation(); handleCheck('weekly', idx); }} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${checklists.weekly[idx] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 border border-slate-200'}`}>{checklists.weekly[idx] ? <ShieldCheck size={18} /> : <CheckSquare size={18} />}</button>
                          <div className="flex-1"><h4 className="font-black text-sm text-slate-900">{day.title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{day.subtitle}</p></div>
                          <button onClick={(e) => { e.stopPropagation(); setActiveAlarmPlan(isSettingAlarm ? null : `gym-${day.id}`); }} className="p-2 text-slate-300 hover:text-indigo-600"><Bell size={16}/></button>
                        </div>
                        {isSettingAlarm && (
                          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3 animate-in slide-in-from-top-2">
                            <p className="text-[9px] font-black uppercase text-indigo-600">Daily Training Alarm</p>
                            <div className="flex gap-2">
                               <input type="time" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black" />
                               <button onClick={() => setPlanReminder(day.title, `gym-${day.id}`)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black text-[9px] uppercase">Set</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Home size={24} /></div>
                       <h3 className="text-xl font-black text-slate-800">Home Plan</h3>
                    </div>
                 </div>
                 <div className="space-y-3">
                    {noGymPlans.map((day, idx) => {
                      const isSettingAlarm = activeAlarmPlan === `home-${day.id}`;
                      return (
                        <div key={day.id} className="space-y-2">
                          <div 
                            onClick={() => setSelection({ id: day.id, source: 'home' })}
                            className={`flex items-center gap-4 p-5 rounded-[32px] border transition-all cursor-pointer ${selection.id === day.id && selection.source === 'home' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}
                          >
                            <button onClick={(e) => { e.stopPropagation(); handleCheck('weeklyHome', idx); }} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${checklists.weeklyHome[idx] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 border border-slate-200'}`}>{checklists.weeklyHome[idx] ? <ShieldCheck size={18} /> : <CheckSquare size={18} />}</button>
                            <div className="flex-1"><h4 className="font-black text-sm text-slate-900">{day.title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{day.subtitle}</p></div>
                            <button onClick={(e) => { e.stopPropagation(); setActiveAlarmPlan(isSettingAlarm ? null : `home-${day.id}`); }} className="p-2 text-slate-300 hover:text-rose-600"><Bell size={16}/></button>
                          </div>
                          {isSettingAlarm && (
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3 animate-in slide-in-from-top-2">
                              <p className="text-[9px] font-black uppercase text-rose-600">Daily Training Alarm</p>
                              <div className="flex gap-2">
                                <input type="time" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black" />
                                <button onClick={() => setPlanReminder(day.title, `home-${day.id}`)} className="bg-rose-600 text-white px-4 py-1.5 rounded-xl font-black text-[9px] uppercase">Set</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                 </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2"><div className="bg-slate-900 rounded-[40px] p-10 text-white min-h-[500px] relative overflow-hidden">{activePlan && (<div className="relative z-10 space-y-8"> <div className="flex justify-between items-start"> <div><p className="text-[10px] font-black uppercase text-indigo-400 mb-2">{activePlan.title}</p><h3 className="text-4xl font-black tracking-tighter">{activePlan.subtitle}</h3></div> <div className="w-14 h-14 bg-white/10 rounded-[20px] flex items-center justify-center text-white border border-white/10 shadow-xl">{selection.source === 'gym' ? <Dumbbell size={28} /> : <Home size={28} />}</div> </div> <div className="space-y-6"> {activePlan.sets.map((set, si) => ( <div key={si} className="space-y-2"> <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40">{set.name}</h5> <div className="space-y-2"> {set.items.map((ex, ei) => ( <div key={ei} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl"> <button onClick={() => handleExerciseCheck(selection.source, selection.id, si, ei)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checklists.exerciseCompletion?.[`${selection.source}-${selection.id}-${si}-${ei}`] ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>{checklists.exerciseCompletion?.[`${selection.source}-${selection.id}-${si}-${ei}`] && <CheckSquare size={14} className="text-white" />}</button> <span className={`text-sm font-bold ${checklists.exerciseCompletion?.[`${selection.source}-${selection.id}-${si}-${ei}`] ? 'text-white/40 line-through' : 'text-white'}`}>{ex}</span> </div> ))} </div> </div> ))} </div> </div>)}<div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div></div></div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8"><div className="bg-white rounded-[40px] p-10 border shadow-sm"><div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4"><div><h3 className="text-2xl font-black">Consistency Map</h3><p className="text-sm text-slate-400 font-bold uppercase">{consistencyData.monthName} Performance</p></div><div className="px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100"><p className="text-[10px] font-black uppercase text-emerald-600">Days Exercised</p><p className="text-2xl font-black text-emerald-900">{consistencyData.activeCount} <span className="text-xs opacity-50">/ {consistencyData.days.length}</span></p></div></div><div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 gap-3">{consistencyData.days.map((d) => (<div key={d.day} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${d.active ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-300'}`}><span className="text-xs font-black">{d.day}</span>{d.active && <Flame size={12} className="mt-1" />}</div>))}</div></div></div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col items-center text-center"><div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><Scale size={28} /></div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Weight</p><h4 className="text-3xl font-black">{state.bodyMetrics[0]?.weight || '--'} <span className="text-sm font-medium">kg</span></h4></div><div className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col items-center text-center"><div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4"><Ruler size={28} /></div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Waist</p><h4 className="text-3xl font-black">{state.bodyMetrics[0]?.waist || '--'} <span className="text-sm font-medium">in</span></h4></div><div className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col items-center text-center"><div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><Activity size={28} /></div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Resting HR</p><h4 className="text-3xl font-black">{state.bodyMetrics[0]?.restingHR || '--'} <span className="text-sm font-medium">bpm</span></h4></div></div><div className="bg-white rounded-[40px] p-8 border shadow-sm"><div className="flex justify-between items-center mb-8"><h3 className="text-xl font-bold">History</h3><button onClick={() => setIsMetricsOpen(true)} className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black">Update Metrics</button></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={state.bodyMetrics.slice().reverse()}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="timestamp" hide /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} /><Tooltip labelFormatter={(t) => new Date(t).toLocaleDateString()} /><Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} /></LineChart></ResponsiveContainer></div></div></div>
      )}

      {isEntryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"> <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsEntryOpen(false)}></div> <div className="relative bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto"> <div className="flex justify-between items-center"><h3 className="text-2xl font-black">Log Workout</h3><button onClick={() => setIsEntryOpen(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={24} /></button></div> <div className="space-y-6"> <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Type</label><select value={newExercise.type} onChange={e => setNewExercise({...newExercise, type: e.target.value})} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm">{EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Sub-Category</label><input type="text" placeholder="e.g. Chest" value={newExercise.subCategory} onChange={e => setNewExercise({...newExercise, subCategory: e.target.value})} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm" /></div></div> <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Duration (min)</label><input type="number" value={newExercise.duration} onChange={e => setNewExercise({...newExercise, duration: parseInt(e.target.value)})} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Intensity</label><select value={newExercise.intensity} onChange={e => setNewExercise({...newExercise, intensity: e.target.value as any})} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm">{INTENSITIES.map(i => <option key={i} value={i}>{i}</option>)}</select></div></div> </div> <div className="flex gap-4"><button onClick={() => setIsEntryOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold">Cancel</button><button onClick={saveExercise} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"><Save size={18} /> Save</button></div> </div> </div>
      )}
      {isMetricsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"> <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsMetricsOpen(false)}></div> <div className="relative bg-white w-full max-sm rounded-[40px] p-8 shadow-2xl space-y-8"> <div className="flex justify-between items-center"><h3 className="text-2xl font-black">Body Metrics</h3><button onClick={() => setIsMetricsOpen(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={24} /></button></div> <div className="space-y-4"> <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Weight (kg)</label><input type="number" step="0.1" value={newMetrics.weight} onChange={e => setNewMetrics({...newMetrics, weight: parseFloat(e.target.value)})} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm" /></div> <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Waist (in)</label><input type="number" step="0.1" value={newMetrics.waist} onChange={e => setNewMetrics({...newMetrics, waist: parseFloat(e.target.value)})} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm" /></div> <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Resting HR (bpm)</label><input type="number" value={newMetrics.restingHR} onChange={e => setNewMetrics({...newMetrics, restingHR: parseInt(e.target.value)})} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm" /></div> </div> <button onClick={saveMetrics} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Update</button> </div> </div>
      )}
    </div>
  );
};

export default Fitness;
