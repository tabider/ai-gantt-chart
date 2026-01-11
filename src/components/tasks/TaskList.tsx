'use client';

import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { Folder, FileText, CornerDownRight } from 'lucide-react';

type TaskListProps = {
    tasks: Task[];
    onEdit: (task: Task) => void;
};

const statusLabels: Record<TaskStatus, string> = {
    todo: 'TODO',
    doing: 'DOING',
    done: 'DONE',
};

const statusColors: Record<TaskStatus, string> = {
    todo: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    doing: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    done: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
};

export function TaskList({ tasks, onEdit }: TaskListProps) {

    // Sort tasks: Parents first, then children immediately after their parent
    const sortedTasks = useMemo(() => {
        const parents = tasks.filter(t => !t.parent_id);
        const children = tasks.filter(t => t.parent_id);

        // Sort variables
        parents.sort((a, b) => a.start_date.localeCompare(b.start_date));

        const result: { task: Task; isLastChild?: boolean }[] = [];

        parents.forEach(p => {
            result.push({ task: p });
            const myChildren = children.filter(c => c.parent_id === p.id);
            myChildren.sort((a, b) => a.start_date.localeCompare(b.start_date));

            myChildren.forEach((child) => {
                result.push({
                    task: child
                });
            });
        });

        // Append orphans if any (though UI doesn't allow creating them easily)
        const orphans = children.filter(c => !parents.find(p => p.id === c.parent_id));
        orphans.forEach(o => result.push({ task: o }));

        return result;
    }, [tasks]);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800 overflow-hidden h-full flex flex-col transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm font-semibold text-gray-700 dark:text-gray-200 text-sm flex justify-between items-center">
                <span>タスク</span>
                <span className="text-xs text-gray-400 font-normal">{tasks.length} items</span>
            </div>
            <div className="overflow-auto flex-1 scrollbar-hide">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase bg-gray-50/30 dark:bg-gray-800/30 sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th className="px-4 py-3 font-semibold tracking-wider">Title</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {sortedTasks.map(({ task }) => {
                            const isChild = !!task.parent_id;
                            const hasChildren = tasks.some(t => t.parent_id === task.id);

                            return (
                                <tr
                                    key={task.id}
                                    onClick={() => onEdit(task)}
                                    className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3 align-middle relative">
                                        <div className="flex items-center">
                                            {/* Tree Indentation */}
                                            <div className="w-6 flex-shrink-0 flex justify-center">
                                                {isChild ? (
                                                    <CornerDownRight size={14} className="text-gray-300 dark:text-gray-600 ml-2" />
                                                ) : (
                                                    <div />
                                                )}
                                            </div>

                                            {/* Icon */}
                                            <div className={cn("mr-3 p-1.5 rounded-md flex-shrink-0", isChild ? "text-gray-400 dark:text-gray-500" : "bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400")}>
                                                {isChild ? <FileText size={14} /> : <Folder size={14} fill={hasChildren ? "currentColor" : "none"} fillOpacity={0.2} />}
                                            </div>

                                            {/* Title & Meta */}
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-gray-800 dark:text-gray-200 truncate" title={task.title}>
                                                    {task.title}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", statusColors[task.status])}>
                                                        {statusLabels[task.status]}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                        {format(new Date(task.start_date), 'M/d')} - {format(new Date(task.end_date), 'M/d')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {tasks.length === 0 && (
                            <tr>
                                <td className="px-4 py-12 text-center text-gray-400">
                                    タスクがありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
