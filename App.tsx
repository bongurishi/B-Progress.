
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Role, User, ProgressRecord, Message, Group, StatusUpdate, Attachment } from './types';
import { DataService, supabase } from './services/storage';
import AuthScreen from './components/AuthScreen';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import FriendDashboard from './components/FriendDashboard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const isInitialLoad = useRef(true);

  // 1. Session & Auth Listener
  useEffect(() => {
    const checkSession = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        setSessionUser(session?.user || null);
        if (!session) setIsSyncing(false);
      } else {
        setIsSyncing(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
      if (!session) {
        setState(null);
        setIsSyncing(false);
      }
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  // 2. Load Data when Session is active
  useEffect(() => {
    if (sessionUser) {
      const initData = async () => {
        setIsSyncing(true);
        
        const role = sessionUser.user_metadata?.role || Role.FRIEND;
        let data: AppState;

        if (role === Role.ADMIN) {
          // Admins load a merged view of all friend data
          data = await DataService.loadMasterState();
        } else {
          // Friends load only their own row
          data = await DataService.loadState(sessionUser.id);
        }
        
        const userWithMeta: User = {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
          username: sessionUser.email || '',
          role: role,
          joinedAt: sessionUser.created_at
        };

        setState({ ...data, currentUser: userWithMeta });
        setIsSyncing(false);
        setTimeout(() => { isInitialLoad.current = false; }, 500);
      };
      initData();
    }
  }, [sessionUser]);

  // 3. Per-User Save Logic (Cloud Sync)
  useEffect(() => {
    if (state && sessionUser && !isInitialLoad.current) {
      // We only save the current state to the user's specific row
      // Note: Admins shouldn't overwrite other people's rows via this auto-save
      // unless we specifically design a "global save" (which we don't need yet).
      if (state.currentUser?.role !== Role.ADMIN) {
        DataService.saveState(sessionUser.id, state);
      }
    }
  }, [state, sessionUser]);

  const handleLogout = async () => {
    setIsSyncing(true);
    await DataService.signOut();
    setSessionUser(null);
    setState(null);
    setIsSyncing(false);
  };

  const handleUpdateRecord = useCallback((recordUpdate: Partial<ProgressRecord>) => {
    setState(prev => {
      if (!prev) return null;
      const records = [...prev.records];
      const existingIdx = records.findIndex(r => 
        r.userId === recordUpdate.userId && 
        r.date === recordUpdate.date
      );

      if (existingIdx > -1) {
        records[existingIdx] = { ...records[existingIdx], ...recordUpdate };
      } else {
        const newRecord: ProgressRecord = {
          id: Math.random().toString(36).substr(2, 9),
          userId: recordUpdate.userId!,
          date: recordUpdate.date!,
          tasksCompleted: recordUpdate.tasksCompleted || [],
          timeSpentMinutes: recordUpdate.timeSpentMinutes || 0,
          remarks: recordUpdate.remarks || '',
          dayJournal: recordUpdate.dayJournal || '',
          mood: recordUpdate.mood || ''
        };
        records.push(newRecord);
      }
      return { ...prev, records };
    });
  }, []);

  const handleSendMessage = useCallback((receiverId: string, content: string, attachment?: Attachment) => {
    setState(prev => {
      if (!prev || !prev.currentUser || (!content.trim() && !attachment)) return prev;
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: prev.currentUser.id,
        receiverId,
        content,
        attachment,
        timestamp: new Date().toISOString(),
      };
      
      // If admin is sending, we might want to save this to the receiver's state too
      // For now, keeping it simple within the local state session
      return {
        ...prev,
        messages: [...prev.messages, newMessage]
      };
    });
  }, []);

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl animate-bounce shadow-2xl shadow-indigo-200 mb-8">
          <i className="fas fa-shield-check animate-pulse"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Accessing Cloud</h2>
        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-black">Decrypting Secure User Partition...</p>
      </div>
    );
  }

  // LOGIN GUARD
  if (!sessionUser || !state) {
    return <AuthScreen onLoginSuccess={() => {}} />;
  }

  const isAdmin = state.currentUser?.role === Role.ADMIN;

  return (
    <Layout user={state.currentUser!} onLogout={handleLogout}>
      {isAdmin ? (
        <AdminDashboard 
          state={state} 
          onSendMessage={handleSendMessage}
          onAddGroup={() => {}} 
          onPostToGroup={() => {}} 
          onUpdateGroupMembers={() => {}}
        />
      ) : (
        <FriendDashboard 
          user={state.currentUser!} 
          state={state} 
          onUpdateRecord={handleUpdateRecord} 
          onSendMessage={(content, attachment) => handleSendMessage('admin-id', content, attachment)}
          onUploadStatus={(content, attachment) => {
             setState(prev => {
               if (!prev || !prev.currentUser) return prev;
               const newStatus: StatusUpdate = {
                 id: Math.random().toString(36).substr(2, 9),
                 userId: prev.currentUser.id,
                 userName: prev.currentUser.name,
                 content,
                 attachment,
                 timestamp: new Date().toISOString()
               };
               return { ...prev, statuses: [...prev.statuses, newStatus] };
             });
          }}
        />
      )}
    </Layout>
  );
};

export default App;
