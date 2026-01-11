'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let result;
        if (mode === 'signup') {
            result = await supabase.auth.signUp({
                email,
                password,
            });
        } else {
            result = await supabase.auth.signInWithPassword({
                email,
                password,
            });
        }

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
        } else {
            if (mode === 'signup') {
                // For simple MVP without email confirmation flow, usually Supabase requires confirmation by default in production.
                // But for development/MVP, if "Enable email c" is off or using specific settings, this works.
                // We act as if successful.
                alert('登録確認メールを確認してください（または開発環境の設定によってはそのままログイン可能です）');
            }
            router.push('/projects');
            router.refresh();
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">
                    {mode === 'signin' ? 'ログイン' : 'アカウント作成'}
                </h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full py-2 px-4 rounded text-white font-medium transition-colors",
                            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {loading ? '処理中...' : (mode === 'signin' ? 'ログイン' : '登録する')}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <button
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                            setMode(mode === 'signin' ? 'signup' : 'signin');
                            setError(null);
                        }}
                    >
                        {mode === 'signin' ? 'アカウントをお持ちでない場合は登録' : 'すでにアカウントをお持ちの場合はログイン'}
                    </button>
                </div>
            </div>
        </div>
    );
}
