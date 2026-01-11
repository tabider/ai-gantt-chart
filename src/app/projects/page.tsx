'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    const fetchProjects = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('projects')
                .insert([{
                    name: newProjectName,
                    user_id: user.id
                }])
                .select()
                .single();

            if (error) throw error;

            setProjects([data, ...projects]);
            setNewProjectName('');
        } catch (error) {
            console.error('Error creating project:', error);
            alert('プロジェクト作成に失敗しました');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return <div className="p-8 text-center">読み込み中...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">プロジェクト一覧</h1>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}
                        className="text-sm text-gray-500 hover:text-red-500"
                    >
                        ログアウト
                    </button>
                </header>

                {/* Create Project Form */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                    <form onSubmit={createProject} className="flex gap-4">
                        <input
                            type="text"
                            placeholder="新しいプロジェクト名"
                            className="flex-1 border border-gray-300 rounded px-3 py-2"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            disabled={isCreating}
                        />
                        <button
                            type="submit"
                            disabled={isCreating || !newProjectName.trim()}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            作成
                        </button>
                    </form>
                </div>

                {/* Project List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                        >
                            <h2 className="text-xl font-bold mb-2 text-gray-800">{project.name}</h2>
                            <div className="text-xs text-gray-500">
                                作成日: {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        </Link>
                    ))}

                    {projects.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            プロジェクトがありません。新しいプロジェクトを作成してください。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
