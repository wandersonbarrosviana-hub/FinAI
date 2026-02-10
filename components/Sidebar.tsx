
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { ViewState } from '../types';
import { Menu, X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, setIsOpen, onLogout }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-full bg-slate-950 border-r border-slate-800 shadow-xl shadow-black/20 transition-all duration-300 z-50 flex-col ${isOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo Area */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
          {isOpen && (
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              FinAI<span className="text-cyan-400">.</span>
            </h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors ml-auto"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 shadow-[inset_4px_0_0_0_#22d3ee]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
              >
                {/* Active Glow Background Effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-cyan-400/5 blur-xl rounded-xl"></div>
                )}

                <div className={`flex items-center relative z-10 ${isOpen ? 'ml-2' : 'mx-auto'}`}>
                  {React.cloneElement(item.icon as React.ReactElement, {
                    size: 20,
                    className: isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'transition-colors'
                  })}
                  {isOpen && (
                    <span className={`ml-3 text-sm font-semibold tracking-wide ${isActive ? 'text-cyan-100' : ''}`}>
                      {item.label}
                    </span>
                  )}
                </div>

                {/* Tooltip for collapsed mode */}
                {!isOpen && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-cyan-400 text-xs font-bold rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800/50 mx-3 mb-2">
          <button
            onClick={onLogout}
            className={`w-full flex items-center p-3 text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 group ${!isOpen && 'justify-center'}`}
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            {isOpen && <span className="ml-3 font-semibold text-sm">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Glassmorphism) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 flex items-center overflow-x-auto pb-safe">
        <div className="flex items-center px-4 py-2 space-x-6 min-w-full">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl transition-all ${isActive
                  ? 'text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-cyan-500/10' : ''}`}>
                  {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                </div>
                {/* <span className="text-[10px] font-medium mt-1">{item.label}</span> */}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
