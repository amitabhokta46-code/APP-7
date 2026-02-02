
import React, { useState } from 'react';
import { 
  Plus, Search, StickyNote, Pin, Trash2, Save, X, 
  CheckSquare, Square, ChevronRight, Edit3, Filter,
  Share2, Download, BookOpen
} from 'lucide-react';
import { AppState, Note } from '../types';

interface NotesProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Notes: React.FC<NotesProps> = ({ state, setState }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [newNote, setNewNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    category: 'General',
    checkpoints: []
  });

  const filteredNotes = state.notes
    .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.lastEdited - a.lastEdited);

  const saveNote = () => {
    if (!newNote.title) return;
    const note: Note = {
      id: newNote.id || Math.random().toString(36).substr(2, 9),
      title: newNote.title,
      content: newNote.content || '',
      category: newNote.category || 'General',
      lastEdited: Date.now(),
      isPinned: newNote.isPinned || false,
      checkpoints: newNote.checkpoints || []
    };

    setState(prev => ({
      ...prev,
      notes: newNote.id ? prev.notes.map(n => n.id === newNote.id ? note : n) : [note, ...prev.notes]
    }));
    setIsEditing(false);
    setNewNote({ title: '', content: '', category: 'General', checkpoints: [] });
  };

  const deleteNote = (id: string) => {
    if (confirm("Move note to archive?")) {
      setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
    }
  };

  const togglePin = (id: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n)
    }));
  };

  const addCheckpoint = () => {
    setNewNote(prev => ({
      ...prev,
      checkpoints: [...(prev.checkpoints || []), { id: Math.random().toString(), text: '', done: false }]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 h-[calc(100vh-180px)] overflow-hidden">
      {/* Sidebar List */}
      <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search neural patterns..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
          {filteredNotes.map(note => (
            <div 
              key={note.id} 
              onClick={() => { setNewNote(note); setIsEditing(true); }}
              className={`p-6 rounded-[32px] border transition-all cursor-pointer group relative ${selectedNote?.id === note.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-black truncate w-40">{note.title}</h4>
                <div className="flex gap-1">
                   <button onClick={(e) => { e.stopPropagation(); togglePin(note.id); }} className={`p-1.5 rounded-lg ${note.isPinned ? 'text-amber-400' : 'text-slate-300'}`}><Pin size={14} /></button>
                </div>
              </div>
              <p className={`text-xs line-clamp-2 mb-4 font-medium ${selectedNote?.id === note.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                {note.content || (note.checkpoints.length > 0 ? `${note.checkpoints.length} checklist items` : 'No content')}
              </p>
              <div className="flex justify-between items-center">
                 <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${selectedNote?.id === note.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>{note.category}</span>
                 <span className={`text-[8px] font-bold ${selectedNote?.id === note.id ? 'text-indigo-200' : 'text-slate-300'}`}>{new Date(note.lastEdited).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          <button onClick={() => { setNewNote({ title: '', content: '', category: 'General', checkpoints: [] }); setIsEditing(true); }} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Create New Matrix
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="lg:col-span-8 bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {isEditing ? (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
               <input 
                 type="text" 
                 value={newNote.title} 
                 onChange={e => setNewNote({...newNote, title: e.target.value})}
                 placeholder="Untitled Neural Node"
                 className="text-2xl font-black bg-transparent outline-none w-full placeholder:text-slate-200" 
               />
               <div className="flex gap-2">
                 <button onClick={() => deleteNote(newNote.id!)} className="p-3 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={20}/></button>
                 <button onClick={saveNote} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2"><Save size={16}/> Sync Node</button>
                 <button onClick={() => setIsEditing(false)} className="p-3 text-slate-300 hover:text-slate-600"><X size={24}/></button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-indigo-600">
                   <Edit3 size={18}/>
                   <h5 className="text-[10px] font-black uppercase tracking-widest">Synthesis Area</h5>
                 </div>
                 <textarea 
                   value={newNote.content}
                   onChange={e => setNewNote({...newNote, content: e.target.value})}
                   placeholder="Enter your synthesized knowledge here..."
                   className="w-full h-48 bg-slate-50 rounded-3xl p-8 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 border border-slate-100 transition-all resize-none"
                 />
              </div>

              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <CheckSquare size={18}/>
                      <h5 className="text-[10px] font-black uppercase tracking-widest">Procedural Checkpoints</h5>
                    </div>
                    <button onClick={addCheckpoint} className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-600 pb-0.5">Add Path</button>
                 </div>
                 <div className="space-y-3">
                   {newNote.checkpoints?.map((cp, idx) => (
                     <div key={cp.id} className="flex items-center gap-4 group">
                        <button onClick={() => {
                          const updated = [...(newNote.checkpoints || [])];
                          updated[idx].done = !updated[idx].done;
                          setNewNote({...newNote, checkpoints: updated});
                        }} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${cp.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-300 border border-slate-100 hover:bg-white'}`}>
                          {cp.done ? <CheckSquare size={16}/> : <Square size={16}/>}
                        </button>
                        <input 
                          type="text" 
                          value={cp.text}
                          onChange={e => {
                            const updated = [...(newNote.checkpoints || [])];
                            updated[idx].text = e.target.value;
                            setNewNote({...newNote, checkpoints: updated});
                          }}
                          className={`flex-1 bg-transparent border-b border-transparent focus:border-indigo-100 outline-none font-bold text-sm py-2 transition-all ${cp.done ? 'text-slate-300 line-through' : 'text-slate-600'}`}
                          placeholder="Describe milestone..."
                        />
                        <button onClick={() => {
                           const updated = (newNote.checkpoints || []).filter(c => c.id !== cp.id);
                           setNewNote({...newNote, checkpoints: updated});
                        }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-200 hover:text-rose-500 transition-all"><X size={14}/></button>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-in zoom-in-95 duration-700">
            <div className="w-32 h-32 bg-slate-50 text-slate-200 rounded-[48px] flex items-center justify-center mb-8 shadow-inner">
               <BookOpen size={64}/>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence Matrix</h3>
            <p className="text-slate-400 font-medium max-w-sm mt-4 leading-relaxed">Select a neural node from the sidebar to begin processing or synthesis.</p>
            <button onClick={() => { setNewNote({ title: '', content: '', category: 'General', checkpoints: [] }); setIsEditing(true); }} className="mt-10 px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all">Initialize New Node</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
