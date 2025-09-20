import React, { useEffect, useState } from 'react';
import { AlertCircle, BadgeDollarSign, Calendar, CheckSquare, ChevronDownSquare, ChevronRight, FileText, Phone, Trash2, User } from 'lucide-react';
import { Task } from '../../types/database.types';
import { useCustomerStore } from '../../stores/customerStore';
import { formatService } from '../../services/formatService';
import { TooltipButton } from '../ToolTip';
import { useTaskStore } from '../../stores/taskStore';

interface TaskListProps {
    title: string;
    iconStyle: string;
    tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ title, tasks, iconStyle }) => {
    const { fetchCustomers, getCustomerById } = useCustomerStore();
    //const { fetchTasks, updateTask, updateTaskStatus, deleteTask } = useTaskStore();
    const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

    // Fetch all customers once
    useEffect(() => {
        const fetchTaskCustomers = async () => {
            await fetchCustomers();
        };
        fetchTaskCustomers();
    }, [fetchCustomers]);

    // Fetch individual customer names for tasks
    useEffect(() => {
        const fetchNames = async () => {
            const names: Record<string, string> = {};

            for (const task of tasks) {
                if (task.customer_id && !customerNames[task.customer_id]) {
                    try {
                        const customer = await getCustomerById(task.customer_id);
                        if (customer) {
                            names[task.customer_id] = customer.name;
                        }
                    } catch (err) {
                        console.error(`Failed to fetch customer ${task.customer_id}`, err);
                    }
                }
            }

            if (Object.keys(names).length > 0) {
                setCustomerNames(prev => ({ ...prev, ...names }));
            }
        };

        if (tasks.length > 0) {
            fetchNames();
        }
    }, [tasks, getCustomerById, customerNames]);

    const getTaskTypeIcon = (type: string) => {
        switch (type) {
            case 'follow-up': return <Phone className="w-4 h-4" />;
            case 'submission': return <FileText className="w-4 h-4" />;
            case 'review': return <CheckSquare className="w-4 h-4" />;
            case 'scheduling': return <Calendar className="w-4 h-4" />;
            case 'documentation': return <FileText className="w-4 h-4" />;
            case 'reminder': return <AlertCircle className="w-4 h-4" />;
            default: return <CheckSquare className="w-4 h-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30';
            case 'medium': return 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/30';
            case 'low': return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30';
            default: return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border border-gray-500/30';
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl w-full">
            {/* Header */}
            <div className="p-4 md:p-8 border-b border-slate-600/50">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${iconStyle} shadow-lg`}>
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h2 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${iconStyle} bg-clip-text text-transparent`}>
                        {title}
                    </h2>
                </div>
            </div>

            {/* Task List */}
            <div className="p-4 md:p-2.5 w-full overflow-x-hidden">
                {/* Fixed height wrapper */}
                <div className="px-2 flex flex-col gap-4 md:gap-5 overflow-x-hidden min-h-[24rem] max-h-[24rem] md:min-h-[24rem] md:max-h-[24rem] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                    {tasks.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center text-slate-400 text-sm md:text-base">
                            No tasks available
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`flex items-center gap-4 p-4 md:p-4 bg-gradient-to-r ${new Date(task.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
                                    ? 'from-red-500 to-pink-600'
                                    : 'from-slate-700/50 to-slate-600/50'
                                    } backdrop-blur-sm rounded-xl hover:from-slate-600/60 hover:to-slate-500/60 transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 hover:scale-[1.02] shadow-lg w-full`}
                            >
                                {/* Task Icon */}
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                                        {getTaskTypeIcon(task.priority)}
                                    </div>
                                </div>

                                {/* Task Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-white font-semibold truncate text-sm md:text-lg">{task.title}</h3>
                                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs md:text-sm text-slate-300">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {customerNames[task.customer_id] ?? 'Loading...'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatService.formatDate(task.due_date)}
                                        </span>
                                    </div>
                                </div>

                                {/* Chevron */}
                                {/* <TooltipButton
                                    tooltip={task.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                                    icon={<ChevronDownSquare size={16} />}
                                    isDisabled={false}
                                    isHidden={false}
                                    onClick={async () => {
                                        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                                        updateTaskStatus(task.id, newStatus);
                                    }}
                                />

                                <TooltipButton
                                    className="flex-shrink-0 p-2 md:p-3 text-slate-400 hover:text-blue-400 transition-all duration-300 hover:scale-110 rounded-lg hover:bg-blue-500/10"
                                    tooltip="Delete Task"
                                    icon={<Trash2 size={16} />}
                                    isDisabled={false}
                                    isHidden={false}
                                    onClick={async () => {
                                        //handleDeleteTask(task);
                                        //await addActivity(`Task “${task.title}" ❌ deleted`, 'task', task.customer_id);
                                    }
                                    }
                                /> */}
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

export default TaskList;
