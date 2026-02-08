
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
    <aside 
      className={`fixed top-0 left-0 h-full bg-white border-r border-sky-100 transition-all duration-300 z-50 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-sky-50">
        {isOpen && <h1 className="text-xl font-bold text-sky-600">FinAI</h1>}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-sky-50 rounded-lg text-sky-600 ml-auto"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center p-3 my-1 transition-colors relative group ${
              currentView === item.id 
                ? 'bg-sky-50 text-sky-600 font-semibold border-r-4 border-sky-600' 
                : 'text-slate-500 hover:bg-sky-50/50 hover:text-sky-500'
            }`}
          >
            <div className={`flex items-center ${isOpen ? 'ml-2' : 'mx-auto'}`}>
              {item.icon}
              {isOpen && <span className="ml-3 text-sm">{item.label}</span>}
            </div>
            {!isOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sky-50">
        <button 
          onClick={onLogout}
          className={`w-full flex items-center p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors ${!isOpen && 'justify-center'}`}
        >
          <LogOut size={20} />
          {isOpen && <span className="ml-3 font-medium text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
