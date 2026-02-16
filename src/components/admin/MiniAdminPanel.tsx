import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Settings,
    Users,
    Database,
    Activity,
    X,
    ChevronRight,
    Command
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

export const MiniAdminPanel = () => {
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const adminActions = [
        { label: 'User Management', icon: Users, path: '/admin/users', color: 'text-blue-600' },
        { label: 'System Settings', icon: Settings, path: '/admin/settings', color: 'text-gray-600' },
        { label: 'Database View', icon: Database, path: '/admin/database', color: 'text-green-600' },
        { label: 'Audit Log', icon: Activity, path: '/admin/audit', color: 'text-orange-600' },
    ];

    return (
        <div ref={panelRef} className="fixed bottom-6 left-6 z-50">
            {/* Expanded Panel */}
            {isOpen && (
                <div className={`
          absolute bottom-16 left-0 w-64 rounded-xl shadow-2xl border mb-2 overflow-hidden
          transform transition-all duration-200 origin-bottom-left
          ${theme === 'soft-modern'
                        ? 'bg-white/90 backdrop-blur-md border-white/50'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
        `}>
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-purple-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                Admin Panel
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="p-2 space-y-1">
                        {adminActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => {
                                    navigate(action.path);
                                    setIsOpen(false);
                                }}
                                className={`
                  w-full flex items-center justify-between p-2 rounded-lg text-left group
                  hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <action.icon size={16} className={`${action.color} opacity-70 group-hover:opacity-100`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {action.label}
                                    </span>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>

                    <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30">
                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                            <Command size={10} />
                            <span>Quick Access</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center justify-center w-12 h-12 rounded-[18px] shadow-lg transition-all hover:scale-105 active:scale-95
          ${isOpen
                        ? 'bg-gray-900 text-white rotate-90 dark:bg-white dark:text-gray-900'
                        : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white'}
          border-2 border-gray-100 dark:border-gray-700
        `}
            >
                <Shield size={20} className={isOpen ? 'text-purple-400' : 'text-purple-600'} />
            </button>
        </div>
    );
};
