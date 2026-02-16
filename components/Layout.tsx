
import React from 'react';
import { User, Role } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <i className="fas fa-chart-line"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">B-Progress</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              <span className="text-xs text-slate-500 uppercase font-medium">{user.role}</span>
            </div>
            <button 
              onClick={onLogout}
              className="text-slate-500 hover:text-red-600 transition-colors p-2"
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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2024 B-Progress Platform</p>
          <div className="flex items-center gap-2 text-emerald-500">
            <i className="fas fa-cloud-check text-xs"></i>
            <span className="text-[9px] font-black uppercase tracking-tighter">History Auto-Synced Locally</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
