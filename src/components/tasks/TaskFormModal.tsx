import { Task, TaskStatus, TaskColor, Comment } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Trash2, Calendar, Check, ChevronDown, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type TaskFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Partial<Task>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: Task | null;
    projectId: string;
    allTasks?: Task[];
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
    const [progress, setProgress] = useState(0);

    // Comments State
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentUserNames, setCommentUserNames] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState(false);

    const fetchComments = useCallback(async () => {
        if (!initialData?.id) return;
        setLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('task_id', initialData.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data || []);

            // Ensure we have user names? For now simple MVP maybe just email or check auth
            // Ideally we'd join but keep it simple.
            // Let's assume we just show "User" or similar if we strictly follow schema provided (no public profiles table).
            // Actually, `auth.users` isn't readable by public usually. 
            // So we'll just show the message content and timestamp for now, maybe "You" if it matches current user.
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    }, [initialData?.id]);

    useEffect(() => {
        if (isOpen && initialData) {
            fetchComments();
        } else {
            setComments([]);
        }
    }, [isOpen, initialData, fetchComments]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setStartDate(initialData.start_date);
            setEndDate(initialData.end_date);
            setStatus(initialData.status);
            setColor(initialData.color || 'blue');
            setParentId(initialData.parent_id || null);
            setProgress(initialData.progress || 0);
        } else {
            setTitle('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
            setStatus('todo');
            setColor('blue');
            setParentId(null);
            setProgress(0);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

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
                progress,
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

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !initialData) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('comments')
                .insert([{
                    task_id: initialData.id,
                    user_id: user.id,
                    content: newComment
                }]);

            if (error) throw error;

            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('コメントの投稿に失敗しました');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {initialData ? 'タスク編集' : '新しいタスク'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">タスク名</label>
                            <input
                                type="text"
                                required
                                className="w-full text-lg border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none px-1 py-2 bg-transparent transition-colors placeholder-gray-300 font-medium text-gray-900 dark:text-gray-100"
                                placeholder="タスク名を入力..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">開始日</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all text-sm font-medium dark:text-gray-200"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">終了日</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all text-sm font-medium dark:text-gray-200"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">進捗率</label>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={progress}
                                onChange={(e) => setProgress(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        {/* Parent Task & Status */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">親タスク (Optional)</label>
                                <div className="relative">
                                    <select
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all text-sm appearance-none dark:text-gray-200"
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
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">ステータス</label>
                                <div className="relative">
                                    <select
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all text-sm appearance-none dark:text-gray-200"
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
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">カラーラベル</label>
                            <div className="flex flex-wrap gap-3">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all flex items-center justify-center ring-offset-2 dark:ring-offset-gray-900",
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

                        {/* Comments Section (Only if editing) */}
                        {initialData && (
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <MessageSquare size={14} /> コメント・メモ
                                </label>

                                <div className="space-y-4 mb-4">
                                    {comments.length === 0 ? (
                                        <div className="text-xs text-center text-gray-400 py-2">コメントはまだありません</div>
                                    ) : (
                                        comments.map(c => (
                                            <div key={c.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                                                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{c.content}</div>
                                                <div className="text-[10px] text-gray-400 mt-1 text-right">
                                                    {new Date(c.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="コメントを入力..."
                                        className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handlePostComment}
                                        disabled={!newComment.trim()}
                                        className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 sticky bottom-0 bg-white dark:bg-gray-900 pb-2">
                            <div>
                                {initialData && onDelete && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm transition-colors"
                                    >
                                        <Trash2 size={16} /> 削除
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 text-sm font-medium shadow-lg shadow-gray-200 dark:shadow-none transition-all active:scale-95"
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
