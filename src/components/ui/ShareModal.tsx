'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import { X, Copy, Check, Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShareModalProps = {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: (isPublic: boolean) => void;
};

export function ShareModal({ isOpen, onClose, project, onUpdate }: ShareModalProps) {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const publicUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/projects/${project.id}`
        : '';

    const togglePublic = async () => {
        setLoading(true);
        const newValue = !project.is_public;
        try {
            const { error } = await supabase
                .from('projects')
                .update({ is_public: newValue })
                .eq('id', project.id);

            if (error) throw error;
            onUpdate(newValue);
        } catch (e) {
            console.error(e);
            alert('設定の更新に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Globe size={20} className="text-blue-500" />
                        共有設定
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 text-sm">公開アクセス</span>
                            <span className="text-xs text-gray-400 mt-0.5">リンクを知っている全員が閲覧可能</span>
                        </div>
                        <button
                            onClick={togglePublic}
                            disabled={loading}
                            className={cn(
                                "w-12 h-7 rounded-full transition-colors relative flex items-center px-1 shadow-inner",
                                project.is_public ? "bg-blue-500" : "bg-gray-200"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                                project.is_public ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {/* URL Display */}
                    <div className={cn("transition-all duration-300 overflow-hidden", project.is_public ? "opacity-100 max-h-40" : "opacity-30 pointer-events-none max-h-40 grayscale")}>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">共有リンク</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 truncate font-mono select-all">
                                {publicUrl}
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center min-w-[44px]"
                                title="Copy"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                            ※ 閲覧モードでは編集機能は無効になります
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
