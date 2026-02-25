
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay/Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: window.innerWidth < 768 ? '280px' : (isOpen ? 256 : 80),
          translateX: (window.innerWidth < 768 && !isOpen) ? '-100%' : '0%'
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8,
          restDelta: 0.5
        }}
        style={{ willChange: 'transform, width' }}
        className="fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl md:shadow-sm z-[70] flex-col flex pt-safe pb-safe overflow-hidden"
      >
        {/* Logo Area */}
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            {isOpen ? (
              <motion.img
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg glow-indigo"
              >
                F
              </motion.div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:block p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors shrink-0"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-600 transition-colors shrink-0"
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
                className={`w-full flex items-center p-3 sm:p-3.5 rounded-xl transition-colors relative group overflow-hidden ${isActive
                  ? 'bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 shadow-[inset_4px_0_0_0_#6366f1]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <div className={`flex items-center relative z-10 ${isOpen ? 'ml-1 sm:ml-2' : 'mx-auto'}`}>
                  {React.cloneElement(item.icon as any, {
                    size: 20,
                    className: `transition-transform duration-300 ${isActive ? 'scale-110 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'opacity-80 group-hover:opacity-100 group-hover:scale-110'}`
                  })}

                  <AnimatePresence mode="wait">
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`ml-3 text-sm font-bold tracking-tight flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'text-sky-900 dark:text-sky-100' : ''}`}
                      >
                        {item.label}
                        {(item as any).badge && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white uppercase tracking-[0.1em] leading-none shadow-sm shadow-sky-500/20 animate-pulse-slow">
                            {(item as any).badge}
                          </span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 sm:space-y-2 shrink-0">
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center p-3 sm:p-3.5 rounded-xl transition-colors relative group overflow-hidden ${currentView === 'settings'
              ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-[inset_4px_0_0_0_#0284c7]'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className={`flex items-center relative z-10 ${isOpen ? 'ml-1 sm:ml-2' : 'mx-auto'}`}>
              <SettingsIcon size={20} className={currentView === 'settings' ? 'text-sky-600 dark:text-sky-400 icon-filled' : 'opacity-70 hover:opacity-100'} />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`ml-3 text-sm font-bold tracking-tight whitespace-nowrap ${currentView === 'settings' ? 'text-sky-900 dark:text-sky-100' : ''}`}
                  >
                    Configurações
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 sm:p-3.5 rounded-xl transition-colors relative group overflow-hidden text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <div className={`flex items-center relative z-10 ${isOpen ? 'ml-1 sm:ml-2' : 'mx-auto'}`}>
              <LogOut size={20} />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 text-sm font-bold tracking-tight whitespace-nowrap"
                  >
                    Sair
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
