import React from 'react';
import { Tags } from 'lucide-react';

const CategoryManager: React.FC = () => {
    return (
        <div className="p-4 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Tags size={32} className="text-sky-600" />
                <h2 className="text-2xl font-bold text-slate-800">Gerenciamento de Categorias</h2>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-400">
                <p>CRUD de Categorias em desenvolvimento.</p>
            </div>
        </div>
    );
};

export default CategoryManager;
