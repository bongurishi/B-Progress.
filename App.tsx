
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Role, User, ProgressRecord, Message, Group, StatusUpdate, Attachment } from './types';
import { DataService } from './services/storage';
import AuthScreen from './components/AuthScreen';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import FriendDashboard from './components/FriendDashboard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const isInitialLoad = useRef(true);

  // Initial Load from Cloud/Local
  useEffect(() => {
    const init = async () => {
      const data = await DataService.loadState();
      setState(data);
      setIsSyncing(false);
      // Wait a bit before allowing auto-saves to prevent overwriting cloud with empty local
      setTimeout(() => { isInitialLoad.current = false; }, 500);
    };
    init();
  }, []);

  // Persistent Cloud Auto-save
  useEffect(() => {
    if (state && !isInitialLoad.current) {
      DataService.saveState(state);
    }
  }, [state]);

  const handleLogin = (user: User) => {
    setState(prev => prev ? ({ ...prev, currentUser: user }) : null);
  };

  const handleSignup = (user: User) => {
    setState(prev => prev ? ({ 
      ...prev, 
      users: [...prev.users, user],
      currentUser: user 
    }) : null);
  };

  const handleLogout = () => {
    setState(prev => prev ? ({ ...prev, currentUser: null }) : null);
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

  const handleAddGroup = useCallback((name: string, description: string, memberIds: string[]) => {
    setState(prev => {
      if (!prev) return null;
      const newGroup: Group = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        description,
        memberIds,
        posts: []
      };
      return {
        ...prev,
        groups: [...prev.groups, newGroup]
      };
    });
  }, []);

  const handlePostToGroup = useCallback((groupId: string, content: string, attachment?: Attachment) => {
    setState(prev => {
      if (!prev || !prev.currentUser) return prev;
      const groups = prev.groups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            posts: [...g.posts, {
              id: Math.random().toString(36).substr(2, 9),
              content,
              attachment,
              authorId: prev.currentUser!.id,
              timestamp: new Date().toISOString()
            }]
          };
        }
        return g;
      });
      return { ...prev, groups };
    });
  }, []);

  const handleUpdateGroupMembers = useCallback((groupId: string, memberIds: string[]) => {
    setState(prev => prev ? ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, memberIds } : g)
    }) : null);
  }, []);

  const handleUploadStatus = useCallback((content?: string, attachment?: Attachment) => {
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
      return {
        ...prev,
        statuses: [...prev.statuses, newStatus]
      };
    });
  }, []);

  if (isSyncing || !state) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl animate-bounce shadow-2xl shadow-indigo-200 mb-8">
          <i className="fas fa-sync-alt animate-spin"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-800">B-Progress</h2>
        <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest font-bold">Synchronizing Global Learning Data...</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return <AuthScreen users={state.users} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const isAdmin = state.currentUser.role === Role.ADMIN;

  return (
    <Layout user={state.currentUser} onLogout={handleLogout}>
      {isAdmin ? (
        <AdminDashboard 
          state={state} 
          onSendMessage={handleSendMessage}
          onAddGroup={handleAddGroup}
          onPostToGroup={handlePostToGroup}
          onUpdateGroupMembers={handleUpdateGroupMembers}
        />
      ) : (
        <FriendDashboard 
          user={state.currentUser} 
          state={state} 
          onUpdateRecord={handleUpdateRecord} 
          onSendMessage={(content, attachment) => handleSendMessage('admin-1', content, attachment)}
          onUploadStatus={handleUploadStatus}
        />
      )}
    </Layout>
  );
};

export default App;
