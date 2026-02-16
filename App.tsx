
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Role, User, ProgressRecord, Message, Group, StatusUpdate, Attachment } from './types';
import { getStoredData, saveData, clearSession } from './services/storage';
import AuthScreen from './components/AuthScreen';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import FriendDashboard from './components/FriendDashboard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(getStoredData());

  useEffect(() => {
    saveData(state);
  }, [state]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const handleSignup = (user: User) => {
    setState(prev => ({ 
      ...prev, 
      users: [...prev.users, user],
      currentUser: user 
    }));
  };

  const handleLogout = () => {
    clearSession();
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const handleUpdateRecord = useCallback((recordUpdate: Partial<ProgressRecord>) => {
    setState(prev => {
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
    if (!state.currentUser || (!content.trim() && !attachment)) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: state.currentUser.id,
      receiverId,
      content,
      attachment,
      timestamp: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, [state.currentUser]);

  const handleAddGroup = useCallback((name: string, description: string, memberIds: string[]) => {
    const newGroup: Group = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      memberIds,
      posts: []
    };
    setState(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup]
    }));
  }, []);

  const handlePostToGroup = useCallback((groupId: string, content: string, attachment?: Attachment) => {
    if (!state.currentUser) return;
    setState(prev => {
      const groups = prev.groups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            posts: [...g.posts, {
              id: Math.random().toString(36).substr(2, 9),
              content,
              attachment,
              authorId: state.currentUser!.id,
              timestamp: new Date().toISOString()
            }]
          };
        }
        return g;
      });
      return { ...prev, groups };
    });
  }, [state.currentUser]);

  const handleUpdateGroupMembers = useCallback((groupId: string, memberIds: string[]) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, memberIds } : g)
    }));
  }, []);

  const handleUploadStatus = useCallback((content?: string, attachment?: Attachment) => {
    if (!state.currentUser) return;
    const newStatus: StatusUpdate = {
      id: Math.random().toString(36).substr(2, 9),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      content,
      attachment,
      timestamp: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      statuses: [...prev.statuses, newStatus]
    }));
  }, [state.currentUser]);

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
