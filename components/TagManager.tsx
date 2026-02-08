
import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { Trash2, Plus, X, Tag as TagIcon, Edit2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface TagManagerProps {
    tags: Tag[];
    onAddTag: (tag: Partial<Tag>) => void;
    onDeleteTag: (id: string) => void;
    onUpdateTag?: (id: string, tag: Partial<Tag>) => void;
}

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
    '#d946ef', '#f43f5e', '#64748b'
];

const TagManager: React.FC<TagManagerProps> = ({ tags, onAddTag, onDeleteTag, onUpdateTag }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        if (editingId && onUpdateTag) {
            onUpdateTag(editingId, { name: newTagName, color: selectedColor });
            setEditingId(null);
        } else {
            onAddTag({ name: newTagName, color: selectedColor });
        }

        setNewTagName('');
        setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setIsAdding(false);
    };

    const startEdit = (tag: Tag) => {
        setNewTagName(tag.name);
        setSelectedColor(tag.color);
        setEditingId(tag.id);
        setIsAdding(true);
    }

    const cancelEdit = () => {
        setIsAdding(false);
        setEditingId(null);
        setNewTagName('');
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TagIcon size={20} className="text-sky-600" />
                    Gerenciar Tags
                </h3>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 text-sky-600 text-sm font-bold hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                        Nova Tag
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Tag</label>
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Ex: Viagem, Reforma, Freelance..."
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cor</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!newTagName.trim()}
                                className="px-4 py-2 bg-sky-600 text-white text-sm font-bold rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingId ? 'Atualizar Tag' : 'Salvar Tag'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tags.map(tag => (
                    <div key={tag.id} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all hover:border-sky-100">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{tag.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => startEdit(tag)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => onDeleteTag(tag.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {tags.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-8 text-slate-400 text-sm">
                        Nenhuma tag criada ainda.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TagManager;
