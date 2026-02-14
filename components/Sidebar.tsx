
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
        className={`hidden md:flex fixed top-0 left-0 h-full bg-white border-r border-slate-200 shadow-sm transition-all duration-300 z-50 flex-col ${isOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo Area */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          {isOpen && (
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              FinAI<span className="text-sky-500">.</span>
            </h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-sky-600 transition-colors ml-auto"
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
                  ? 'bg-sky-50 text-sky-600 shadow-[inset_4px_0_0_0_#0284c7]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <div className={`flex items-center relative z-10 ${isOpen ? 'ml-2' : 'mx-auto'}`}>
                  {React.cloneElement(item.icon as React.ReactElement, {
                    size: 20,
                    className: isActive ? 'text-sky-600' : 'transition-colors'
                  })}
                  {isOpen && (
                    <span className={`ml-3 text-sm font-bold tracking-tight ${isActive ? 'text-sky-900' : ''}`}>
                      {item.label}
                    </span>
                  )}
                </div>

                {/* Tooltip for collapsed mode */}
                {!isOpen && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-white text-sky-600 text-xs font-bold rounded-lg border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation (Clean White) */}
      {/* Mobile Bottom Navigation (Scrollable & Full Width) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
        <div className="flex items-center overflow-x-auto pb-safe no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center p-3 min-w-[4.5rem] transition-all whitespace-nowrap ${isActive
                  ? 'text-sky-600'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <div className={`p-1.5 rounded-xl mb-1 ${isActive ? 'bg-sky-50' : ''}`}>
                  {React.cloneElement(item.icon as React.ReactElement, { size: 22 })}
                </div>
                <span className="text-[10px] font-bold tracking-tight">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
