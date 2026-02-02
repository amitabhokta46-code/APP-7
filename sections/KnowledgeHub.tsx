
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Plus, BookOpen, Library, Speech, 
  Download, Play, X, Save, FileText, Youtube, Bookmark, 
  ChevronRight, Music, Mic, Trash2, Headphones,
  ExternalLink, Sparkles, Filter, MoreHorizontal,
  CloudLightning, Globe, Upload, Bell, BellRing, BrainCircuit,
  MessageSquareText, Edit3, Volume2, Link as LinkIcon
} from 'lucide-react';
import { AppState, HubBook, HubSyllabusMaterial, HubPersonalityTopic, Reminder } from '../types';
import { synthesizeMaterial } from '../services/gemini';

interface KnowledgeHubProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ state, setState }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'books' | 'syllabus' | 'personality'>('all');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Partial<HubBook> | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const filteredBooks = useMemo(() => 
    state.hubBooks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [state.hubBooks, searchQuery]
  );

  return (
    <div className="space-y-8 pb-24 px-2 md:px-0">
      {/* Search and Navigation */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="relative w-full lg:w-[450px] group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Universal Knowledge Query..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[32px] text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all" 
          />
        </div>
        <div className="flex bg-white p-1.5 rounded-[28px] border border-slate-100 shadow-sm w-full lg:w-auto overflow-x-auto no-scrollbar">
          {['all', 'books', 'syllabus', 'personality'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t as any)} 
              className={`flex-1 lg:flex-none px-8 py-3.5 rounded-[22px] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      <div className="space-y-10">
        {(activeTab === 'all' || activeTab === 'books') && (
          <div className="space-y-8">
            <div className="flex justify-between items-end px-4">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">Intelligence Vault</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Curated High-Value Assets</p>
              </div>
              <button onClick={() => { setSelectedBook({}); setIsBookModalOpen(true); }} className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 transition-all active:scale-90"><Plus size={24}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
               {filteredBooks.map(book => (
                <div key={book.id} className="bg-white p-8 md:p-10 rounded-[48px] md:rounded-[64px] border border-slate-50 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col min-h-[380px]">
                   <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center font-black text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">{book.name[0]}</div>
                      <div className="flex gap-2">
                         {book.audioUrl && (
                           <button className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all active:scale-90 shadow-sm">
                             <Volume2 size={20}/>
                           </button>
                         )}
                         <button onClick={async () => {
                           setIsSynthesizing(true);
                           const summary = await synthesizeMaterial(book.name, book.notes);
                           setState(prev => ({...prev, hubBooks: prev.hubBooks.map(b => b.id === book.id ? {...b, aiSynthesis: summary} : b)}));
                           setIsSynthesizing(false);
                         }} className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90 shadow-sm"><BrainCircuit size={20}/></button>
                         <button onClick={() => { setSelectedBook(book); setIsBookModalOpen(true); }} className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-90"><Edit3 size={20}/></button>
                      </div>
                   </div>
                   
                   <div className="flex-1 space-y-4">
                      <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{book.name}</h4>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{book.author}</p>
                      
                      {book.aiSynthesis ? (
                        <div className="mt-4 p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 relative overflow-hidden">
                           <p className="text-[9px] font-black text-indigo-600 uppercase mb-2 tracking-widest flex items-center gap-1.5"><Sparkles size={10}/> Synthesis</p>
                           <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed font-medium">{book.aiSynthesis}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 font-medium leading-relaxed italic">{book.notes?.substring(0, 120)}...</p>
                      )}
                   </div>

                   <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest cursor-pointer group/btn">
                        Access Intel <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </div>
                      <span className="text-[9px] font-black uppercase text-slate-300">Vault ID: {book.id.substring(0, 4)}</span>
                   </div>
                </div>
               ))}
               {filteredBooks.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[64px] border-2 border-dashed border-slate-200">
                    <Library size={64} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">Neural Cache Empty</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Responsive Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-2xl animate-in fade-in" onClick={() => setIsBookModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[44px] md:rounded-[64px] p-8 md:p-16 shadow-2xl space-y-10 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center border-b pb-8">
                <div>
                   <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Protocol Log</h3>
                   <p className="text-indigo-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Information Ingestion</p>
                </div>
                <button onClick={() => setIsBookModalOpen(false)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><X size={32}/></button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Codename / Title</label>
                   <input value={selectedBook?.name || ''} onChange={e => setSelectedBook({...selectedBook, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-black text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Source / Author</label>
                   <input value={selectedBook?.author || ''} onChange={e => setSelectedBook({...selectedBook, author: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-black text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Raw Knowledge Pool</label>
                <textarea 
                  value={selectedBook?.notes || ''} 
                  onChange={e => setSelectedBook({...selectedBook, notes: e.target.value})} 
                  className="w-full h-48 bg-slate-50 border border-slate-100 rounded-[32px] px-8 py-6 font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none" 
                  placeholder="Paste context, takeaways, or chapter summaries here..."
                />
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Mic size={18}/>
                  <label className="text-[10px] font-black uppercase tracking-widest">Audio Intel Source</label>
                </div>
                <div className="flex gap-3">
                   <div className="relative flex-1 group">
                      <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={selectedBook?.audioUrl || ''} 
                        onChange={e => setSelectedBook({...selectedBook, audioUrl: e.target.value})} 
                        className="w-full pl-14 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[28px] text-sm font-medium focus:ring-4 focus:ring-amber-500/10 outline-none transition-all" 
                        placeholder="Paste Audio URL / Podcast Link..." 
                      />
                   </div>
                   <button className="p-5 bg-amber-50 text-amber-600 rounded-[28px] hover:bg-amber-600 hover:text-white transition-all active:scale-90 shadow-sm flex items-center justify-center">
                     <Upload size={22}/>
                   </button>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase ml-4 tracking-tighter">Supported: MP3, Podcast Links, YouTube Audio Streams</p>
             </div>

             <button 
                onClick={() => {
                  if (!selectedBook?.name) return;
                  const book: HubBook = {
                    id: selectedBook.id || Math.random().toString(36).substr(2, 9),
                    name: selectedBook.name,
                    author: selectedBook.author || 'Unknown',
                    category: 'Mindset',
                    status: 'Reading',
                    notes: selectedBook.notes || '',
                    keyTakeaways: [],
                    audioUrl: selectedBook.audioUrl || '',
                    fiveLineRecall: ''
                  };
                  setState(p => ({...p, hubBooks: selectedBook.id ? p.hubBooks.map(b => b.id === book.id ? book : b) : [book, ...p.hubBooks]}));
                  setIsBookModalOpen(false);
                }} 
                className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
             >
                Commit to Universal Hub
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeHub;
