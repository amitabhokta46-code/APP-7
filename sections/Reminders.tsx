
import React, { useState, useMemo } from 'react';
import { 
  Plus, Bell, Trash2, Clock, Calendar, AlertTriangle, 
  BellOff, BellRing, ChevronRight, X, Save, 
  Zap, ShieldCheck, History, Volume2
} from 'lucide-react';
import { AppState, Reminder } from '../types';

interface RemindersProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Reminders: React.FC<RemindersProps> = ({ state, setState }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    time: '09:00',
    date: new Date().toISOString().split('T')[0],
    type: 'one-time',
    status: 'active',
    soundEnabled: true
  });

  const activeAlarms = useMemo(() => 
    state.reminders.filter(r => r.status === 'active'),
    [state.reminders]
  );

  const historyAlarms = useMemo(() => 
    state.reminders.filter(r => r.status === 'fired').sort((a, b) => b.date.localeCompare(a.date)),
    [state.reminders]
  );

  const saveReminder = () => {
    if (!newReminder.title) return;
    const reminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      title: newReminder.title,
      description: newReminder.description || '',
      time: newReminder.time || '09:00',
      date: newReminder.date || new Date().toISOString().split('T')[0],
      type: newReminder.type || 'one-time',
      status: 'active',
      soundEnabled: newReminder.soundEnabled ?? true
    };

    setState(prev => ({
      ...prev,
      reminders: [reminder, ...prev.reminders]
    }));
    setIsAddOpen(false);
    setNewReminder({ title: '', time: '09:00', date: new Date().toISOString().split('T')[0], type: 'one-time', soundEnabled: true });
  };

  const deleteReminder = (id: string) => {
    setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
  };

  const toggleSound = (id: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, soundEnabled: !r.soundEnabled } : r)
    }));
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <div className="bg-white rounded-[48px] p-12 border border-slate-50 shadow-sm flex flex-col md:flex-row items-center gap-12">
        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center shadow-inner relative">
           <BellRing size={48} className="animate-bounce" />
           <span className="absolute -top-2 -right-2 bg-indigo-600 text-white w-8 h-8 rounded-full border-4 border-white flex items-center justify-center font-black text-xs">{activeAlarms.length}</span>
        </div>
        <div className="flex-1 space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Neural Alarms</h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-xl">"Externalize your memory. Let the system handle the prompts so you can handle the mastery."</p>
        </div>
        <button onClick={() => {
           if (Notification.permission !== 'granted') Notification.requestPermission();
           setIsAddOpen(true);
        }} className="px-10 py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center gap-3">
          <Plus size={20}/> New Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center gap-3 px-4">
              <Zap size={20} className="text-amber-500" />
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Scheduled Prompts</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeAlarms.map(alarm => (
                <div key={alarm.id} className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Clock size={24}/></div>
                         <div>
                            <p className="text-2xl font-black text-slate-800 tabular-nums">{alarm.time}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{alarm.date}</p>
                         </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => toggleSound(alarm.id)} className={`p-2 rounded-xl transition-all ${alarm.soundEnabled ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 bg-slate-50'}`}>
                            {alarm.soundEnabled ? <Volume2 size={18}/> : <BellOff size={18}/>}
                         </button>
                         <button onClick={() => deleteReminder(alarm.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>
                      </div>
                   </div>
                   <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{alarm.title}</h4>
                   <p className="text-sm text-slate-400 font-medium line-clamp-1 mb-6">{alarm.description || 'No description added'}</p>
                   <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${alarm.type === 'daily' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                         {alarm.type} Protocol
                      </span>
                      <ShieldCheck size={16} className="text-emerald-400" />
                   </div>
                </div>
              ))}
              {activeAlarms.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[44px] border-2 border-dashed border-slate-100">
                   <Bell size={48} className="mx-auto text-slate-100 mb-4" />
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">No Active Alarm Sequences</p>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[44px] p-10 text-white shadow-2xl space-y-8">
              <div className="flex items-center gap-3">
                 <History size={24} className="text-indigo-400"/>
                 <h3 className="text-xl font-black">Alarm Logs</h3>
              </div>
              <div className="space-y-4">
                 {historyAlarms.slice(0, 5).map(log => (
                   <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div className="truncate pr-4">
                         <p className="text-sm font-black truncate">{log.title}</p>
                         <p className="text-[9px] font-bold opacity-40 uppercase">{log.date} @ {log.time}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                   </div>
                 ))}
                 {historyAlarms.length === 0 && <p className="text-xs text-white/30 font-bold text-center py-10">No firing history recorded.</p>}
              </div>
           </div>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsAddOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[48px] p-12 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-3xl font-black tracking-tight">Configure Alarm</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><X size={32}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Sequence Title</label>
                <input type="text" value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 font-black outline-none focus:ring-4 focus:ring-indigo-500/10" placeholder="e.g. Current Affairs Review"/>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Trigger Time</label>
                   <input type="time" value={newReminder.time} onChange={e => setNewReminder({...newReminder, time: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-black outline-none"/>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Trigger Date</label>
                   <input type="date" value={newReminder.date} onChange={e => setNewReminder({...newReminder, date: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-black outline-none text-xs"/>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Execution Type</label>
                <select value={newReminder.type} onChange={e => setNewReminder({...newReminder, type: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 font-black outline-none appearance-none">
                  <option value="one-time">One-Time Burst</option>
                  <option value="daily">Daily Loop</option>
                  <option value="weekly">Weekly Cycle</option>
                </select>
              </div>
            </div>
            <button onClick={saveReminder} className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3"><Save size={20}/> Commit Alarm</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
