
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, X, Music, Target, Flame, Shield, ShieldOff, ShieldCheck,
  Headphones, Volume2, Square, Info, SkipForward,
  Lock, Unlock, Zap, Trophy, History, Waves, Wind,
  CloudRain, Coffee, Radio, Calendar, Trash2, Plus, AlertCircle, Clock,
  CheckCircle2, FileAudio, Upload, TrendingUp, AlertTriangle, ScreenShareOff,
  RotateCcw, Activity, VolumeX, Sparkles, Brain, Save, Link as LinkIcon
} from 'lucide-react';
import { AppState, FocusMode, FocusSound, FocusSession, StudySession } from '../types';

interface FocusEngineProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const FocusEngine: React.FC<FocusEngineProps> = ({ state, setState }) => {
  const initialMode = state.focusModes[0] || { id: 'm1', name: 'Focus', studyTime: 25, breakTime: 5 };
  const initialSound = state.focusSounds[0] || { id: 's1', name: 'Silence', url: '', type: 'silent' };

  const [activeMode, setActiveMode] = useState<FocusMode>(initialMode);
  const [timeLeft, setTimeLeft] = useState(initialMode.studyTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [isStudyPhase, setIsStudyPhase] = useState(true);
  const [currentSound, setCurrentSound] = useState<FocusSound>(initialSound);
  const [volume, setVolume] = useState(50);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState(state.subjects[0]?.id || '');
  const [topic, setTopic] = useState('');
  const [focusGoal, setFocusGoal] = useState('');
  const [isExamMode, setIsExamMode] = useState(false);
  
  // Custom Track Modal
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [newTrack, setNewTrack] = useState({ name: '', url: '', type: 'lofi' as FocusSound['type'] });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Refs to avoid stale closures in the timer completion logic
  const sessionDataRef = useRef({ topic, focusGoal, selectedSubjectId, isExamMode, activeMode });
  useEffect(() => {
    sessionDataRef.current = { topic, focusGoal, selectedSubjectId, isExamMode, activeMode };
  }, [topic, focusGoal, selectedSubjectId, isExamMode, activeMode]);

  // Constants for Circular Progress
  const STROKE_DASHARRAY = 1000;

  // Handle phase/mode initialization (Reset timer only when phase or mode changes, not on pause)
  useEffect(() => {
    if (!isActive) {
      const mins = isStudyPhase ? activeMode.studyTime : activeMode.breakTime;
      setTimeLeft(mins * 60);
    }
  }, [activeMode, isStudyPhase]);

  const handleSessionComplete = useCallback(() => {
    setIsActive(false);
    if (timerRef.current) window.clearInterval(timerRef.current);

    const { topic: t, focusGoal: g, selectedSubjectId: sid, isExamMode: em, activeMode: am } = sessionDataRef.current;

    if (isStudyPhase) {
      const session: FocusSession = {
        id: Math.random().toString(36).substr(2, 9),
        modeId: am.id,
        subjectId: sid,
        topicName: t || 'Deep Focus Cycle',
        goalStatement: g || 'Productivity Block',
        startEnergy: 5,
        duration: am.studyTime,
        interruptionCount: 0,
        completed: true,
        focusScore: em ? 100 : 90,
        timestamp: Date.now()
      };

      const studyEntry: StudySession = {
        id: `focus-${session.id}`,
        subjectId: sid,
        subTopic: t || 'Deep Focus Cycle',
        duration: am.studyTime,
        timestamp: Date.now(),
        type: 'deep'
      };

      setState(prev => ({ 
        ...prev, 
        focusSessions: [session, ...prev.focusSessions],
        studySessions: [studyEntry, ...prev.studySessions],
        disciplineStreak: prev.disciplineStreak + 1
      }));
      
      // Play completion sound
      new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock_ringing_beep.ogg').play().catch(() => {});
    }

    setIsStudyPhase(prev => !prev);
  }, [isStudyPhase, setState]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isActive, handleSessionComplete]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      const shouldMute = isExamMode && isStudyPhase && isActive;
      
      if (isAudioPlaying && currentSound.url && !shouldMute) {
        audioRef.current.play().catch(() => setIsAudioPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isAudioPlaying, currentSound, volume, isExamMode, isStudyPhase, isActive]);

  const selectTrack = (sound: FocusSound) => {
    setCurrentSound(sound);
    setIsAudioPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = sound.url;
      audioRef.current.load();
    }
  };

  const addCustomTrack = () => {
    if (!newTrack.name || !newTrack.url) return;
    const track: FocusSound = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTrack.name,
      url: newTrack.url,
      type: newTrack.type
    };
    setState(prev => ({ ...prev, focusSounds: [...prev.focusSounds, track] }));
    setIsAddingTrack(false);
    setNewTrack({ name: '', url: '', type: 'lofi' });
  };

  const deleteTrack = (id: string) => {
    if (confirm("Permanently remove this track from your neural library?")) {
      setState(prev => ({ ...prev, focusSounds: prev.focusSounds.filter(s => s.id !== id) }));
      if (currentSound.id === id) {
        setCurrentSound(initialSound);
        setIsAudioPlaying(false);
      }
    }
  };

  const handleStart = () => {
    setIsActive(true);
  };

  const handleStop = () => {
    if (confirm("Terminate current neural block? Progress will not be logged.")) {
      setIsActive(false);
      const mins = isStudyPhase ? activeMode.studyTime : activeMode.breakTime;
      setTimeLeft(mins * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isLockdown = isActive && isExamMode && isStudyPhase;
  
  // Calculate progress for the ring
  const totalSeconds = (isStudyPhase ? activeMode.studyTime : activeMode.breakTime) * 60;
  const progressOffset = STROKE_DASHARRAY - (STROKE_DASHARRAY * timeLeft) / Math.max(totalSeconds, 1);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 px-2 md:px-0 h-full transition-all duration-1000 ${isLockdown ? 'fixed inset-0 z-[600] bg-slate-950 p-4 m-0 overflow-hidden flex items-center justify-center' : ''}`}>
      {currentSound.url && <audio ref={audioRef} src={currentSound.url} loop key={currentSound.id} />}

      {/* Primary Neural Engine Control */}
      <div className={`transition-all duration-1000 flex flex-col items-center justify-center relative overflow-hidden ${isLockdown ? 'w-full max-w-4xl h-auto bg-slate-950/50 backdrop-blur-3xl rounded-[64px] border border-white/5 p-12' : 'lg:col-span-8 bg-white border border-slate-100 rounded-[44px] md:rounded-[64px] p-8 md:p-16 shadow-xl min-h-[650px]'}`}>
        
        {/* Lockdown Status HUD */}
        {isLockdown && (
          <div className="absolute top-10 left-10 right-10 flex justify-between items-center animate-in fade-in duration-1000">
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-rose-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.4)] animate-pulse text-white"><Shield size={28}/></div>
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-[0.3em]">Lockdown Active</h2>
                   <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">Environment Neutralized • Focus Secured</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Active Objective</p>
                <p className="text-xl font-black text-white">{topic || 'Deep Work'}</p>
             </div>
          </div>
        )}

        {/* Top Phase Header */}
        {!isLockdown && (
          <div className="w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-6 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-3xl ${isStudyPhase ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {isStudyPhase ? <Brain size={24}/> : <Coffee size={24}/>}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isStudyPhase ? 'Study Immersion' : 'Recovery Phase'}</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Logic Engine: {activeMode.name}</p>
              </div>
            </div>
            
            <div className="flex bg-slate-100 p-1.5 rounded-[24px] border border-slate-200 shadow-inner overflow-x-auto no-scrollbar max-w-full">
               {state.focusModes.map(m => (
                 <button 
                  key={m.id} 
                  onClick={() => !isActive && setActiveMode(m)} 
                  className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeMode.id === m.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {m.name}
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* The High-Fidelity Chronos Ring */}
        <div className={`relative mb-12 group transition-all duration-1000 ${isLockdown ? 'scale-110' : 'scale-100'}`}>
          <div className={`w-72 h-72 sm:w-80 sm:h-80 md:w-[450px] md:h-[450px] rounded-full border-[4px] md:border-[8px] flex flex-col items-center justify-center transition-all duration-1000 ${isStudyPhase ? (isExamMode ? 'border-rose-500/5' : 'border-indigo-500/5') : 'border-emerald-500/5'} ${isActive ? 'shadow-[0_0_100px_rgba(0,0,0,0.02)]' : ''}`}>
             
             {/* Progress SVG */}
             <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-2xl">
                <circle cx="50%" cy="50%" r="48%" stroke="#f8fafc" strokeWidth={isLockdown ? "10" : "6"} fill="none" />
                <circle 
                  cx="50%" cy="50%" r="48%" 
                  stroke={isStudyPhase ? (isExamMode ? "#f43f5e" : "#6366f1") : "#10b981"} 
                  strokeWidth={isLockdown ? "12" : "8"} 
                  fill="none" 
                  strokeDasharray={STROKE_DASHARRAY} 
                  strokeDashoffset={progressOffset} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-linear"
                />
             </svg>

             {/* Inner UI */}
             <div className="relative z-10 flex flex-col items-center">
                <div className={`text-6xl sm:text-7xl md:text-[110px] font-black tracking-tighter tabular-nums ${isLockdown ? 'text-white' : 'text-slate-900'} leading-none`}>
                  {formatTime(timeLeft)}
                </div>
                
                <div className={`flex items-center gap-3 mt-4 md:mt-8 px-6 py-2 rounded-full border transition-all duration-500 ${isActive ? (isStudyPhase ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-100') : (isLockdown ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-400')}`}>
                   {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>}
                   <p className="font-black uppercase text-[10px] md:text-[12px] tracking-[0.3em]">
                    {isActive ? (isStudyPhase ? 'Focused Session' : 'Restoring System') : 'Awaiting Trigger'}
                   </p>
                </div>
             </div>
          </div>

          {/* Floating Phase Icon */}
          <div className={`absolute -top-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:top-8 md:right-8 p-6 rounded-[32px] shadow-2xl transition-all duration-700 animate-in zoom-in ${isStudyPhase ? (isExamMode ? 'bg-rose-600 text-white rotate-12' : 'bg-indigo-600 text-white') : 'bg-emerald-600 text-white -rotate-12'}`}>
            {isStudyPhase ? (isExamMode ? <Lock size={28}/> : <Target size={28}/>) : <Coffee size={28}/>}
          </div>
        </div>

        {/* Configuration Inputs */}
        {!isActive && (
          <div className="w-full max-w-xl space-y-6 relative z-10 mb-10 animate-in slide-in-from-bottom-4 duration-700">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Domain</label>
                   <select 
                    value={selectedSubjectId} 
                    onChange={e => setSelectedSubjectId(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                   >
                     {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Topic</label>
                   <input 
                    type="text" 
                    placeholder="e.g. History" 
                    value={topic} 
                    onChange={e => setTopic(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-black text-sm outline-none focus:ring-4 border-slate-100 focus:ring-indigo-500/10 transition-all" 
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Objective</label>
                   <input 
                    type="text" 
                    placeholder="e.g. 50 MCQ" 
                    value={focusGoal} 
                    onChange={e => setFocusGoal(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 font-black text-sm outline-none focus:ring-4 border-slate-100 focus:ring-indigo-500/10 transition-all" 
                   />
                </div>
             </div>
             
             <button 
                onClick={() => setIsExamMode(!isExamMode)}
                className={`w-full flex items-center justify-between p-6 border rounded-[32px] transition-all group ${isExamMode ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200 shadow-sm'}`}
             >
                <div className="flex items-center gap-5 text-left">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isExamMode ? 'bg-rose-600 text-white shadow-xl shadow-rose-200' : 'bg-slate-200 text-slate-400'}`}><Shield size={24}/></div>
                   <div>
                      <h4 className={`font-black text-sm uppercase tracking-widest ${isExamMode ? 'text-rose-600' : 'text-slate-700'}`}>Protocol: Strict Lockdown</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Automated Distraction Neutralization</p>
                   </div>
                </div>
                <div className={`w-14 h-8 rounded-full relative transition-all ${isExamMode ? 'bg-rose-600 shadow-inner' : 'bg-slate-200'}`}>
                   <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${isExamMode ? 'left-7' : 'left-1'}`}></div>
                </div>
             </button>
          </div>
        )}

        {/* Primary Controls */}
        <div className="w-full max-w-xl flex gap-4 relative z-10">
           <button 
             onClick={() => isActive ? setIsActive(false) : handleStart()} 
             className={`flex-[3] py-7 md:py-9 rounded-[36px] font-black text-lg md:text-xl transition-all shadow-2xl flex items-center justify-center gap-5 active:scale-95 ${isActive ? 'bg-amber-500 text-white shadow-amber-500/20' : (isStudyPhase ? (isExamMode ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-slate-900 text-white shadow-slate-900/20') : 'bg-emerald-600 text-white shadow-emerald-600/20')}`}
           >
             {isActive ? <Pause size={32}/> : <Play size={32}/>} 
             <span className="uppercase tracking-[0.2em]">{isActive ? 'Pause Flow' : (isStudyPhase ? (isExamMode ? 'Initiate Lockdown' : 'Start Focus') : 'Begin Recovery')}</span>
           </button>
           
           {(isActive || !isStudyPhase || timeLeft < totalSeconds) && (
              <button 
                onClick={handleStop}
                className={`flex-1 rounded-[36px] flex items-center justify-center transition-all active:scale-90 ${isLockdown ? 'bg-white/10 border border-white/20 text-white hover:bg-rose-600' : 'bg-slate-50 border border-slate-200 text-slate-300 hover:text-rose-600 hover:bg-rose-50'}`}
              >
                <Square size={28} />
              </button>
           )}
        </div>
      </div>

      {/* Audio Bio-Sync Library Sidebar */}
      <div className={`lg:col-span-4 flex flex-col gap-6 transition-all duration-1000 ${isLockdown ? 'translate-x-full opacity-0 pointer-events-none' : ''}`}>
         <div className="bg-white rounded-[44px] p-8 border border-slate-100 shadow-lg flex flex-col h-[550px] overflow-hidden">
            <div className="flex justify-between items-center mb-8 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Headphones size={22}/></div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Bio-Sync</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Neural Entrainment</p>
                  </div>
               </div>
               <button 
                onClick={() => setIsAddingTrack(true)} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white shadow-sm`}
                title="Add Custom Signal"
               >
                 <Plus size={20}/>
               </button>
            </div>

            {/* Scrollable Neural Library */}
            <div className="flex-1 overflow-y-auto pr-3 space-y-3 no-scrollbar pb-6">
               {state.focusSounds.map(s => {
                 const isActiveTrack = currentSound.id === s.id;
                 return (
                   <div key={s.id} className="relative group">
                     <button 
                      onClick={() => selectTrack(s)} 
                      className={`w-full p-5 rounded-[28px] border transition-all flex items-center gap-4 relative overflow-hidden ${isActiveTrack ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-indigo-50/50'}`}
                     >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActiveTrack ? 'bg-white/20' : 'bg-white shadow-sm text-indigo-500'}`}>
                           {isActiveTrack && isAudioPlaying ? <Activity size={20} className="animate-bounce" /> : <Music size={20}/>}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                           <p className={`font-black text-[10px] uppercase tracking-widest truncate ${isActiveTrack ? 'text-white' : 'text-slate-700'}`}>{s.name}</p>
                           <p className={`text-[8px] font-bold uppercase tracking-tight opacity-60`}>{s.type} signal</p>
                        </div>
                        {isActiveTrack && isAudioPlaying && (
                          <div className="flex gap-0.5 items-end h-3">
                             <div className="w-1 bg-white/40 h-2 rounded-full animate-[bounce_0.8s_infinite]"></div>
                             <div className="w-1 bg-white/40 h-3 rounded-full animate-[bounce_1s_infinite]"></div>
                             <div className="w-1 bg-white/40 h-2 rounded-full animate-[bounce_0.6s_infinite]"></div>
                          </div>
                        )}
                     </button>
                     {/* Delete Track for user added sounds - only show on hover if not active */}
                     {!isActiveTrack && s.id.length > 5 && (
                       <button 
                        onClick={(e) => { e.stopPropagation(); deleteTrack(s.id); }} 
                        className="absolute right-2 top-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <X size={14}/>
                       </button>
                     )}
                   </div>
                 );
               })}
            </div>

            {/* Mixer Controls */}
            <div className="mt-auto pt-6 border-t border-slate-50 space-y-4 shrink-0">
               <div className="flex items-center gap-4">
                  {volume === 0 ? <VolumeX size={18} className="text-rose-400"/> : <Volume2 size={18} className="text-slate-400"/>}
                  <div className="flex-1 relative h-6 flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume} 
                      onChange={e => setVolume(parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 tabular-nums w-8">{volume}%</span>
               </div>
               <button 
                onClick={() => setIsAudioPlaying(!isAudioPlaying)} 
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] tracking-widest ${isAudioPlaying ? 'bg-rose-50 text-rose-600' : 'bg-indigo-600 text-white shadow-lg'}`}
               >
                 {isAudioPlaying ? <><Pause size={14}/> Stop Signal</> : <><Play size={14}/> Start Signal</>}
               </button>
            </div>
         </div>

         {/* Energy Stats Panel */}
         <div className="bg-slate-900 rounded-[44px] p-8 text-white shadow-2xl space-y-8 relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] flex items-center gap-2"><Sparkles size={16} className="text-amber-400"/> Output Intelligence</h4>
                <TrendingUp size={20} className="text-emerald-400 opacity-40" />
              </div>
              
              <div className="space-y-4">
                 <div className="p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-all">
                    <p className="text-[9px] font-black uppercase text-indigo-400 mb-1">Total deep concentration</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black tabular-nums">{Math.floor(state.studySessions.reduce((a,b)=>a+b.duration,0)/60)}h</span>
                       <span className="text-sm font-bold text-slate-500">{state.studySessions.reduce((a,b)=>a+b.duration,0)%60}m</span>
                    </div>
                 </div>
                 
                 <div className="p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-all">
                    <p className="text-[9px] font-black uppercase text-rose-400 mb-1">Neural Chain</p>
                    <div className="flex items-center gap-3">
                       <span className="text-4xl font-black tabular-nums">{state.disciplineStreak}</span>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-500 uppercase leading-none">Day Streak</span>
                          <div className="flex gap-0.5 mt-1">
                             {[1,2,3,4,5].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i <= (state.disciplineStreak % 5 || 5) ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-white/10'}`}></div>)}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
         </div>
      </div>

      {/* Add Track Modal */}
      {isAddingTrack && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddingTrack(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[44px] p-8 md:p-12 shadow-2xl space-y-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-2xl font-black tracking-tight">Signal Ingestion</h3>
              <button onClick={() => setIsAddingTrack(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={28}/></button>
            </div>
            <div className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Signal Name</label>
                 <input 
                  type="text" 
                  value={newTrack.name} 
                  onChange={e => setNewTrack({...newTrack, name: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                  placeholder="e.g. Synthwave Study"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Source URL (Direct Audio Link)</label>
                 <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input 
                      type="text" 
                      value={newTrack.url} 
                      onChange={e => setNewTrack({...newTrack, url: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-5 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                      placeholder="https://example.com/audio.mp3"
                    />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Frequency Type</label>
                 <select 
                  value={newTrack.type} 
                  onChange={e => setNewTrack({...newTrack, type: e.target.value as any})} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-black text-sm outline-none"
                 >
                   <option value="lofi">Lo-Fi Beat</option>
                   <option value="binaural">Binaural Wave</option>
                   <option value="nature">Natural Ambience</option>
                   <option value="classical">Classical Composition</option>
                   <option value="white">White Noise</option>
                 </select>
               </div>
            </div>
            <button onClick={addCustomTrack} className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all shadow-indigo-200 flex items-center justify-center gap-3">
              <Save size={18}/> Commit to Library
            </button>
          </div>
        </div>
      )}
      
      {/* Dynamic Background Sync */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] ${isStudyPhase ? (isExamMode ? 'from-rose-500/10' : 'from-indigo-500/10') : 'from-emerald-500/10'} via-transparent to-transparent opacity-60 -z-10`}></div>
    </div>
  );
};

export default FocusEngine;
