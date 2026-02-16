
import React, { useState } from 'react';
import { User, Role } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
  users: User[];
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignup, users }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        if (user.role !== selectedRole) {
          setError(`This account is not registered as a ${selectedRole?.toLowerCase()}.`);
          return;
        }
        onLogin(user);
      } else {
        setError('Invalid username or password');
      }
    } else {
      if (!username || !password || !name) {
        setError('All fields are required');
        return;
      }
      if (users.find(u => u.username === username)) {
        setError('Username already taken');
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        username,
        password,
        role: Role.FRIEND,
        joinedAt: new Date().toISOString(),
      };
      onSignup(newUser);
    }
  };

  const resetSelection = () => {
    setSelectedRole(null);
    setIsLogin(true);
    setError('');
    setUsername('');
    setPassword('');
    setName('');
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-100 mb-6">
              <i className="fas fa-seedling text-3xl"></i>
            </div>
            <h1 className="text-5xl font-black text-slate-800 tracking-tight mb-4">B-Progress</h1>
            <p className="text-slate-500 text-lg">Private Growth & Accountability Platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Supporter Option */}
            <button 
              onClick={() => setSelectedRole(Role.ADMIN)}
              className="group bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all text-left flex flex-col items-center md:items-start"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-shield"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">I am a Supporter</h2>
              <p className="text-slate-500 leading-relaxed">
                Log in as the primary coach to monitor progress, provide guidance, and motivate your friends.
              </p>
              <div className="mt-8 text-indigo-600 font-bold flex items-center gap-2">
                Continue to Login <i className="fas fa-arrow-right text-xs"></i>
              </div>
            </button>

            {/* Friend Option */}
            <button 
              onClick={() => setSelectedRole(Role.FRIEND)}
              className="group bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all text-left flex flex-col items-center md:items-start"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-user-friends"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">I am a Friend</h2>
              <p className="text-slate-500 leading-relaxed">
                Log in or sign up to track your learning journey, log journals, and get human accountability.
              </p>
              <div className="mt-8 text-emerald-600 font-bold flex items-center gap-2">
                Get Started <i className="fas fa-arrow-right text-xs"></i>
              </div>
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
          onClick={resetSelection}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-8 transition-colors"
        >
          <i className="fas fa-arrow-left text-xs"></i> Back to Role Selection
        </button>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-800">
              {selectedRole === Role.ADMIN ? 'Supporter Login' : (isLogin ? 'Friend Login' : 'Create Friend Account')}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {selectedRole === Role.ADMIN ? 'Access the command center' : 'Track your growth and consistency'}
            </p>
          </div>

          {selectedRole === Role.FRIEND && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Log In
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && selectedRole === Role.FRIEND && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 outline-none ${selectedRole === Role.ADMIN ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 outline-none ${selectedRole === Role.ADMIN ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

            <button 
              type="submit"
              className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all ${
                selectedRole === Role.ADMIN 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
              }`}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {selectedRole === Role.ADMIN && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Supporter notice</p>
              <p className="text-xs text-slate-500 mt-2 italic">Only fixed supporter accounts can access this portal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
