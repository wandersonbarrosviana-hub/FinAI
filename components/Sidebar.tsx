
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
                    text.className = "text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200";
                    text.innerHTML = 'FinAI<span class="text-sky-500">.</span>';
                    parent.appendChild(text);
                  }
                }}
              />
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 md:w-10 md:h-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-sm md:text-base shrink-0 shadow-sm"
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
                className={`w-full flex items-center p-3 sm:p-3.5 rounded-xl transition-all duration-200 relative group overflow-hidden ${isActive
                  ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-semibold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <div className={`flex items-center relative z-10 ${isOpen ? 'ml-1 sm:ml-2' : 'mx-auto'}`}>
                  {React.cloneElement(item.icon as any, {
                    size: 20,
                    className: `transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : 'opacity-80 group-hover:opacity-100 group-hover:scale-110'}`
                  })}

                  <AnimatePresence mode="wait">
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`ml-3 text-sm font-medium tracking-tight flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'text-sky-700 dark:text-sky-300 font-semibold' : ''}`}
                      >
                        {item.label}
                        {(item as any).badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 uppercase tracking-wider leading-none shadow-sm ml-auto">
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
                    className={`ml-3 text-sm font-medium tracking-tight whitespace-nowrap ${currentView === 'settings' ? 'text-sky-700 dark:text-sky-300 font-semibold' : ''}`}
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
                    className="ml-3 text-sm font-medium tracking-tight whitespace-nowrap"
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
