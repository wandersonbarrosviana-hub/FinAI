
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { ViewState } from '../types';
import { Menu, X, LogOut, ChevronLeft, ChevronRight, Settings as SettingsIcon } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, setIsOpen, onLogout, userRole }) => {
  const filteredNavItems = NAV_ITEMS.filter(item =>
    item.id !== 'admin' || userRole === 'admin'
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 z-50 flex-col ${isOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo Area */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          {isOpen && (
            <img
              src="/logo.png?v=2"
              alt="FinAI"
              className="h-32 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                // Fallback to text if image fails
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const text = document.createElement('h1');
                  text.className = "text-2xl font-black tracking-tighter bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent";
                  text.innerHTML = 'FinAI<span class="text-sky-500">.</span>';
                  parent.appendChild(text);
                }
              }}
            />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors ml-auto"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                  ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-[inset_4px_0_0_0_#0284c7]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <div className={`flex items-center relative z-10 ${isOpen ? 'ml-2' : 'mx-auto'}`}>
                  {React.cloneElement(item.icon as any, {
                    size: 20,
                    className: isActive ? 'text-sky-600 dark:text-sky-400' : 'transition-colors'
                  })}
                  {isOpen && (
                    <span className={`ml-3 text-sm font-bold tracking-tight flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'text-sky-900 dark:text-sky-100' : ''}`}>
                      {item.label}
                      {(item as any).badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 uppercase tracking-wide leading-none">
                          {(item as any).badge}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Tooltip for collapsed mode */}
                {!isOpen && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => onViewChange('settings')}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${currentView === 'settings'
              ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-[inset_4px_0_0_0_#0284c7]'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className={`flex items-center relative z-10 ${isOpen ? 'ml-2' : 'mx-auto'}`}>
              <div className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                <SettingsIcon size={20} className={currentView === 'settings' ? 'text-sky-600 dark:text-sky-400' : ''} />
              </div>
              {isOpen && (
                <span className={`ml-3 text-sm font-bold tracking-tight ${currentView === 'settings' ? 'text-sky-900 dark:text-sky-100' : ''}`}>
                  Configurações
                </span>
              )}
            </div>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 rounded-xl transition-all duration-300 relative group overflow-hidden text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center overflow-x-auto pb-safe no-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center p-3 min-w-[4.5rem] transition-all whitespace-nowrap ${isActive
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                <div className={`p-1.5 rounded-xl mb-1 ${isActive ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}>
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
