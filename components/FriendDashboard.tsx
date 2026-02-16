
import React, { useState, useMemo } from 'react';
import { AppState, User, ProgressRecord, Message, Role, StatusUpdate, Attachment } from '../types';
import { MOTIVATIONAL_QUOTES } from '../constants';
import { getDailyInspiration } from '../services/geminiService';

interface FriendDashboardProps {
  user: User;
  state: AppState;
  onUpdateRecord: (record: Partial<ProgressRecord>) => void;
  onSendMessage: (content: string, attachment?: Attachment) => void;
  onUploadStatus: (content?: string, attachment?: Attachment) => void;
}

const FriendDashboard: React.FC<FriendDashboardProps> = ({ user, state, onUpdateRecord, onSendMessage, onUploadStatus }) => {
  const [tab, setTab] = useState<'track' | 'support' | 'groups' | 'status'>('track');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [msgInput, setMsgInput] = useState('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  
  // Status states
  const [statusContent, setStatusContent] = useState('');

  const currentRecord = useMemo(() => {
    const record = state.records.find(r => r.userId === user.id && r.date === selectedDate);
    if (record) return record;
    
    // Return a structured placeholder that matches the shape expected by UI
    return {
      id: 'temp-' + selectedDate,
      userId: user.id,
      date: selectedDate,
      tasksCompleted: [],
      timeSpentMinutes: 0,
      remarks: '',
      dayJournal: '',
      mood: ''
    } as ProgressRecord;
  }, [state.records, user.id, selectedDate]);

  const activeStatuses = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return state.statuses.filter(s => new Date(s.timestamp).getTime() > dayAgo);
  }, [state.statuses]);

  // Fix: Explicitly typing dates as string[] to resolve TypeScript overload matching error with the Date constructor
  const streak = useMemo(() => {
    const dates: string[] = Array.from(new Set(state.records.filter(r => r.userId === user.id && r.tasksCompleted.length > 0).map(r => r.date))).sort().reverse();
    let count = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
       const d = new Date(dates[i]);
       d.setHours(0, 0, 0, 0);
       const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 3600 * 24));
       if (diff <= i) count++; else break;
    }
    return count;
  }, [state.records, user.id]);

  const dailyQuote = useMemo(() => {
    const day = new Date().getDate();
    return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
  }, []);

  const handleAiInsight = async () => {
    const insight = await getDailyInspiration(currentRecord);
    setAiInsight(insight);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'chat' | 'status') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const attachment: Attachment = { name: file.name, type: file.type, data: base64 };
    
    if (type === 'chat') {
      onSendMessage(`Shared a file: ${file.name}`, attachment);
    } else {
      onUploadStatus(statusContent, attachment);
      setStatusContent('');
    }
  };

  const myGroups = state.groups.filter(g => g.memberIds.includes(user.id));

  const moods = [
    { emoji: '🔥', label: 'Energized' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '😔', label: 'Struggling' }
  ];

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      {/* Sidebar */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black">{user.name[0]}</div>
              <div>
                <h2 className="font-black text-slate-800">{user.name}</h2>
                <p className="text-xs text-slate-400">@{user.username}</p>
              </div>
           </div>
           <nav className="space-y-3">
              <button onClick={() => setTab('track')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'track' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}><i className="fas fa-calendar-alt"></i> Journey Log</button>
              <button onClick={() => setTab('groups')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'groups' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}><i className="fas fa-users"></i> Growth Groups</button>
              <button onClick={() => setTab('support')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'support' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}><i className="fas fa-comment-medical"></i> Help Desk</button>
              <button onClick={() => setTab('status')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'status' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}><i className="fas fa-circle-notch"></i> Post Status</button>
           </nav>
        </div>

        <div className="bg-orange-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-orange-100 relative overflow-hidden">
           <i className="fas fa-fire absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12"></i>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Consistency Fire</p>
           <p className="text-5xl font-black">{streak} Days</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute -top-4 -left-4 text-indigo-50 text-6xl font-black">“</div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 relative z-10">Daily Wisdom</p>
          <p className="text-sm font-medium text-slate-700 italic leading-relaxed relative z-10">"{dailyQuote}"</p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-9 space-y-6">
        {/* Status Bar */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 overflow-x-auto flex gap-6 items-center shadow-sm">
           <button onClick={() => setTab('status')} className="flex flex-col items-center gap-2 flex-shrink-0 group">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-400 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all">
                <i className="fas fa-plus"></i>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Update</span>
           </button>
           {activeStatuses.map(s => (
             <div key={s.id} className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer">
                <div className="w-16 h-16 rounded-full p-1 border-2 border-indigo-600 overflow-hidden group-hover:scale-105 transition-all bg-white">
                  {s.attachment ? (
                    <img src={s.attachment.data} className="w-full h-full object-cover rounded-full" alt="" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center font-black text-indigo-600">{s.userName[0]}</div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-600 truncate w-16 text-center">{s.userName === user.name ? 'Me' : s.userName}</span>
             </div>
           ))}
        </div>

        {tab === 'track' && (
          <div className="space-y-6">
            {/* History Selector */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-history"></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">Viewing History</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-black">{isToday ? "Today's Logs" : `Logs for ${selectedDate}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => { setSelectedDate(e.target.value); setAiInsight(null); }}
                  className="flex-1 md:flex-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                />
                {!isToday && (
                  <button 
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                    className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase px-3 py-2 rounded-xl hover:bg-indigo-100 transition-all"
                  >Today</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Missions: {selectedDate}</h3>
                  <div className="space-y-3">
                    {state.tasks.map(t => {
                      const done = currentRecord.tasksCompleted.includes(t.id);
                      return (
                        <button key={t.id} onClick={() => {
                          const newList = done ? currentRecord.tasksCompleted.filter(id => id !== t.id) : [...currentRecord.tasksCompleted, t.id];
                          onUpdateRecord({ ...currentRecord, tasksCompleted: newList });
                        }} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${done ? 'bg-indigo-50 border-indigo-100 text-indigo-900' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                          <div className="flex flex-col items-start">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{t.category}</span>
                            <span className="font-bold text-sm">{t.title}</span>
                          </div>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${done ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-200'}`}><i className="fas fa-check text-[10px]"></i></div>
                        </button>
                      );
                    })}
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Mood of the Day</h3>
                    <div className="flex justify-between gap-2">
                      {moods.map(m => (
                        <button 
                          key={m.label}
                          onClick={() => onUpdateRecord({ ...currentRecord, mood: m.label })}
                          className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all flex-1 ${currentRecord.mood === m.label ? 'bg-indigo-50 border border-indigo-100 scale-105 shadow-sm' : 'hover:bg-slate-50 grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}
                        >
                          <span className="text-2xl">{m.emoji}</span>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Daily Stats</h3>
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Focus Time (Min)</span>
                        <input type="number" value={currentRecord.timeSpentMinutes || ''} onChange={e => onUpdateRecord({...currentRecord, timeSpentMinutes: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" placeholder="e.g. 90" />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Breakthrough</span>
                        <input type="text" value={currentRecord.remarks} onChange={e => onUpdateRecord({...currentRecord, remarks: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" placeholder="What did you solve today?" />
                      </label>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Reflection Journal</h3>
                <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest font-black">Your Supporter reads this daily</p>
                <textarea 
                  value={currentRecord.dayJournal} onChange={e => onUpdateRecord({...currentRecord, dayJournal: e.target.value})}
                  placeholder="Describe your process, blocks, and wins..."
                  className="w-full h-48 bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                />
              </div>

              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">AI Daily Analysis</h4>
                  {aiInsight ? <p className="text-sm font-medium italic">"{aiInsight}"</p> : <p className="text-sm opacity-60 italic leading-relaxed">Let Gemini analyze this specific day's effort and give you advice.</p>}
                </div>
                <button onClick={handleAiInsight} className="mt-6 w-full py-4 bg-white/20 hover:bg-white/30 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all">Analyze {selectedDate}</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'groups' && (
          <div className="space-y-6">
            {myGroups.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center text-slate-400">You aren't in any groups yet. Your Supporter will add you to relevant cohorts.</div>
            ) : (
              myGroups.map(group => (
                <div key={group.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-8 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-2xl font-black text-slate-800">{group.name}</h3>
                    <p className="text-sm text-slate-500">{group.description}</p>
                  </div>
                  <div className="p-8 space-y-6">
                    {group.posts.slice().reverse().map(post => (
                      <div key={post.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-widest">Admin Broadcast</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(post.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed mb-4">{post.content}</p>
                        {post.attachment && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <i className="fas fa-file-alt text-indigo-500 text-xl"></i>
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-black text-slate-700 truncate">{post.attachment.name}</p>
                               <p className="text-[9px] text-slate-400 uppercase tracking-widest">Click to view/download</p>
                            </div>
                            <a href={post.attachment.data} download={post.attachment.name} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Download</a>
                          </div>
                        )}
                      </div>
                    ))}
                    {group.posts.length === 0 && <p className="text-center text-slate-400 italic">No posts in this group yet.</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'support' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm h-[650px] flex flex-col">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-slate-800">Support Desk</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Direct Secure Channel with Supporter</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Always Active</span>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {state.messages
                  .filter(m => (m.senderId === user.id || m.receiverId === user.id))
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map(m => (
                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                       <div className="max-w-[75%] space-y-2">
                          <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'}`}>
                             {m.content}
                          </div>
                          {m.attachment && (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                               <i className="fas fa-paperclip text-indigo-500"></i>
                               <span className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">{m.attachment.name}</span>
                               <a href={m.attachment.data} download={m.attachment.name} className="bg-indigo-600 text-white px-3 py-1 rounded text-[9px] font-black ml-auto uppercase tracking-tighter">Save</a>
                            </div>
                          )}
                          <p className={`text-[9px] font-black text-slate-300 uppercase tracking-widest ${m.senderId === user.id ? 'text-right' : 'text-left'}`}>{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                       </div>
                    </div>
                  ))
                }
             </div>
             <div className="p-8 border-t border-slate-100 flex gap-4">
                <input 
                  type="text" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (onSendMessage(msgInput), setMsgInput(''))}
                  placeholder="Need help or guidance?" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm"
                />
                <label className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-all">
                   <i className="fas fa-paperclip"></i>
                   <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'chat')} />
                </label>
                <button onClick={() => { onSendMessage(msgInput); setMsgInput(''); }} className="bg-indigo-600 text-white w-14 h-14 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center"><i className="fas fa-paper-plane"></i></button>
             </div>
          </div>
        )}

        {tab === 'status' && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl max-w-2xl mx-auto">
             <div className="text-center mb-10">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto mb-6"><i className="fas fa-circle-notch animate-spin"></i></div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Post Your Status</h3>
                <p className="text-slate-500 mt-2">Visible to everyone for 24 hours. Archived for the Supporter.</p>
             </div>
             <div className="space-y-6">
                <textarea 
                  value={statusContent} onChange={e => setStatusContent(e.target.value)}
                  placeholder="What's happening right now? (Optional caption)"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm h-32 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                />
                <div className="grid grid-cols-1 gap-4">
                   <label className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group">
                      <i className="fas fa-cloud-upload-alt text-4xl text-slate-200 group-hover:text-indigo-400 mb-4"></i>
                      <span className="text-sm font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">Select Image/Photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'status')} />
                   </label>
                   <button 
                     disabled={!statusContent}
                     onClick={() => { onUploadStatus(statusContent); setStatusContent(''); setTab('track'); }}
                     className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 disabled:opacity-50"
                   >Broadcast Update Only</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendDashboard;
