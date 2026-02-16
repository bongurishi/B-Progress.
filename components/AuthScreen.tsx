
import React, { useState } from 'react';
import { Role, User } from '../types';
import { DataService } from '../services/storage';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Real Supabase Login
        const user = await DataService.signIn(email, password);
        // App.tsx handles the session listener
      } else {
        if (!email || !password || !name) {
          setError('All fields are required');
          return;
        }
        // Real Supabase Signup with Metadata
        await DataService.signUp(email, password, { 
          name, 
          role: selectedRole || Role.FRIEND 
        });
        setError('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-100 mb-6">
              <i className="fas fa-lock text-3xl"></i>
            </div>
            <h1 className="text-5xl font-black text-slate-800 tracking-tight mb-4">B-Progress</h1>
            <p className="text-slate-500 text-lg uppercase tracking-widest font-black text-xs">Secure Cloud Accountability</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => setSelectedRole(Role.ADMIN)}
              className="group bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all text-left"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
                <i className="fas fa-user-shield"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Supporter</h2>
              <p className="text-slate-500 leading-relaxed text-sm">Access global progress logs and manage your cohort.</p>
            </button>

            <button 
              onClick={() => setSelectedRole(Role.FRIEND)}
              className="group bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all text-left"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
                <i className="fas fa-user-friends"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Friend</h2>
              <p className="text-slate-500 leading-relaxed text-sm">Track your personal daily tasks and reflection journals.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button 
          onClick={() => setSelectedRole(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-8"
        >
          <i className="fas fa-arrow-left"></i> Change Role
        </button>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-sm text-slate-400 mt-1 uppercase font-black text-[10px] tracking-widest">{selectedRole} Access Only</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Log In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Display Name</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your Name"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password</label>
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-lg">{error}</p>}

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              {loading && <i className="fas fa-spinner animate-spin"></i>}
              {isLogin ? 'Verify Identity' : 'Register Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
