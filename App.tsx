
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
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  // 2. Load Data when Session is active
  useEffect(() => {
    if (sessionUser) {
      const initData = async () => {
        setIsSyncing(true);
        const data = await DataService.loadState(sessionUser.id);
        
        // Ensure currentUser is synced with auth metadata
        const userWithMeta: User = {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
          username: sessionUser.email || '',
          role: sessionUser.user_metadata?.role || Role.FRIEND,
          joinedAt: sessionUser.created_at
        };

        setState({ ...data, currentUser: userWithMeta });
        setIsSyncing(false);
        setTimeout(() => { isInitialLoad.current = false; }, 500);
      };
      initData();
    } else {
      setState(null);
      isInitialLoad.current = true;
    }
  }, [sessionUser]);

  // 3. Cloud Auto-save
  useEffect(() => {
    if (state && sessionUser && !isInitialLoad.current) {
      DataService.saveState(sessionUser.id, state);
    }
  }, [state, sessionUser]);

  const handleLogout = async () => {
    await DataService.signOut();
    setSessionUser(null);
    setState(null);
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
      return {
        ...prev,
        messages: [...prev.messages, newMessage]
      };
    });
  }, []);

  // Sync wrappers for AuthScreen
  const handleLoginSuccess = (user: User) => {
    // Session is handled by useEffect listener
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl animate-bounce shadow-2xl shadow-indigo-200 mb-8">
          <i className="fas fa-shield-check animate-pulse"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-800">Security Check</h2>
        <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest font-bold">Verifying Cloud Identity...</p>
      </div>
    );
  }

  // LOGIN GUARD: No session = No app
  if (!sessionUser || !state) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = state.currentUser?.role === Role.ADMIN;

  return (
    <Layout user={state.currentUser!} onLogout={handleLogout}>
      {isAdmin ? (
        <AdminDashboard 
          state={state} 
          onSendMessage={handleSendMessage}
          onAddGroup={() => {}} // simplified for this update
          onPostToGroup={() => {}} 
          onUpdateGroupMembers={() => {}}
        />
      ) : (
        <FriendDashboard 
          user={state.currentUser!} 
          state={state} 
          onUpdateRecord={handleUpdateRecord} 
          onSendMessage={(content, attachment) => handleSendMessage('admin-1', content, attachment)}
          onUploadStatus={() => {}}
        />
      )}
    </Layout>
  );
};

export default App;
