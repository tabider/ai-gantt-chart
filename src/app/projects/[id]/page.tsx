'use client';

export const runtime = 'edge';

import { useEffect, useState, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Project, Task } from '@/types';
import { TaskList } from '@/components/tasks/TaskList';
import { GanttChart } from '@/components/gantt/GanttChart';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShareModal } from '@/components/ui/ShareModal';
import { Lock, Share2 } from 'lucide-react';

import { ModeToggle } from '@/components/theme-toggle';

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const projectId = use(params).id;
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Fetch Project
            const { data: projData, error: projError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (projError) {
                console.error('Project fetch error', projError);
                if (!user) {
                    router.push('/login');
                    return;
                }
                throw projError;
            }

            setProject(projData);

            // Fetch Tasks
            const { data: taskData, error: taskError } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId)
                .order('start_date', { ascending: true });

            if (taskError) throw taskError;
            setTasks(taskData || []);

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isOwner = currentUser && project && currentUser.id === project.user_id;

    const handleCreateOrUpdateTask = async (taskData: Partial<Task>) => {
        if (!isOwner) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            if (taskData.id) {
                // Update
                const { error } = await supabase
                    .from('tasks')
                    .update({
                        title: taskData.title,
                        start_date: taskData.start_date,
                        end_date: taskData.end_date,
                        status: taskData.status,
                        priority: taskData.priority,
                        color: taskData.color,
                        parent_id: taskData.parent_id
                    })
                    .eq('id', taskData.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('tasks')
                    .insert([{
                        project_id: projectId,
                        title: taskData.title,
                        start_date: taskData.start_date,
                        end_date: taskData.end_date,
                        status: taskData.status || 'todo',
                        priority: taskData.priority || 2,
                        color: taskData.color || 'blue',
                        parent_id: taskData.parent_id
                    }]);

                if (error) throw error;
            }

            fetchData();
        } catch (e: unknown) {
            console.error(e);
            let msg = 'Unknown error';
            if (e instanceof Error) msg = e.message;
            if (typeof e === 'string') msg = e;
            alert(`エラーが発生しました: ${msg}`);
        }
    };

    if (loading) return <div className="flex items-center justify-center p-8 h-screen bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-medium">読み込み中...</div>;
    if (!project) return <div className="flex items-center justify-center p-8 h-screen bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400">プロジェクトが見つかりません。</div>;

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100 transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center shrink-0 h-16 z-30 relative transition-colors">
                <div className="flex items-center gap-4">
                    <Link href="/projects" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm flex items-center gap-1 transition-colors">
                        ← <span className="hidden sm:inline">一覧へ</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
                        {!isOwner && (
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                                <Lock size={10} /> 閲覧のみ
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ModeToggle />

                    {/* Share Button (Owner Only) */}
                    {isOwner && (
                        <button
                            onClick={() => setShareModalOpen(true)}
                            className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                            title="共有設定"
                        >
                            <Share2 size={20} />
                        </button>
                    )}

                    {/* Add Task Button (Owner Only) */}
                    {isOwner && (
                        <button
                            onClick={() => {
                                setEditingTask(null);
                                setModalOpen(true);
                            }}
                            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-sm font-medium shadow-md shadow-gray-200 dark:shadow-none transition-all active:scale-95"
                        >
                            + タスク追加
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content: Split View */}
            <div className="flex-1 flex overflow-hidden p-4 gap-4">
                {/* Left: Task List (35%) */}
                <div className="w-[35%] min-w-[300px] flex flex-col transition-all duration-300">
                    <TaskList
                        tasks={tasks}
                        onEdit={(task) => {
                            if (isOwner) {
                                setEditingTask(task);
                                setModalOpen(true);
                            }
                        }}
                    />
                </div>

                {/* Right: Gantt Chart (65%) */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <GanttChart tasks={tasks} />
                </div>
            </div>

            {/* Modals */}
            <TaskFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleCreateOrUpdateTask}
                onDelete={async (id) => {
                    const { error } = await supabase.from('tasks').delete().eq('id', id);
                    if (error) throw error;
                    fetchData();
                }}
                initialData={editingTask}
                projectId={project.id}
                allTasks={tasks}
            />

            {project && (
                <ShareModal
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    project={project}
                    onUpdate={(newVal) => setProject({ ...project, is_public: newVal })}
                />
            )}
        </div>
    );
}
