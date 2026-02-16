
import React from 'react';
import { User, Role } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const isCloud = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <i className="fas fa-chart-line"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">B-Progress</h1>
            
            <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${isCloud ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
              <i className={`fas ${isCloud ? 'fa-cloud' : 'fa-home'} text-[10px]`}></i>
              <span className="text-[9px] font-black uppercase tracking-widest">{isCloud ? 'Cloud Synced' : 'Local Mode'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              <span className="text-xs text-slate-500 uppercase font-medium">{user.role}</span>
            </div>
            <button 
              onClick={onLogout}
              className="bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all p-2 rounded-xl w-10 h-10 flex items-center justify-center border border-slate-100"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 bg-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-slate-100 py-4 px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2024 B-Progress Platform</p>
          <div className="flex items-center gap-2">
            {!isCloud && (
              <span className="text-[9px] font-medium text-slate-400 mr-4 italic">Tip: Connect Supabase for cross-device sync.</span>
            )}
            <div className="flex items-center gap-2 text-indigo-500">
              <i className="fas fa-shield-check text-xs"></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">Secure Data Encryption</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
