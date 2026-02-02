
import React, { useState } from 'react';
import { 
  User, Save, Trophy, Calendar, Target, Clock, Shield, 
  Database, Trash2, RefreshCw, ShieldCheck, UserCircle,
  LayoutDashboard, Bell, Settings, Globe, Mail,
  ChevronRight, ArrowUpRight, Flame, ShieldAlert,
  Lock as LockIcon, Smartphone
} from 'lucide-react';
import { AppState, UserProfile, ExamGoal } from '../types';

interface ProfileProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Profile: React.FC<ProfileProps> = ({ state, setState }) => {
  const [editingProfile, setEditingProfile] = useState<UserProfile>(state.profile);
  const [newPin, setNewPin] = useState(state.appLockPin || '');

  const saveProfile = () => {
    setState(prev => ({ 
      ...prev, 
      profile: editingProfile,
      appLockPin: newPin.trim() || undefined
    }));
    alert("SYSTEM IDENTITY UPDATE: Successful.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 px-2 md:px-0">
      {/* Identity Banner */}
      <div className="bg-white rounded-[44px] md:rounded-[64px] p-8 md:p-16 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10 md:gap-16 items-center relative overflow-hidden">
         <div className="relative group shrink-0">
            <img src="https://picsum.photos/400/400" className="w-40 h-40 md:w-56 md:h-56 rounded-[44px] md:rounded-[64px] border-[6px] md:border-[10px] border-indigo-50 shadow-2xl transition-all group-hover:scale-105 duration-500" alt="Avatar"/>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-xl"><ShieldCheck size={24}/></div>
         </div>
         <div className="flex-1 space-y-6 text-center md:text-left relative z-10">
            <div>
               <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.5em] mb-2">Alpha Aspirant Node</p>
               <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">{state.profile.name}</h2>
            </div>
            <p className="text-slate-400 font-medium max-w-lg leading-relaxed text-sm md:text-xl italic">"Entropy is the enemy of excellence. Order is the path to mastery."</p>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-10">
         {/* Config Panel */}
         <div className="xl:col-span-8 space-y-8">
            <div className="bg-white rounded-[40px] md:rounded-[56px] p-8 md:p-12 border border-slate-100 shadow-sm space-y-10">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3"><Settings size={26} className="text-indigo-600"/> Core Logic</h3>
                  <div className="h-px flex-1 bg-slate-100 mx-6 hidden md:block"></div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Designation</label>
                     <input value={editingProfile.name} onChange={e => setEditingProfile({...editingProfile, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black outline-none text-base focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Neural Pin Lock</label>
                     <input type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 font-black outline-none text-base focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="4 Digits Required" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setState(prev => ({...prev, oneHandMode: !prev.oneHandMode}))} className={`flex items-center justify-between px-8 py-6 rounded-[28px] text-xs font-black uppercase tracking-widest border transition-all active:scale-95 ${state.oneHandMode ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3"><Smartphone size={20}/> One-Hand OS</div>
                    <span className={`w-3 h-3 rounded-full ${state.oneHandMode ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-slate-300'}`}></span>
                  </button>
                  <button onClick={() => setState(p => ({...p, theme: p.theme === 'light' ? 'dark' : 'light'}))} className="flex items-center justify-between px-8 py-6 rounded-[28px] text-xs font-black uppercase tracking-widest border border-slate-200 bg-slate-50 text-slate-400 hover:bg-white transition-all active:scale-95">
                     <div className="flex items-center gap-3"><RefreshCw size={20}/> Cycle Schema</div>
                     <span className="font-bold">{state.theme}</span>
                  </button>
               </div>

               <button onClick={saveProfile} className="w-full py-6 md:py-8 bg-slate-950 text-white rounded-[32px] md:rounded-[44px] font-black uppercase tracking-[0.3em] text-xs md:text-sm shadow-2xl active:scale-95 transition-all hover:bg-indigo-600">Commit OS Redefinition</button>
            </div>
         </div>

         {/* Data Control Panel */}
         <div className="xl:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-[40px] md:rounded-[56px] p-10 md:p-12 text-white shadow-2xl space-y-10 relative overflow-hidden">
               <div className="flex items-center gap-3 relative z-10">
                  <div className="p-3 bg-white/5 text-emerald-400 rounded-2xl border border-white/10"><Database size={24}/></div>
                  <h3 className="text-2xl font-black tracking-tight">Security Protocol</h3>
               </div>
               
               <div className="space-y-4 relative z-10">
                  <button onClick={() => { 
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `ExamOS_Neural_Backup_${new Date().toISOString().split('T')[0]}.json`);
                      downloadAnchorNode.click();
                  }} className="w-full p-6 bg-white/5 rounded-[32px] border border-white/10 flex items-center justify-between text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all font-black text-xs md:text-sm group">
                    <span>Export Neural Vault</span>
                    <ArrowUpRight size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
                  </button>
                  <button onClick={() => { 
                      if (confirm("CRITICAL: This will irreversibly wipe all local neural patterns. Continue?")) { localStorage.clear(); window.location.reload(); }
                  }} className="w-full p-6 bg-rose-500/5 rounded-[32px] border border-rose-500/20 flex items-center justify-between text-rose-400 hover:bg-rose-600 hover:text-white transition-all font-black text-xs md:text-sm group">
                    <span>Purge Local Data</span>
                    <Trash2 size={22} className="group-hover:rotate-12 transition-transform"/>
                  </button>
               </div>

               <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 relative z-10">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em]">Storage Allocation</p>
                  <div className="flex items-baseline gap-2 mb-2"><span className="text-3xl font-black">2.4</span><span className="text-xs font-bold opacity-40 uppercase">MB Used</span></div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[12%]"></div></div>
               </div>
               
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Profile;
