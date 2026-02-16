
import React, { useState, useMemo } from 'react';
import { AppState, User, Role, ProgressRecord, Message, Group, Attachment } from '../types';
import { getJournalSummary } from '../services/geminiService';

interface AdminDashboardProps {
  state: AppState;
  onSendMessage: (receiverId: string, content: string, attachment?: Attachment) => void;
  onAddGroup: (name: string, description: string, memberIds: string[]) => void;
  onPostToGroup: (groupId: string, content: string, attachment?: Attachment) => void;
  onUpdateGroupMembers: (groupId: string, memberIds: string[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ state, onSendMessage, onAddGroup, onPostToGroup, onUpdateGroupMembers }) => {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'messages' | 'groups' | 'statuses' | 'settings'>('overview');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  
  // Group States
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupViewTab, setGroupViewTab] = useState<'posts' | 'members'>('posts');
  const [groupPostInput, setGroupPostInput] = useState('');

  const friends = useMemo(() => state.users.filter(u => u.role === Role.FRIEND), [state.users]);
  const selectedFriend = useMemo(() => friends.find(f => f.id === selectedFriendId), [friends, selectedFriendId]);
  
  const friendRecords = useMemo(() => {
    if (!selectedFriendId) return [];
    return state.records.filter(r => r.userId === selectedFriendId).sort((a, b) => b.date.localeCompare(a.date));
  }, [state.records, selectedFriendId]);

  const handleFetchAiSummary = async () => {
    if (!selectedFriend) return;
    setLoadingAI(true);
    const summary = await getJournalSummary(selectedFriend, friendRecords);
    setAiSummary(summary);
    setLoadingAI(false);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `b_progress_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleGroupCreation = () => {
    if (!newGroupName) return;
    onAddGroup(newGroupName, newGroupDesc, selectedMembers);
    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedMembers([]);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'chat' | 'group') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const attachment: Attachment = { name: file.name, type: file.type, data: base64 };
    
    if (target === 'chat' && selectedFriendId) {
      onSendMessage(selectedFriendId, `Sent a file: ${file.name}`, attachment);
    } else if (target === 'group' && selectedGroupId) {
      onPostToGroup(selectedGroupId, `Shared an attachment: ${file.name}`, attachment);
    }
  };

  const toggleGroupMember = (groupId: string, userId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    const isMember = group.memberIds.includes(userId);
    const newMemberIds = isMember 
      ? group.memberIds.filter(id => id !== userId) 
      : [...group.memberIds, userId];
    onUpdateGroupMembers(groupId, newMemberIds);
  };

  const moodEmojis: Record<string, string> = {
    'Energized': '🔥',
    'Good': '😊',
    'Neutral': '😐',
    'Tired': '😴',
    'Struggling': '😔'
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Supporter Command Center</h2>
          <div className="flex gap-4 mt-2">
            <button onClick={() => setActiveView('overview')} className={`text-xs font-bold uppercase tracking-widest ${activeView === 'overview' ? 'text-indigo-600' : 'text-slate-400'}`}>Monitor</button>
            <button onClick={() => setActiveView('groups')} className={`text-xs font-bold uppercase tracking-widest ${activeView === 'groups' ? 'text-indigo-600' : 'text-slate-400'}`}>Groups</button>
            <button onClick={() => setActiveView('statuses')} className={`text-xs font-bold uppercase tracking-widest ${activeView === 'statuses' ? 'text-indigo-600' : 'text-slate-400'}`}>Status Logs</button>
            <button onClick={() => setActiveView('settings')} className={`text-xs font-bold uppercase tracking-widest ${activeView === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}>System</button>
          </div>
        </div>
        <button onClick={handleExportData} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2">
           <i className="fas fa-download"></i> Backup History
        </button>
      </header>

      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm h-fit">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Active Friends</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {friends.map(f => (
                <button 
                  key={f.id}
                  onClick={() => { setSelectedFriendId(f.id); setAiSummary(null); setActiveView('overview'); }}
                  className={`w-full p-6 text-left hover:bg-slate-50 transition-all flex items-center justify-between ${selectedFriendId === f.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{f.name[0]}</div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{f.name}</p>
                      <p className="text-xs text-slate-400">Consistency Tracker</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {selectedFriend ? (
              <>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{selectedFriend.name}</h3>
                    <p className="text-sm text-slate-500">@{selectedFriend.username} • Journaling Active</p>
                  </div>
                  <button 
                    onClick={() => setActiveView('messages')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Open Private Chat
                  </button>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2rem] text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                      <i className="fas fa-brain"></i> AI Mood Analysis
                    </h4>
                    <button onClick={handleFetchAiSummary} disabled={loadingAI} className="bg-white/20 hover:bg-white/30 py-1.5 px-4 rounded-lg text-[10px] font-black uppercase">
                      {loadingAI ? 'Analyzing...' : 'Deep Scan Journals'}
                    </button>
                  </div>
                  {aiSummary ? <p className="text-sm font-medium leading-relaxed italic">"{aiSummary}"</p> : <p className="text-sm opacity-60 italic">Summarize recent journals to detect blockers.</p>}
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                   <div className="p-6 bg-slate-50 border-b border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400">Activity Log</div>
                   <div className="divide-y divide-slate-50">
                     {friendRecords.map(r => (
                       <div key={r.id} className="p-6 hover:bg-slate-50/50">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-slate-800">{r.date}</span>
                             {r.mood && (
                               <span className="text-lg" title={r.mood}>{moodEmojis[r.mood] || '❓'}</span>
                             )}
                           </div>
                           <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{r.tasksCompleted.length} Tasks Done</span>
                         </div>
                         <p className="text-sm text-slate-600 leading-relaxed italic mb-2">"{r.remarks || 'No daily breakthrough noted'}"</p>
                         <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-100/50 p-4 rounded-xl">{r.dayJournal || 'No detailed journal entry provided.'}</p>
                       </div>
                     ))}
                   </div>
                </div>
              </>
            ) : (
              <div className="h-full bg-slate-100/30 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                <i className="fas fa-chart-pie text-5xl mb-6 opacity-10"></i>
                <h4 className="text-xl font-bold text-slate-600">Growth Dashboard</h4>
                <p className="mt-2 text-sm max-w-xs">Select a friend from the left to monitor their progress and offer human support.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Create New Group</h3>
              <div className="space-y-4">
                <input 
                  type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Group Name" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm"
                />
                <textarea 
                  value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
                  placeholder="Purpose (e.g. Q4 Growth Batch)" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm h-24"
                />
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial Members</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {friends.map(f => (
                      <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-all">
                        <input 
                          type="checkbox" checked={selectedMembers.includes(f.id)}
                          onChange={() => {
                            setSelectedMembers(prev => prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]);
                          }}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleGroupCreation}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
                >
                  Launch Group
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {state.groups.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center text-slate-400">
                No groups created yet. Organize your friends into focused cohorts.
              </div>
            ) : (
              state.groups.map(group => (
                <div key={group.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">{group.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{group.description}</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { setSelectedGroupId(selectedGroupId === group.id && groupViewTab === 'posts' ? null : group.id); setGroupViewTab('posts'); }}
                          className={`text-xs font-black uppercase px-4 py-2 rounded-lg transition-all ${selectedGroupId === group.id && groupViewTab === 'posts' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'}`}
                        >
                          Posts
                        </button>
                        <button 
                          onClick={() => { setSelectedGroupId(selectedGroupId === group.id && groupViewTab === 'members' ? null : group.id); setGroupViewTab('members'); }}
                          className={`text-xs font-black uppercase px-4 py-2 rounded-lg transition-all ${selectedGroupId === group.id && groupViewTab === 'members' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          Manage Members
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {selectedGroupId === group.id && (
                    <div className="p-8 space-y-6">
                      {groupViewTab === 'posts' ? (
                        <>
                          <div className="flex gap-3">
                            <input 
                              type="text" value={groupPostInput} onChange={e => setGroupPostInput(e.target.value)}
                              placeholder="Broadcast a message to this group..."
                              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm"
                            />
                            <label className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-all text-slate-500">
                              <i className="fas fa-paperclip"></i>
                              <input type="file" className="hidden" onChange={(e) => handleAttachmentUpload(e, 'group')} />
                            </label>
                            <button 
                              onClick={() => { onPostToGroup(group.id, groupPostInput); setGroupPostInput(''); }}
                              className="bg-indigo-600 text-white px-6 rounded-xl font-bold"
                            >Post</button>
                          </div>
                          
                          <div className="space-y-4">
                            {group.posts.slice().reverse().map(post => (
                              <div key={post.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
                                {post.attachment && (
                                  <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                                    <i className="fas fa-file-image text-indigo-500"></i>
                                    <span className="text-xs font-bold text-slate-600 truncate">{post.attachment.name}</span>
                                    <a href={post.attachment.data} download={post.attachment.name} className="text-indigo-600 text-[10px] font-black ml-auto uppercase tracking-wider">Download</a>
                                  </div>
                                )}
                                <p className="text-[9px] text-slate-400 mt-2 font-black uppercase">{new Date(post.timestamp).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Add or Remove Members</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {friends.map(f => {
                              const isMember = group.memberIds.includes(f.id);
                              return (
                                <button 
                                  key={f.id}
                                  onClick={() => toggleGroupMember(group.id, f.id)}
                                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${isMember ? 'bg-emerald-50 border-emerald-100 ring-2 ring-emerald-500/10' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                                >
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isMember ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {f.name[0]}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">{f.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">{isMember ? 'In Group' : 'Not Member'}</p>
                                  </div>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isMember ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-100'}`}>
                                    <i className="fas fa-check text-[10px]"></i>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeView === 'messages' && selectedFriendId && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 h-[650px] flex flex-col shadow-sm">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800">Support Session: {selectedFriend?.name}</h3>
                <p className="text-xs text-slate-400">Direct Human Accountability & Guidance</p>
              </div>
              <button onClick={() => setActiveView('overview')} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
           </div>
           <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {state.messages
                .filter(m => (m.senderId === selectedFriendId && m.receiverId === state.currentUser?.id) || (m.senderId === state.currentUser?.id && m.receiverId === selectedFriendId))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map(m => (
                  <div key={m.id} className={`flex ${m.senderId === state.currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] space-y-2`}>
                      <div className={`p-4 rounded-2xl text-sm ${m.senderId === state.currentUser?.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                        {m.content}
                      </div>
                      {m.attachment && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                           <i className="fas fa-paperclip text-indigo-500"></i>
                           <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">{m.attachment.name}</span>
                           <a href={m.attachment.data} download={m.attachment.name} className="text-indigo-600 text-[9px] font-black uppercase">Download</a>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
           </div>
           <div className="p-8 border-t border-slate-100 flex gap-4">
              <input 
                type="text" value={replyInput} onChange={e => setReplyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (onSendMessage(selectedFriendId, replyInput), setReplyInput(''))}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Compose guidance..."
              />
              <label className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-200 text-slate-500">
                <i className="fas fa-image"></i>
                <input type="file" className="hidden" onChange={(e) => handleAttachmentUpload(e, 'chat')} />
              </label>
              <button onClick={() => { onSendMessage(selectedFriendId, replyInput); setReplyInput(''); }} className="bg-indigo-600 text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100"><i className="fas fa-paper-plane"></i></button>
           </div>
        </div>
      )}

      {activeView === 'statuses' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
           <h3 className="text-2xl font-black text-slate-800 mb-6">Master Status History</h3>
           <p className="text-sm text-slate-500 mb-8">All 24h statuses are permanently archived here for the Supporter to review past consistency patterns.</p>
           <div className="space-y-6">
             {state.statuses.slice().reverse().map(status => (
               <div key={status.id} className="flex gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black flex-shrink-0">{status.userName[0]}</div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-bold text-slate-800">{status.userName}</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(status.timestamp).toLocaleString()}</span>
                   </div>
                   {status.content && <p className="text-sm text-slate-600 mb-3 leading-relaxed">{status.content}</p>}
                   {status.attachment && (
                     <div className="mt-2 group relative max-w-sm rounded-xl overflow-hidden shadow-md">
                        <img src={status.attachment.data} alt="Status Content" className="w-full h-auto" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                           <a href={status.attachment.data} download={status.attachment.name} className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-xs uppercase">Download Original</a>
                        </div>
                     </div>
                   )}
                 </div>
               </div>
             ))}
             {state.statuses.length === 0 && <p className="text-center text-slate-400 italic">No statuses have been uploaded yet.</p>}
           </div>
        </div>
      )}

      {activeView === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center text-2xl"><i className="fas fa-database"></i></div>
               <div>
                 <h3 className="text-2xl font-black text-slate-800">System Controls</h3>
                 <p className="text-sm text-slate-400">Manage global data and application settings</p>
               </div>
             </div>
             
             <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                   <div>
                     <p className="font-bold text-indigo-900">Download System Backup</p>
                     <p className="text-xs text-indigo-600">Export all users, groups, and history as a JSON file.</p>
                   </div>
                   <button onClick={handleExportData} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-md">Export JSON</button>
                </div>
                
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="font-bold text-slate-800">Storage Information</p>
                   <p className="text-xs text-slate-500 mb-4">Your data is currently stored in LocalStorage. To ensure no history is lost, use the Export feature frequently.</p>
                   <div className="flex gap-4">
                      <div className="flex-1 p-4 bg-white rounded-xl border border-slate-200 text-center">
                         <p className="text-xl font-black text-indigo-600">{state.records.length}</p>
                         <p className="text-[10px] font-black uppercase text-slate-400">Total Records</p>
                      </div>
                      <div className="flex-1 p-4 bg-white rounded-xl border border-slate-200 text-center">
                         <p className="text-xl font-black text-indigo-600">{state.messages.length}</p>
                         <p className="text-[10px] font-black uppercase text-slate-400">Total Messages</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
