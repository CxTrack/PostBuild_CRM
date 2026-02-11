import React, { useState } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore } from '@/stores/themeStore';
import { Card, Badge } from '@/components/theme/ThemeComponents';
import {
    Sparkles,
    Bug,
    Code,
    Clock,
    CheckCircle2,
    Circle,
    AlertCircle
} from 'lucide-react';

const TASK_ICONS: Record<string, React.ElementType> = {
    feature: Sparkles,
    bug: Bug,
    refactor: Code,
};

interface Task {
    id: string;
    title: string;
    category: string;
    priority: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    estimated_hours: number;
    logged_hours: number;
    assignee_name?: string;
}

export const SprintBoard: React.FC = () => {
    const { currentOrganization } = useOrganizationStore();
    const { theme } = useThemeStore();
    const [tasks] = useState<Task[]>([
        {
            id: '1',
            title: 'Implement OAuth callback handling',
            category: 'feature',
            priority: 'high',
            status: 'in_progress',
            estimated_hours: 8,
            logged_hours: 4,
            assignee_name: 'Alex'
        },
        {
            id: '2',
            title: 'Fix sidebar navigation bug',
            category: 'bug',
            priority: 'critical',
            status: 'todo',
            estimated_hours: 2,
            logged_hours: 0,
            assignee_name: 'Sam'
        },
        {
            id: '3',
            title: 'Refactor database models',
            category: 'refactor',
            priority: 'medium',
            status: 'review',
            estimated_hours: 12,
            logged_hours: 10,
            assignee_name: 'Jordan'
        }
    ]);

    // Theme-aware colors
    const textPrimary = theme === 'soft-modern'
        ? 'text-slate-900'
        : 'text-gray-900 dark:text-white';

    const textSecondary = theme === 'soft-modern'
        ? 'text-slate-600'
        : 'text-gray-600 dark:text-gray-400';

    const bgColumn = theme === 'soft-modern'
        ? 'bg-slate-100'
        : 'bg-gray-50 dark:bg-gray-800/50';

    const columns = [
        { id: 'todo', name: 'To Do', icon: Circle },
        { id: 'in_progress', name: 'In Progress', icon: Clock },
        { id: 'review', name: 'Code Review', icon: AlertCircle },
        { id: 'done', name: 'Done', icon: CheckCircle2 }
    ];

    const getTasksByStatus = (status: string) => {
        return tasks.filter(t => t.status === status);
    };

    const getPriorityVariant = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
        switch (priority) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            default: return 'default';
        }
    };

    const renderTaskCard = (task: Task) => {
        const Icon = TASK_ICONS[task.category] || Sparkles;

        return (
            <Card key={task.id} hover className="mb-2 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Icon size={14} className={textSecondary} />
                        <span className={`text-sm font-medium ${textPrimary} line-clamp-2`}>
                            {task.title}
                        </span>
                    </div>
                </div>

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge variant={getPriorityVariant(task.priority)}>
                        {task.priority}
                    </Badge>
                    {task.estimated_hours && (
                        <Badge variant="info">
                            {task.logged_hours || 0}/{task.estimated_hours}h
                        </Badge>
                    )}
                </div>

                {task.assignee_name && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                            {task.assignee_name.charAt(0)}
                        </div>
                        <span className={`text-xs ${textSecondary}`}>
                            {task.assignee_name}
                        </span>
                    </div>
                )}
            </Card>
        );
    };

    return (
        <div className="h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className={`text-2xl font-bold ${textPrimary}`}>
                        Sprint Board
                    </h2>
                    <p className={textSecondary}>
                        {currentOrganization?.name || 'Organization'} - Active Sprint
                    </p>
                </div>
                <div className={`text-sm ${textSecondary}`}>
                    <span className={`font-medium ${textPrimary}`}>
                        {tasks.filter(t => t.status === 'done').length}
                    </span>
                    /{tasks.length} completed
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
                {columns.map((column) => {
                    const columnTasks = getTasksByStatus(column.id);
                    const Icon = column.icon;

                    return (
                        <div key={column.id} className={`flex flex-col ${bgColumn} rounded-xl p-3 h-full overflow-hidden`}>
                            <div className="flex items-center gap-2 mb-3 px-2">
                                <Icon size={16} className={textSecondary} />
                                <span className={`font-medium ${textSecondary}`}>
                                    {column.name}
                                </span>
                                <Badge variant="default" className="ml-auto">
                                    {columnTasks.length}
                                </Badge>
                            </div>

                            <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                                {columnTasks.map(renderTaskCard)}
                                {columnTasks.length === 0 && (
                                    <div className={`text-center py-8 text-xs ${textSecondary} border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl`}>
                                        No tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SprintBoard;
