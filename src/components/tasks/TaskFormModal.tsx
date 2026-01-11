'use client';

import { Task, TaskStatus, TaskColor } from '@/types';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Trash2, Calendar, Check, ChevronDown } from 'lucide-react';

type TaskFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Partial<Task>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: Task | null;
    projectId: string;
    allTasks?: Task[]; // To select parent
};

const COLORS: { value: TaskColor; label: string; bg: string }[] = [
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500' },
    { value: 'red', label: 'Red', bg: 'bg-red-500' },
    { value: 'green', label: 'Green', bg: 'bg-emerald-500' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-amber-400' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500' },
    { value: 'gray', label: 'Gray', bg: 'bg-slate-500' },
];

export function TaskFormModal({ isOpen, onClose, onSubmit, onDelete, initialData, projectId, allTasks = [] }: TaskFormModalProps) {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [color, setColor] = useState<TaskColor>('blue');
    const [parentId, setParentId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setStartDate(initialData.start_date);
            setEndDate(initialData.end_date);
            setStatus(initialData.status);
            setColor(initialData.color || 'blue');
            setParentId(initialData.parent_id || null);
        } else {
            setTitle('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
            setStatus('todo');
            setColor('blue');
            setParentId(null);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    // Filter potential parents: Cannot be itself, and for now 1 level deep only so cannot select a child (simplified)
    // Or just simple: cannot be itself.
    const potentialParents = allTasks.filter(t => t.id !== initialData?.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                id: initialData?.id,
                project_id: projectId,
                title,
                start_date: startDate,
                end_date: endDate,
                status,
                color,
                parent_id: parentId === '' ? null : parentId,
                priority: 2,
            });
            onClose();
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !onDelete) return;
        if (!confirm('削除してよろしいですか？')) return;

        setLoading(true);
        try {
            await onDelete(initialData.id);
            onClose();
        } catch (e) {
            console.error(e);
            alert('削除に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {initialData ? 'タスク編集' : '新しいタスク'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">タスク名</label>
                            <input
                                type="text"
                                required
                                className="w-full text-lg border-b-2 border-gray-200 focus:border-blue-500 outline-none px-1 py-2 bg-transparent transition-colors placeholder-gray-300 font-medium"
                                placeholder="タスク名を入力..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">開始日</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm font-medium"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">終了日</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm font-medium"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parent Task & Status */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">親タスク (Optional)</label>
                                <div className="relative">
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm appearance-none"
                                        value={parentId || ''}
                                        onChange={(e) => setParentId(e.target.value || null)}
                                    >
                                        <option value="">（なし）</option>
                                        {potentialParents.map(t => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ステータス</label>
                                <div className="relative">
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm appearance-none"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                    >
                                        <option value="todo">TODO</option>
                                        <option value="doing">進行中</option>
                                        <option value="done">完了</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">カラーラベル</label>
                            <div className="flex flex-wrap gap-3">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all flex items-center justify-center ring-offset-2",
                                            c.bg,
                                            color === c.value ? "ring-2 ring-gray-400 scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"
                                        )}
                                        title={c.label}
                                    >
                                        {color === c.value && <Check size={14} className="text-white drop-shadow-sm" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-6">
                            <div>
                                {initialData && onDelete && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm transition-colors"
                                    >
                                        <Trash2 size={16} /> 削除
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium shadow-lg shadow-gray-200 transition-all active:scale-95"
                                >
                                    {loading ? '保存中...' : '保存済み'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
