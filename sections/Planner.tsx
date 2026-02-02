
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Plus, Clock, Circle, CheckCircle2, ChevronRight, 
  ListTodo, Layers, Target as TargetIcon, X, Save, 
  AlertCircle, Zap, ShieldCheck, Trash2, Edit3, 
  ArrowRight, Repeat, Info, BarChart2, Activity,
  Moon, Sun, Coffee, BookOpen, UserCheck, ShieldOff,
  TrendingUp, AlertTriangle, ArrowUpRight, CheckSquare,
  Sparkles, Filter, MoreHorizontal, Brain, Move,
  Lock, CalendarDays, ClipboardCheck, History, ChevronDown, ChevronUp,
  Bell, BellRing, Square
} from 'lucide-react';
import { AppState, Task, Goal, TaskCategory, Priority, EnergyLevel, SyllabusNode, EisenhowerType, Milestone, SubTask, Reminder } from '../types';

interface PlannerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Planner: React.FC<PlannerProps> = ({ state, setState }) => {
  const [activeTier, setActiveTier] = useState<'timeline' | 'daily' | 'short' | 'long'>('timeline');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> & { reminderEnabled?: boolean; reminderTime?: string }>({
    reminderEnabled: false,
    reminderTime: '09:00',
    repeat: 'None',
    repeatDays: [],
    repeatInterval: 1
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Partial<Goal> | null>(null);
  
  // Milestone management in modal
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Custom Reminder State
  const [activeAlarmTask, setActiveAlarmTask] = useState<string | null>(null);
  const [alarmTime, setAlarmTime] = useState('09:00');

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const categoryColors: Record<TaskCategory, string> = {
    Study: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Revision: 'bg-purple-50 text-purple-700 border-purple-100',
    Test: 'bg-amber-50 text-amber-700 border-amber-100',
    Exercise: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Personal: 'bg-blue-50 text-blue-700 border-blue-100',
    Rest: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  const timelineTasks = useMemo(() => {
    return state.tasks
      .filter(t => t.startTime && t.endTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [state.tasks]);

  const toggleTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    }));
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id === goalId) {
          const updatedMilestones = (g.milestones || []).map(m => 
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          const completedCount = updatedMilestones.filter(m => m.completed).length;
          const newProgress = updatedMilestones.length > 0 
            ? Math.round((completedCount / updatedMilestones.length) * 100) 
            : g.progress;
          
          return { ...g, milestones: updatedMilestones, progress: newProgress };
        }
        return g;
      })
    }));
  };

  const saveTask = () => {
    if (!editingTask?.title) return;
    const taskId = editingTask.id || Math.random().toString(36).substr(2, 9);
    const task: Task = {
      id: taskId,
      title: editingTask.title,
      category: editingTask.category || 'Study',
      startTime: editingTask.startTime || '',
      endTime: editingTask.endTime || '',
      duration: editingTask.duration || 30,
      completed: editingTask.completed ?? false,
      priority: editingTask.priority || 'Medium',
      energyRequired: editingTask.energyRequired || 'Medium',
      repeat: editingTask.repeat || 'None',
      repeatDays: editingTask.repeatDays || [],
      repeatInterval: editingTask.repeatInterval || 1,
      eisenhower: editingTask.eisenhower || 'Not Urgent-Important',
      rescheduleCount: 0
    };

    setState(prev => {
      let nextReminders = [...prev.reminders];
      
      if (editingTask.reminderEnabled && editingTask.reminderTime) {
        nextReminders = nextReminders.filter(r => !(r.linkedId === taskId && r.linkedType === 'task'));
        nextReminders.push({
          id: Math.random().toString(36).substr(2, 9),
          title: `Task: ${task.title}`,
          time: editingTask.reminderTime,
          date: new Date().toISOString().split('T')[0],
          type: task.repeat !== 'None' ? 'daily' : 'one-time',
          status: 'active',
          soundEnabled: true,
          linkedId: taskId,
          linkedType: 'task'
        });
      }

      return {
        ...prev,
        tasks: editingTask.id ? prev.tasks.map(t => t.id === task.id ? task : t) : [task, ...prev.tasks],
        reminders: nextReminders
      };
    });
    
    setIsTaskModalOpen(false);
    setEditingTask({ reminderEnabled: false, reminderTime: '09:00', repeat: 'None', repeatDays: [], repeatInterval: 1 });
  };

  const saveGoal = () => {
    if (!editingGoal?.title) return;
    const milestones = editingGoal.milestones || [];
    const completedCount = milestones.filter(m => m.completed).length;
    const progress = milestones.length > 0 
      ? Math.round((completedCount / milestones.length) * 100) 
      : (editingGoal.progress || 0);

    const goal: Goal = {
      id: editingGoal.id || Math.random().toString(36).substr(2, 9),
      title: editingGoal.title,
      deadline: editingGoal.deadline || Date.now() + 7 * 86400000,
      progress: progress,
      type: editingGoal.type || 'short',
      priority: editingGoal.priority || 'Medium',
      milestones: milestones
    };

    setState(prev => ({
      ...prev,
      goals: editingGoal.id ? prev.goals.map(g => g.id === goal.id ? goal : g) : [goal, ...prev.goals]
    }));
    setIsGoalModalOpen(false);
    setEditingGoal(null);
    setNewMilestoneTitle('');
  };

  const toggleDay = (dayIdx: number) => {
    const current = editingTask.repeatDays || [];
    if (current.includes(dayIdx)) {
      setEditingTask({ ...editingTask, repeatDays: current.filter(d => d !== dayIdx) });
    } else {
      setEditingTask({ ...editingTask, repeatDays: [...current, dayIdx] });
    }
  };

  return (
    <div className="space-y-6 pb-24 px-2 md:px-0">
      <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-100 w-fit shadow-sm overflow-x-auto no-scrollbar max-w-full">
         {[
           { id: 'timeline', label: '24h Roadmap', icon: <Clock size={16}/> },
           { id: 'daily', label: 'Actions', icon: <ListTodo size={16}/> },
           { id: 'short', label: 'Sprints', icon: <Layers size={16}/> },
           { id: 'long', label: 'Marathons', icon: <TargetIcon size={16}/> },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTier(tab.id as any)}
             className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTier === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-800'}`}
           >
             {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8">
          {activeTier === 'timeline' && (
            <div className="bg-white rounded-[40px] md:rounded-[56px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[650px] md:h-[800px] animate-in slide-in-from-bottom-4 duration-500">
               <div className="p-6 md:p-10 border-b bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-xl md:text-3xl font-black tracking-tight">Today's Canvas</h2>
                    <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 opacity-80">Execution Sequence</p>
                  </div>
                  <button onClick={() => { setEditingTask({ priority: 'High', category: 'Study', startTime: '09:00', endTime: '10:00', reminderEnabled: false, reminderTime: '09:00', repeat: 'None', repeatDays: [], repeatInterval: 1 }); setIsTaskModalOpen(true); }} className="relative z-10 p-4 bg-indigo-600 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-90"><Plus size={24}/></button>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
               </div>
               
               <div className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50/30">
                  <div className="absolute left-16 md:left-24 top-0 bottom-0 w-px bg-slate-200/60"></div>
                  {[...Array(24)].map((_, hourIdx) => {
                    const hour = hourIdx.toString().padStart(2, '0');
                    const hTasks = timelineTasks.filter(t => t.startTime.startsWith(hour));
                    return (
                      <div key={hourIdx} className="flex min-h-[70px] md:min-h-[90px] border-b border-slate-100/50 group">
                         <div className="w-16 md:w-24 flex items-start justify-center pt-5 md:pt-6 sticky left-0 bg-white md:bg-transparent z-10 shadow-sm md:shadow-none">
                            <span className="text-[10px] md:text-xs font-black text-slate-400 tabular-nums">{hour}:00</span>
                         </div>
                         <div className="flex-1 p-2 md:p-3 space-y-3">
                            {hTasks.map(task => {
                              const isSettingAlarm = activeAlarmTask === task.id;
                              const linkedReminders = state.reminders.filter(r => r.linkedId === task.id && r.linkedType === 'task' && r.status === 'active');
                              
                              return (
                                <div key={task.id} className="space-y-2">
                                  <div className={`p-4 md:p-6 rounded-[24px] md:rounded-[36px] border shadow-sm transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer relative overflow-hidden ${categoryColors[task.category]}`} onClick={() => { setEditingTask({...task, reminderEnabled: linkedReminders.length > 0, reminderTime: linkedReminders[0]?.time || task.startTime}); setIsTaskModalOpen(true); }}>
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black uppercase opacity-60 tracking-widest">{task.category}</span>
                                          {linkedReminders.length > 0 && (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/40 rounded-full text-[7px] font-black uppercase">
                                              <BellRing size={8} className="animate-pulse" /> {linkedReminders[0].time}
                                            </div>
                                          )}
                                          {task.repeat !== 'None' && <Repeat size={10} className="text-slate-400" />}
                                        </div>
                                        <p className="text-sm md:text-lg font-black tracking-tight truncate mt-1">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1 opacity-50"><Clock size={10}/><span className="text-[10px] font-bold">{task.startTime} - {task.endTime}</span></div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setActiveAlarmTask(isSettingAlarm ? null : task.id); setAlarmTime(task.startTime); }} className={`p-2 rounded-xl transition-all ${linkedReminders.length > 0 ? 'bg-indigo-600 text-white' : 'bg-white/40 text-slate-400 hover:bg-white/60'}`}><Bell size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border-2 transition-all shrink-0 ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent hover:border-indigo-300'}`}><CheckCircle2 size={20}/></button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {activeTier === 'daily' && (
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-6 md:p-12 animate-in zoom-in-95 duration-500 min-h-[600px]">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Active Deck</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Zero Deviation Required</p>
                  </div>
                  <button onClick={() => { setEditingTask({ completed: false, category: 'Study', reminderEnabled: false, reminderTime: '09:00', repeat: 'None', repeatDays: [], repeatInterval: 1 }); setIsTaskModalOpen(true); }} className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"><Plus size={20}/> New Node</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  {state.tasks.filter(t => !t.startTime).map(task => {
                    const linkedReminders = state.reminders.filter(r => r.linkedId === task.id && r.linkedType === 'task' && r.status === 'active');
                    
                    return (
                      <div key={task.id} className="space-y-2">
                        <div className={`p-6 md:p-10 rounded-[32px] md:rounded-[48px] border transition-all flex flex-col group relative ${task.completed ? 'bg-emerald-50 border-emerald-100 shadow-none' : 'bg-slate-50 border-transparent hover:bg-white hover:border-indigo-100 hover:shadow-2xl'}`} onClick={() => { setEditingTask({...task, reminderEnabled: linkedReminders.length > 0, reminderTime: linkedReminders[0]?.time || '09:00'}); setIsTaskModalOpen(true); }}>
                          <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border-2 transition-all shrink-0 active:scale-90 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-transparent hover:border-indigo-400'}`}><CheckSquare size={20}/></button>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg mb-2 inline-block ${categoryColors[task.category]}`}>{task.category}</span>
                                      {task.repeat !== 'None' && <Repeat size={10} className="text-slate-400 mb-2" />}
                                    </div>
                                    <h4 className={`font-black tracking-tight text-base md:text-xl truncate ${task.completed ? 'line-through opacity-40' : 'text-slate-800'}`}>{task.title}</h4>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setState(p => ({...p, tasks: p.tasks.filter(t => t.id !== task.id)})); }} className="p-2 text-slate-300 hover:text-rose-500 transition-all active:scale-90"><Trash2 size={18}/></button>
                              </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {(activeTier === 'short' || activeTier === 'long') && (
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-6 md:p-12 animate-in zoom-in-95 duration-500 min-h-[600px]">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">{activeTier === 'short' ? 'Short Sprints' : 'Marathon Goals'}</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Strategic Objectives</p>
                  </div>
                  <button onClick={() => { setEditingGoal({ type: activeTier, progress: 0, milestones: [] }); setIsGoalModalOpen(true); }} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"><Plus size={20}/> New Objective</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  {state.goals.filter(g => g.type === activeTier).map(goal => (
                      <div key={goal.id} className="p-8 md:p-10 rounded-[44px] border border-slate-100 bg-white hover:shadow-2xl transition-all group overflow-hidden relative" onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }}>
                        <div className="flex justify-between items-start mb-6">
                           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><TargetIcon size={24}/></div>
                           <div className="flex gap-2">
                             <button onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); setIsGoalModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit3 size={18}/></button>
                             <button onClick={(e) => { e.stopPropagation(); setState(p => ({...p, goals: p.goals.filter(gx => gx.id !== goal.id)})); }} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>
                           </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">{goal.title}</h4>
                        <div className="flex items-center gap-2 mb-6">
                           <Calendar size={14} className="text-slate-400" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                        </div>

                        {/* Milestone Quick View */}
                        {goal.milestones && goal.milestones.length > 0 && (
                          <div className="space-y-3 mb-6">
                             <div className="flex items-center gap-2 text-indigo-600">
                               <Layers size={14}/>
                               <span className="text-[9px] font-black uppercase tracking-widest">Procedural Steps</span>
                             </div>
                             <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar pr-2">
                               {goal.milestones.map(m => (
                                 <div key={m.id} className="flex items-center gap-3 group/m" onClick={(e) => e.stopPropagation()}>
                                   <button 
                                      onClick={() => toggleMilestone(goal.id, m.id)}
                                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${m.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-transparent hover:border-indigo-400'}`}
                                   >
                                      <CheckCircle2 size={12}/>
                                   </button>
                                   <span className={`text-[11px] font-bold transition-all ${m.completed ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{m.title}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}

                        <div className="space-y-2 pt-4 border-t border-slate-50">
                           <div className="flex justify-between text-[10px] font-black uppercase">
                              <span className="text-slate-400">Mastery Index</span>
                              <span className="text-indigo-600">{goal.progress}%</span>
                           </div>
                           <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out rounded-full" style={{ width: `${goal.progress}%` }}></div>
                           </div>
                        </div>

                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                      </div>
                    ))}
               </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[40px] md:rounded-[56px] p-8 md:p-12 text-white shadow-2xl space-y-8 relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                 <div className="p-2.5 bg-white/5 text-emerald-400 rounded-xl border border-white/10"><ShieldCheck size={22}/></div>
                 <h3 className="text-xl font-black tracking-tight">Compliance</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center transition-all hover:bg-white/10">
                    <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">{state.tasks.filter(t => t.completed).length}</p>
                    <p className="text-[10px] font-black uppercase text-slate-500 mt-2 tracking-widest">Constructed</p>
                 </div>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center transition-all hover:bg-white/10">
                    <p className="text-4xl md:text-5xl font-black text-indigo-400 tracking-tighter">{Math.round((state.tasks.filter(t => t.completed).length / (state.tasks.length || 1)) * 100)}%</p>
                    <p className="text-[10px] font-black uppercase text-slate-500 mt-2 tracking-widest">Mastery</p>
                 </div>
              </div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
           </div>

           <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Eisenhower Filter</h4>
              <div className="grid grid-cols-2 gap-2">
                 {['Urgent-Important', 'Not Urgent-Important', 'Urgent-Not Important', 'Not Urgent-Not Important'].map(type => (
                   <div key={type} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-lg font-black text-slate-900">{state.tasks.filter(t => t.eisenhower === type).length}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">{type.replace('-', '\n')}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsTaskModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-xl rounded-[48px] p-10 md:p-14 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center border-b pb-8">
                 <h3 className="text-3xl font-black tracking-tighter">{editingTask?.id ? 'Edit Mission' : 'New Mission'}</h3>
                 <button onClick={() => setIsTaskModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={32}/></button>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Mission Title</label>
                    <input value={editingTask?.title || ''} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="e.g. Modern History Revision" />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Vertical</label>
                       <select value={editingTask?.category} onChange={e => setEditingTask({...editingTask, category: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
                          {Object.keys(categoryColors).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Priority Index</label>
                       <select value={editingTask?.priority} onChange={e => setEditingTask({...editingTask, priority: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Start Time</label>
                       <input type="time" value={editingTask?.startTime || ''} onChange={e => setEditingTask({...editingTask, startTime: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">End Time</label>
                       <input type="time" value={editingTask?.endTime || ''} onChange={e => setEditingTask({...editingTask, endTime: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                 </div>

                 <div className="space-y-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                    <div className="flex items-center gap-2 text-indigo-600">
                       <Repeat size={18} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Recurrence Logic</h4>
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                       {['None', 'Daily', 'Weekly', 'Monthly', 'Custom'].map(r => (
                         <button 
                          key={r}
                          onClick={() => setEditingTask({...editingTask, repeat: r as any})}
                          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${editingTask.repeat === r ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           {r}
                         </button>
                       ))}
                    </div>

                    {editingTask.repeat === 'Weekly' && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Select Active Days</p>
                        <div className="flex gap-1.5">
                           {DAYS_OF_WEEK.map((day, i) => (
                             <button 
                              key={day}
                              onClick={() => toggleDay(i)}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${editingTask.repeatDays?.includes(i) ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                             >
                               {day}
                             </button>
                           ))}
                        </div>
                      </div>
                    )}

                    {editingTask.repeat === 'Monthly' && (
                       <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Repeat On (Day of Month)</p>
                          <input 
                            type="number" 
                            min="1" max="31" 
                            value={editingTask.repeatInterval || 1}
                            onChange={e => setEditingTask({...editingTask, repeatInterval: parseInt(e.target.value) || 1})}
                            className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 font-black text-sm outline-none" 
                          />
                       </div>
                    )}

                    {editingTask.repeat === 'Custom' && (
                       <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Repeat Every (Days)</p>
                          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                             <input 
                              type="number" 
                              min="1" 
                              value={editingTask.repeatInterval || 1}
                              onChange={e => setEditingTask({...editingTask, repeatInterval: parseInt(e.target.value) || 1})}
                              className="w-full outline-none font-black text-sm" 
                             />
                             <span className="text-[10px] font-black uppercase text-slate-400">Days</span>
                          </div>
                       </div>
                    )}
                 </div>

                 <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Bell size={20} className={editingTask.reminderEnabled ? 'text-indigo-600' : 'text-slate-300'} />
                          <h4 className="text-xs font-black uppercase tracking-widest">Neural Reminder</h4>
                       </div>
                       <button 
                        onClick={() => setEditingTask({...editingTask, reminderEnabled: !editingTask.reminderEnabled})}
                        className={`w-12 h-7 rounded-full relative transition-all ${editingTask.reminderEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                       >
                         <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${editingTask.reminderEnabled ? 'left-6' : 'left-1'}`}></div>
                       </button>
                    </div>
                    {editingTask.reminderEnabled && (
                       <div className="flex items-center gap-4 animate-in slide-in-from-top-2">
                          <label className="text-[9px] font-black uppercase text-slate-400">Trigger At</label>
                          <input type="time" value={editingTask.reminderTime} onChange={e => setEditingTask({...editingTask, reminderTime: e.target.value})} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                       </div>
                    )}
                 </div>
              </div>
              <button onClick={saveTask} className="w-full py-7 bg-indigo-600 text-white rounded-[36px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"><Save size={20}/> Synchronize Plan</button>
           </div>
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsGoalModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-xl rounded-[48px] p-10 md:p-14 shadow-2xl space-y-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center border-b pb-8">
                 <h3 className="text-3xl font-black tracking-tighter">Strategic Objective</h3>
                 <button onClick={() => setIsGoalModalOpen(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={32}/></button>
              </div>
              <div className="space-y-8">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Objective Name</label>
                    <input value={editingGoal?.title || ''} onChange={e => setEditingGoal({...editingGoal, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black text-sm outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Deadline</label>
                       <input type="date" value={editingGoal?.deadline ? new Date(editingGoal.deadline).toISOString().split('T')[0] : ''} onChange={e => setEditingGoal({...editingGoal, deadline: new Date(e.target.value).getTime()})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-sm outline-none" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Priority Index</label>
                       <select value={editingGoal?.priority} onChange={e => setEditingGoal({...editingGoal, priority: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 font-black text-xs outline-none">
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                       </select>
                    </div>
                 </div>

                 {/* MILESTONE BUILDER */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-indigo-600">
                          <Layers size={18}/>
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Procedural Milestones</h4>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       {(editingGoal?.milestones || []).map((m, idx) => (
                         <div key={m.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <button 
                               onClick={() => {
                                 const updated = (editingGoal?.milestones || []).map(ms => ms.id === m.id ? {...ms, completed: !ms.completed} : ms);
                                 setEditingGoal({...editingGoal, milestones: updated});
                               }}
                               className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${m.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent hover:border-indigo-300'}`}
                            >
                               <CheckCircle2 size={14}/>
                            </button>
                            <span className={`flex-1 text-sm font-bold ${m.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{m.title}</span>
                            <button 
                               onClick={() => {
                                 const updated = (editingGoal?.milestones || []).filter(ms => ms.id !== m.id);
                                 setEditingGoal({...editingGoal, milestones: updated});
                               }}
                               className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                            >
                               <Trash2 size={16}/>
                            </button>
                         </div>
                       ))}
                       <div className="flex gap-2">
                          <input 
                            value={newMilestoneTitle} 
                            onChange={e => setNewMilestoneTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), newMilestoneTitle.trim() && (setEditingGoal({...editingGoal, milestones: [...(editingGoal?.milestones || []), {id: Math.random().toString(), title: newMilestoneTitle, completed: false}]}), setNewMilestoneTitle('')))}
                            placeholder="Identify procedure step..." 
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-xs outline-none" 
                          />
                          <button 
                             onClick={() => { if(newMilestoneTitle.trim()){ setEditingGoal({...editingGoal, milestones: [...(editingGoal?.milestones || []), {id: Math.random().toString(), title: newMilestoneTitle, completed: false}]}); setNewMilestoneTitle(''); } }}
                             className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                             <Plus size={20}/>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
              <button onClick={saveGoal} className="w-full py-7 bg-indigo-600 text-white rounded-[36px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"><Save size={20}/> Commit Objective</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Planner;

