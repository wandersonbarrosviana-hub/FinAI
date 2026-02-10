
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
            <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
                    <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        {title}
                    </div>
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition-colors"
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
        <div className={`bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative flex flex-col ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm sm:text-base">
                    {title}
                </h3>
                <div className="flex items-center gap-2">
                    {headerAction}
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all"
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
