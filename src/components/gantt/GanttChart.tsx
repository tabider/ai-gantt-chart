'use client';

import { Task, TaskColor } from '@/types';
import { differenceInDays, addDays, format, parseISO, isSameDay, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useMemo } from 'react';
import { cn } from '@/lib/utils'; // Assuming tailwind-merge setup

type GanttChartProps = {
    tasks: Task[];
};

const COLOR_MAP: Record<TaskColor, string> = {
    blue: 'bg-blue-500 border-blue-600',
    red: 'bg-red-500 border-red-600',
    green: 'bg-emerald-500 border-emerald-600',
    yellow: 'bg-amber-400 border-amber-500',
    purple: 'bg-purple-500 border-purple-600',
    gray: 'bg-slate-500 border-slate-600',
};

export function GanttChart({ tasks }: GanttChartProps) {

    // Sort tasks logic (Same as TaskList)
    const sortedTasks = useMemo(() => {
        const parents = tasks.filter(t => !t.parent_id);
        const children = tasks.filter(t => t.parent_id);
        parents.sort((a, b) => a.start_date.localeCompare(b.start_date));

        const result: Task[] = [];
        parents.forEach(p => {
            result.push(p);
            const myChildren = children.filter(c => c.parent_id === p.id);
            myChildren.sort((a, b) => a.start_date.localeCompare(b.start_date));
            result.push(...myChildren);
        });
        // Add orphans
        children.filter(c => !parents.find(p => p.id === c.parent_id)).forEach(o => result.push(o));
        return result;
    }, [tasks]);

    // Determine date range and grouping structure
    const { startDate, dates, months } = useMemo(() => {
        if (tasks.length === 0) {
            const today = new Date();
            // Default 1 month view
            const start = addDays(today, -3);
            const end = addDays(today, 27);
            const allDates = eachDayOfInterval({ start, end });

            return {
                startDate: start,
                dates: allDates,
                months: groupDatesByMonth(allDates)
            };
        }

        const startDates = tasks.map(t => parseISO(t.start_date).getTime());
        const endDates = tasks.map(t => parseISO(t.end_date).getTime());

        const minDate = new Date(Math.min(...startDates));
        const maxDate = new Date(Math.max(...endDates));

        // Buffer
        const sDate = addDays(minDate, -5);
        const eDate = addDays(maxDate, 10);

        const allDates = eachDayOfInterval({ start: sDate, end: eDate });

        return {
            startDate: sDate,
            dates: allDates,
            months: groupDatesByMonth(allDates)
        };
    }, [tasks]);

    const CELL_WIDTH = 48;
    const ROW_HEIGHT = 58; // Matches TaskList
    const DAY_HEADER_HEIGHT = 30;
    const MONTH_HEADER_HEIGHT = 28;
    const TOTAL_HEADER_HEIGHT = DAY_HEADER_HEIGHT + MONTH_HEADER_HEIGHT;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800 overflow-hidden h-full flex flex-col transition-colors">
            <div className="overflow-x-auto overflow-y-hidden flex-1 relative scrollbar-hide">
                <div style={{ width: dates.length * CELL_WIDTH, minWidth: '100%' }}>

                    {/* Header Wrapper */}
                    <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 shadow-sm" style={{ height: TOTAL_HEADER_HEIGHT }}>

                        {/* Month Header */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800" style={{ height: MONTH_HEADER_HEIGHT }}>
                            {months.map((month) => (
                                <div
                                    key={month.key}
                                    className="flex-shrink-0 px-3 flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800"
                                    style={{ width: month.count * CELL_WIDTH }}
                                >
                                    {format(month.date, 'yyyy年 M月', { locale: ja })}
                                </div>
                            ))}
                        </div>

                        {/* Day Header */}
                        <div className="flex" style={{ height: DAY_HEADER_HEIGHT }}>
                            {dates.map((date, i) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isToday = isSameDay(date, new Date());
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-50 dark:border-gray-800 text-[10px]",
                                            isWeekend ? "bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400",
                                            isToday && "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold"
                                        )}
                                        style={{ width: CELL_WIDTH }}
                                    >
                                        <span className="">{format(date, 'd')} ({format(date, 'EE', { locale: ja })})</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Grid Area */}
                    <div className="relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none z-0">
                            {dates.map((_, i) => (
                                <div key={i} className="flex-shrink-0 border-r border-gray-50 dark:border-gray-800 h-full" style={{ width: CELL_WIDTH }} />
                            ))}
                        </div>

                        {/* Today Highlight Line */}
                        {(() => {
                            const today = new Date();
                            const todayOffset = differenceInDays(today, startDate);
                            if (todayOffset >= 0 && todayOffset < dates.length) {
                                return (
                                    <div
                                        className="absolute top-0 bottom-0 w-px bg-red-500/50 dark:bg-red-400/50 z-10 pointer-events-none dashed border-l border-red-500 border-dashed"
                                        style={{ left: todayOffset * CELL_WIDTH + CELL_WIDTH / 2 }}
                                    />
                                );
                            }
                            return null;
                        })()}

                        {/* Task Rows */}
                        {sortedTasks.map((task) => {
                            const taskStart = parseISO(task.start_date);
                            const taskEnd = parseISO(task.end_date);

                            const offsetDays = differenceInDays(taskStart, startDate);
                            const durationDays = differenceInDays(taskEnd, taskStart) + 1;

                            const left = offsetDays * CELL_WIDTH;
                            const width = durationDays * CELL_WIDTH;

                            const colorClass = COLOR_MAP[task.color || 'blue'];
                            const isChild = !!task.parent_id;

                            return (
                                <div
                                    key={task.id}
                                    className="relative group border-b border-gray-50/50 dark:border-gray-800/50 hover:bg-gray-50/40 dark:hover:bg-gray-800/40 transition-colors z-10"
                                    style={{ height: ROW_HEIGHT }}
                                >
                                    {/* Bar */}
                                    {offsetDays >= 0 && (
                                        <div
                                            className={cn(
                                                "absolute top-1/2 -translate-y-1/2 h-8 rounded-lg shadow-sm flex items-center px-3 border-t border-white/20",
                                                colorClass,
                                                isChild ? "h-6 opacity-90" : "h-9 shadow-md"
                                            )}
                                            style={{ left: left + 2, width: Math.max(width - 4, 10) }}
                                            title={`${task.title} (${task.start_date} ~ ${task.end_date})`}
                                        >
                                            <span className={cn(
                                                "text-[11px] font-medium text-white truncate drop-shadow-sm pointer-events-none sticky left-2",
                                                width < 60 && "sr-only"
                                            )}>
                                                {task.title}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to group dates by month
function groupDatesByMonth(dates: Date[]) {
    const groups: { key: string; date: Date; count: number }[] = [];

    dates.forEach(date => {
        const key = format(date, 'yyyy-MM');
        const lastGroup = groups[groups.length - 1];

        if (lastGroup && lastGroup.key === key) {
            lastGroup.count++;
        } else {
            groups.push({ key, date, count: 1 });
        }
    });

    return groups;
}
