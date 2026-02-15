
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
                  {React.cloneElement(item.icon as any, {
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

        {/* Settings & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => onViewChange('settings')}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${currentView === 'settings'
              ? 'bg-sky-50 text-sky-600 shadow-[inset_4px_0_0_0_#0284c7]'
              : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <div className={`flex items-center relative z-10 ${isOpen ? 'ml-2' : 'mx-auto'}`}>
              <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                {/* We need to import Settings from lucide-react if not present, but for now assuming it is or using raw SVG/Icon */}
                {/* Actually I should check imports first. imports are at top. */}
                {/* Re-using a similar structure to NAV_ITEMS */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-settings ${currentView === 'settings' ? 'text-sky-600' : ''}`}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l-.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
              </div>
              {isOpen && (
                <span className={`ml-3 text-sm font-bold tracking-tight ${currentView === 'settings' ? 'text-sky-900' : ''}`}>
                  Configurações
                </span>
              )}
            </div>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 rounded-xl transition-all duration-300 relative group overflow-hidden text-rose-400 hover:text-rose-600 hover:bg-rose-50"
          >
            <div className={`flex items-center relative z-10 ${isOpen ? 'ml-2' : 'mx-auto'}`}>
              <LogOut size={20} />
              {isOpen && (
                <span className="ml-3 text-sm font-bold tracking-tight">
                  Sair
                </span>
              )}
            </div>
          </button>
        </div>
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
                  {React.cloneElement(item.icon as any, { size: 22 })}
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
