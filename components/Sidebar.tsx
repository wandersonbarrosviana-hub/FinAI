
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

  const handleNavClick = (view: ViewState) => {
    onViewChange(view);
    // On mobile, automatically close the sidebar after selection
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
    // This check is no longer needed as the sidebar will be hidden on mobile when not open
    // if (window.innerWidth < 768) {
    //   setIsOpen(false);
    // }
  };

  return (
    <>
      {/* Mobile Overlay/Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (Responsive: Fixed on Desktop, Overlay on Mobile) */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl md:shadow-sm transition-all duration-300 z-[70] flex-col flex pt-safe pb-safe ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'
          }`}
      >
        {/* Logo Area */}
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <img
                src="/logo.png?v=2"
                alt="FinAI"
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('h1')) {
                    const text = document.createElement('h1');
                    text.className = "text-xl sm:text-2xl font-black tracking-tighter bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent";
                    text.innerHTML = 'FinAI<span class="text-sky-500">.</span>';
                    parent.appendChild(text);
                  }
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white font-black text-xs">F</div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:block p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 sm:py-6 px-3 scrollbar-hide space-y-1 sm:space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center p-3 sm:p-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                  ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-[inset_4px_0_0_0_#0284c7]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <div className={`flex items-center relative z-10 ${isOpen ? 'ml-1 sm:ml-2' : 'mx-auto md:mx-auto'}`}>
                  {React.cloneElement(item.icon as any, {
                    size: 20,
                    className: isActive ? 'text-sky-600 dark:text-sky-400' : 'transition-colors'
                  })}
                  <span className={`ml-3 text-sm font-bold tracking-tight flex items-center gap-1.5 whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 md:hidden pointer-events-none'
                    } ${isActive ? 'text-sky-900 dark:text-sky-100' : ''}`}>
                    {item.label}
                    {(item as any).badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 uppercase tracking-wide leading-none">
                        {(item as any).badge}
                      </span>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 sm:space-y-2">
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center p-3 sm:p-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden ${currentView === 'settings'
              ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-[inset_4px_0_0_0_#0284c7]'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className={`flex items-center relative z-10 ${isOpen ? 'ml-1 sm:ml-2' : 'mx-auto md:mx-auto'}`}>
              <SettingsIcon size={20} className={currentView === 'settings' ? 'text-sky-600 dark:text-sky-400' : ''} />
              <span className={`ml-3 text-sm font-bold tracking-tight transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 md:hidden pointer-events-none'
                } ${currentView === 'settings' ? 'text-sky-900 dark:text-sky-100' : ''}`}>
                Configurações
              </span>
            </div>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 sm:p-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <div className={`flex items-center relative z-10 ${isOpen ? 'ml-1 sm:ml-2' : 'mx-auto md:mx-auto'}`}>
              <LogOut size={20} />
              <span className={`ml-3 text-sm font-bold tracking-tight transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 md:hidden pointer-events-none'
                }`}>
                Sair
              </span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
