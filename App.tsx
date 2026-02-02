
import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  Bell, 
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Database,
  Shield,
  UserCircle,
  Sun,
  Moon,
  CloudMoon,
  LogIn,
  LogOut,
  Mail,
  Lock as LockIcon,
  ShieldCheck,
  CheckCircle,
  ArrowLeft,
  Chrome,
  Wifi,
  WifiOff,
  CloudLightning,
  Smartphone,
  Fingerprint,
  RefreshCcw,
  CloudCheck,
  BellRing,
  Volume2,
  VolumeX,
  AlarmClock
} from 'lucide-react';
import { AppSection, AppState, Subject, Task, TaskCategory, Priority, FocusMode, FocusSound, ExamGoal, UserProfile, Reminder, GovMockInstance, GovMistake } from './types';
import { NAV_ITEMS, SUBJECT_COLORS } from './constants';
import Dashboard from './sections/Dashboard';
import StudySleep from './sections/StudySleep';
import MockTests from './sections/MockTests';
import Fitness from './sections/Fitness';
import Syllabus from './sections/Syllabus';
import Planner from './sections/Planner';
import KnowledgeHub from './sections/KnowledgeHub';
import FocusEngine from './sections/FocusEngine';
import Profile from './sections/Profile';
import HabitTracker from './sections/HabitTracker';
import Reminders from './sections/Reminders';
import GovExamMock from './sections/GovExamMock';

const STORAGE_KEY = 'exam_os_master_state';

const INITIAL_PROFILE: UserProfile = {
  name: 'Alex Aspirant',
  examTargets: ['UPSC', 'SSC'],
  preferredStudyStart: '05:00',
  preferredStudyEnd: '23:00',
  dailyGoalHours: 8,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  disciplineScore: 0
};

const INITIAL_SUBJECTS: Subject[] = [
  { id: '1', name: 'General Studies', color: SUBJECT_COLORS[0], syllabusProgress: 45, priority: 'High', archived: false },
  { id: '2', name: 'Quantitative Aptitude', color: SUBJECT_COLORS[1], syllabusProgress: 60, priority: 'Medium', archived: false },
  { id: '3', name: 'Reasoning', color: SUBJECT_COLORS[2], syllabusProgress: 30, priority: 'Medium', archived: false },
  { id: '4', name: 'English', color: SUBJECT_COLORS[3], syllabusProgress: 75, priority: 'Low', archived: false },
  { id: '5', name: 'Current Affairs', color: SUBJECT_COLORS[4], syllabusProgress: 10, priority: 'High', archived: false },
];

const INITIAL_SOUNDS: FocusSound[] = [
  { id: 's1', name: 'Heavy Rain', url: 'https://actions.google.com/sounds/v1/water/rain_heavy_loud.ogg', type: 'nature' },
  { id: 's2', name: 'Soft Rainfall', url: 'https://actions.google.com/sounds/v1/water/rain_on_roof.ogg', type: 'nature' },
  { id: 's3', name: 'Morning Forest', url: 'https://actions.google.com/sounds/v1/ambiences/morning_forest.ogg', type: 'nature' },
  { id: 's4', name: 'Midnight Lo-Fi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', type: 'lofi' },
  { id: 's5', name: 'Classical Bach', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', type: 'classical' },
  { id: 's6', name: 'Alpha Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', type: 'binaural' },
  { id: 's7', name: 'Pacific Ocean', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_shore.ogg', type: 'nature' },
  { id: 's8', name: 'Study Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', type: 'lofi' },
  { id: 's9', name: 'Binaural Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', type: 'binaural' },
  { id: 's10', name: 'Ambient Space', url: 'https://actions.google.com/sounds/v1/science_fiction/spaceship_interior.ogg', type: 'white' }
];

const INITIAL_MODES: FocusMode[] = [
  { id: 'm1', name: 'Pomodoro', studyTime: 25, breakTime: 5, defaultSoundId: 's4' },
  { id: 'm2', name: 'Double Work', studyTime: 50, breakTime: 10, defaultSoundId: 's6' },
  { id: 'm3', name: 'Deep Cycle', studyTime: 90, breakTime: 20, defaultSoundId: 's5' }
];

const MASTER_ROUTINE: Partial<Task>[] = [
  { title: "Wake up, Bathroom, Water, Coffee (No Phone)", startTime: "05:00", endTime: "05:30", routineGroup: "Morning" as any, category: "Personal" as TaskCategory, priority: "High" as Priority },
  { title: "Morning Walk", startTime: "05:30", endTime: "05:50", routineGroup: "Morning" as any, category: "Exercise" as TaskCategory, priority: "Medium" as Priority },
  { title: "Gym (or Yoga/Stretching on rest days)", startTime: "05:50", endTime: "06:50", routineGroup: "Morning" as any, category: "Exercise" as TaskCategory, priority: "High" as Priority },
  { title: "Freshen up", startTime: "06:50", endTime: "07:10", routineGroup: "Morning" as any, category: "Personal" as TaskCategory, priority: "Low" as Priority },
  { title: "Mind reset (Breathing + Visualization)", startTime: "07:10", endTime: "07:20", routineGroup: "Morning" as any, category: "Personal" as TaskCategory, priority: "Medium" as Priority },
  { title: "Deep Study (Pomodoro-based)", startTime: "07:20", endTime: "09:20", routineGroup: "Study" as any, category: "Study" as TaskCategory, priority: "High" as Priority },
  { title: "Breakfast", startTime: "09:20", endTime: "09:35", routineGroup: "Study" as any, category: "Rest" as TaskCategory, priority: "Medium" as Priority },
  { title: "Revision / Second Subject", startTime: "09:35", endTime: "11:35", routineGroup: "Study" as any, category: "Revision" as TaskCategory, priority: "High" as Priority },
  { title: "Practice (MCQs / Answer Writing)", startTime: "11:50", endTime: "13:50", routineGroup: "Study" as any, category: "Test" as TaskCategory, priority: "High" as Priority },
  { title: "Lunch", startTime: "14:00", endTime: "14:30", routineGroup: "Study" as any, category: "Rest" as TaskCategory, priority: "Medium" as Priority },
  { title: "Power Nap / Rest", startTime: "14:30", endTime: "15:00", routineGroup: "Study" as any, category: "Rest" as TaskCategory, priority: "Low" as Priority },
  { title: "Coaching Classes (Snack at 6:00 PM)", startTime: "15:00", endTime: "20:00", routineGroup: "Coaching" as any, category: "Study" as TaskCategory, priority: "High" as Priority },
  { title: "Evening Walk / Relax", startTime: "20:00", endTime: "20:20", routineGroup: "Evening" as any, category: "Personal" as TaskCategory, priority: "Medium" as Priority },
  { title: "Revision + Short Notes", startTime: "20:30", endTime: "21:45", routineGroup: "Night" as any, category: "Revision" as TaskCategory, priority: "High" as Priority },
  { title: "Daily Review & Plan Tomorrow", startTime: "21:45", endTime: "22:00", routineGroup: "Night" as any, category: "Personal" as TaskCategory, priority: "Medium" as Priority },
  { title: "Dinner", startTime: "22:00", endTime: "22:30", routineGroup: "Night" as any, category: "Rest" as TaskCategory, priority: "Low" as Priority },
  { title: "Sleep (Strict)", startTime: "22:30", endTime: "23:00", routineGroup: "Night" as any, category: "Rest" as TaskCategory, priority: "High" as Priority },
].map(t => ({ ...t, id: `routine-${t.startTime}`, completed: false, isRoutine: true, rescheduleCount: 0, duration: 30, eisenhower: 'Not Urgent-Important' as any }));

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // App Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  
  // Reminder Trigger State
  const [ringingAlarm, setRingingAlarm] = useState<Reminder | null>(null);
  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge updated sounds into saved state if they exist
      return {
        ...parsed,
        focusSounds: parsed.focusSounds?.length > 0 ? parsed.focusSounds : INITIAL_SOUNDS
      };
    }

    return {
      profile: INITIAL_PROFILE,
      studySessions: [],
      sleepSessions: [],
      exerciseSessions: [],
      bodyMetrics: [],
      subjects: INITIAL_SUBJECTS,
      mockTests: [],
      tasks: MASTER_ROUTINE as Task[],
      goals: [],
      syllabus: {},
      hubBooks: [],
      hubSyllabus: [],
      hubPersonality: [],
      focusSessions: [],
      distractionLogs: [],
      habits: [],
      notes: [],
      reminders: [],
      examDate: Date.now() + 1000 * 60 * 60 * 24 * 45,
      lastRoutineReset: new Date().toISOString().split('T')[0],
      focusModes: INITIAL_MODES,
      focusSounds: INITIAL_SOUNDS,
      exams: [],
      disciplineStreak: 0,
      lastBackupDate: Date.now(),
      theme: 'light',
      appLockPin: undefined,
      oneHandMode: false,
      aiChatHistory: [],
      govMockHistory: [],
      mistakeNotebook: []
    };
  });

  // Background Neural Ticker for Reminders
  useEffect(() => {
    const ticker = setInterval(() => {
      const now = new Date();
      const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayStr = now.toISOString().split('T')[0];

      state.reminders.forEach(reminder => {
        if (reminder.status === 'active' && reminder.time === currentHHMM && (reminder.date === todayStr || reminder.type === 'daily')) {
           setRingingAlarm(reminder);
           if (Notification.permission === 'granted') {
             new Notification(`Neural Alert: ${reminder.title}`, {
               body: reminder.description,
               icon: '/favicon.ico'
             });
           }
        }
      });
    }, 20000);

    return () => clearInterval(ticker);
  }, [state.reminders]);

  // Handle Audible Alarm
  useEffect(() => {
    if (ringingAlarm && ringingAlarm.soundEnabled) {
      if (!alarmSoundRef.current) {
        alarmSoundRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock_ringing_beep.ogg');
        alarmSoundRef.current.loop = true;
      }
      alarmSoundRef.current.play().catch(e => console.warn("Audio interaction block", e));
    } else {
      if (alarmSoundRef.current) {
        alarmSoundRef.current.pause();
        alarmSoundRef.current = null;
      }
    }
  }, [ringingAlarm]);

  const dismissAlarm = (id: string) => {
    const alarm = state.reminders.find(r => r.id === id);
    const todayStr = new Date().toISOString().split('T')[0];
    
    setState(prev => {
      let newState = { ...prev };
      
      // Mark reminder as fired
      newState.reminders = prev.reminders.map(r => r.id === id ? { ...r, status: 'fired' as const } : r);
      
      // If linked to a habit, mark the habit as complete automatically
      if (alarm?.linkedType === 'habit' && alarm.linkedId) {
        newState.habits = prev.habits.map(h => {
          if (h.id === alarm.linkedId) {
            const history = { ...h.history };
            const alreadyDone = history[todayStr];
            if (!alreadyDone) {
              history[todayStr] = true;
              return { ...h, history, streak: h.streak + 1, lastUpdated: todayStr };
            }
          }
          return h;
        });
      }
      
      return newState;
    });
    setRingingAlarm(null);
  };

  const snoozeAlarm = (id: string) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const snoozedHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, time: snoozedHHMM } : r)
    }));
    setRingingAlarm(null);
  };

  // Connectivity Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for App Lock on Init
  useEffect(() => {
    if (state.appLockPin) {
      setIsLocked(true);
    }
  }, []);

  // Persistence Engine - Local Only
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const root = document.documentElement;
    root.className = ''; 
    if (state.theme !== 'light') root.classList.add(state.theme);
  }, [state]);

  const toggleTheme = () => {
    setState(prev => {
      const themes: ('light' | 'dark' | 'night')[] = ['light', 'dark', 'night'];
      const currentIndex = themes.indexOf(prev.theme);
      const nextIndex = (currentIndex + 1) % themes.length;
      return { ...prev, theme: themes[nextIndex] };
    });
  };

  const handlePinInput = (num: string) => {
    const newPin = pinEntry + num;
    if (newPin === state.appLockPin) {
      setIsLocked(false);
      setPinEntry('');
    } else if (newPin.length >= (state.appLockPin?.length || 4)) {
      setPinEntry('');
      alert("INCORRECT PIN. ACCESS DENIED.");
    } else {
      setPinEntry(newPin);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case AppSection.DASHBOARD: return <Dashboard state={state} setState={setState} onNavigate={setActiveSection} />;
      case AppSection.STUDY_SLEEP: return <StudySleep state={state} setState={setState} />;
      case AppSection.MOCK_TESTS: return <MockTests state={state} setState={setState} />;
      case AppSection.FITNESS: return <Fitness state={state} setState={setState} />;
      case AppSection.HABITS: return <HabitTracker state={state} setState={setState} />;
      case AppSection.REMINDERS: return <Reminders state={state} setState={setState} />;
      case AppSection.SYLLABUS: return <Syllabus state={state} setState={setState} />;
      case AppSection.PLANNER: return <Planner state={state} setState={setState} />;
      case AppSection.KNOWLEDGE_HUB: return <KnowledgeHub state={state} setState={setState} />;
      case AppSection.FOCUS: return <FocusEngine state={state} setState={setState} />;
      case AppSection.PROFILE: return <Profile state={state} setState={setState} />;
      case AppSection.GOV_EXAM_MOCK: return <GovExamMock state={state} setState={setState} />;
      default: return <Dashboard state={state} setState={setState} onNavigate={setActiveSection} />;
    }
  };

  if (isLocked) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-xs w-full text-center space-y-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[32px] mx-auto flex items-center justify-center text-white shadow-2xl"><LockIcon size={40} /></div>
          <div><h2 className="text-2xl font-black text-white">Neural Protection</h2><p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Enter System PIN</p></div>
          <div className="flex justify-center gap-4">{Array(state.appLockPin?.length || 4).fill(0).map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full border-2 border-indigo-500 ${pinEntry.length > i ? 'bg-indigo-500' : ''}`}></div>))}</div>
          <div className="grid grid-cols-3 gap-6">{['1','2','3','4','5','6','7','8','9','','0','C'].map((n, i) => (<button key={i} onClick={() => n === 'C' ? setPinEntry('') : n !== '' && handlePinInput(n)} className={`w-16 h-16 rounded-full bg-white/5 border border-white/10 text-xl font-black text-white hover:bg-white/10 transition-all active:scale-95 ${n === '' ? 'invisible' : ''}`}>{n}</button>))}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col md:flex-row ${state.oneHandMode ? 'one-hand-active' : ''}`}>
      {/* Alarm Overlay System */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-indigo-600 animate-in fade-in duration-500">
           <div className="text-center space-y-12 max-w-lg w-full">
              <div className="w-40 h-40 bg-white/10 rounded-full mx-auto flex items-center justify-center animate-ping">
                 <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                    <AlarmClock size={80} className="text-white" />
                 </div>
              </div>
              <div className="space-y-4">
                 <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-indigo-200">Neural Alarm Triggered</h2>
                 <h3 className="text-5xl font-black text-white tracking-tighter leading-tight">{ringingAlarm.title}</h3>
                 <p className="text-indigo-100 font-bold text-lg">{ringingAlarm.description}</p>
                 {ringingAlarm.linkedType === 'habit' && (
                    <div className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-200 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-500/30 inline-block">
                       Action Linked: Habit will auto-complete on Dismiss
                    </div>
                 )}
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={() => dismissAlarm(ringingAlarm.id)} className="w-full py-8 bg-white text-indigo-600 rounded-[32px] font-black uppercase text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Dismiss Sequence</button>
                 <button onClick={() => snoozeAlarm(ringingAlarm.id)} className="w-full py-5 bg-indigo-50 text-white rounded-[24px] font-black uppercase text-sm border border-indigo-400 hover:bg-indigo-400 transition-all">Snooze (5 Mins)</button>
              </div>
           </div>
        </div>
      )}

      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
        <h1 className="font-bold text-indigo-600 text-lg uppercase tracking-tight">ExamOS</h1>
        <div className="flex gap-2">
          {isOnline ? <Wifi size={18} className="text-emerald-500" /> : <WifiOff size={18} className="text-rose-500" />}
          <button onClick={() => setActiveSection(AppSection.REMINDERS)} className="p-2 text-slate-500 hover:text-indigo-600 relative"><Bell size={20} />{state.reminders.some(r => r.status === 'active') && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>}</button>
          <button onClick={() => setActiveSection(AppSection.PROFILE)} className="p-2 text-slate-500 hover:text-indigo-600"><User size={20} /></button>
        </div>
      </div>

      <aside className={`fixed md:relative z-50 inset-y-0 left-0 w-72 bg-white border-r shadow-2xl md:shadow-none transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">E</div><h1 className="font-bold text-xl tracking-tight">ExamOS</h1></div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2"><X size={24} /></button>
          </div>
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { setActiveSection(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeSection === item.id ? 'bg-indigo-600 text-white shadow-md font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
               <div className="flex items-center justify-between mb-3"><p className="text-[10px] font-black uppercase text-slate-400">Vault Mode</p><ShieldCheck size={12} className="text-emerald-500" /></div>
               <div className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">A</div><div className="truncate flex-1"><p className="text-xs font-bold truncate">{state.profile.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{isOnline ? 'Online' : 'Offline Mode'}</p></div></div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="hidden md:flex bg-white/80 backdrop-blur-md border-b px-8 py-4 items-center justify-between sticky top-0 z-40">
          <div><h2 className="text-lg font-bold text-slate-800">{NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Aspirant Profile'}</h2><p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p></div>
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveSection(AppSection.REMINDERS)} className="p-2 text-slate-400 bg-slate-50 rounded-lg hover:text-indigo-600 relative"><Bell size={20}/>{state.reminders.some(r => r.status === 'active') && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>}</button>
             <button onClick={toggleTheme} className="p-2 text-slate-400 bg-slate-50 rounded-lg hover:text-indigo-600"><Smartphone size={20}/></button>
             <button onClick={() => setIsLocked(true)} className="p-2 text-slate-400 bg-slate-50 rounded-lg hover:text-rose-500" title="Manual Lock"><LockIcon size={20}/></button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </section>

        {/* Bottom Dock Navigation for Mobile (All Shortcuts) */}
        <div className="md:hidden flex bg-white border-t p-2 overflow-x-auto no-scrollbar sticky bottom-0 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-1 mx-auto">
            {NAV_ITEMS.map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveSection(item.id)} 
                className={`p-3 min-w-[50px] flex flex-col items-center gap-1 rounded-2xl transition-all ${activeSection === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 active:bg-slate-50'}`}
              >
                {item.icon}
                <span className={`text-[7px] font-black uppercase tracking-tighter transition-opacity duration-300 ${activeSection === item.id ? 'opacity-100' : 'opacity-40'}`}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
