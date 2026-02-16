
import React, { useState } from 'react';
import { Maximize2, X, Minimize2 } from 'lucide-react';

interface ChartContainerProps {
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, className = '', headerAction }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    // If full screen, render a modal overlay
    if (isFullScreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        {title}
                    </div>
                    <button
                        onClick={toggleFullScreen}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
                    >
                        <Minimize2 size={24} />
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-hidden relative">
                    {/* Force children to take full height/width in fullscreen */}
                    <div className="w-full h-full">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 relative flex flex-col shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base tracking-tight">
                    {title}
                </h3>
                <div className="flex items-center gap-3">
                    {headerAction}
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                        title="Expandir"
                    >
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Container for chart content - ensure flex growth if needed */}
            <div className="flex-1 w-full min-h-[250px] relative">
                {children}
            </div>
        </div>
    );
};

export default ChartContainer;
