import { useState } from 'react';
import { format } from 'date-fns';
import {
  X, Clock, MapPin, Users, Calendar, Plus, CheckCircle, Trash2, Loader2
} from 'lucide-react';
import { Card } from '@/components/theme/ThemeComponents';
import { useThemeStore } from '@/stores/themeStore';
import type { CalendarEvent } from '@/types/database.types';
import type { Task } from '@/stores/taskStore';

interface AgendaPanelProps {
  selectedDate: Date;
  events: CalendarEvent[];
  tasks?: Task[];
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick?: (task: Task) => void;
  onDeleteEvent?: (id: string) => Promise<void>;
  onDeleteTask?: (id: string) => Promise<void>;
  onScheduleEvent: () => void;
  onClose: () => void;
}

export default function AgendaPanel({
  selectedDate,
  events,
  tasks = [],
  onEventClick,
  onTaskClick,
  onDeleteEvent,
  onDeleteTask,
  onScheduleEvent,
  onClose
}: AgendaPanelProps) {
  const { theme } = useThemeStore();
  const totalItems = events.length + tasks.length;
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState<'event' | 'task' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmDeleteId || !confirmDeleteType) return;
    setDeleting(true);
    try {
      if (confirmDeleteType === 'event' && onDeleteEvent) {
        await onDeleteEvent(confirmDeleteId);
      } else if (confirmDeleteType === 'task' && onDeleteTask) {
        await onDeleteTask(confirmDeleteId);
      }
    } catch {
      // Error handled by parent
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
      setConfirmDeleteType(null);
    }
  };

  return (
    <Card className={`w-full lg:w-96 border-l ${theme === 'soft-modern' ? 'border-gray-200' : 'border-gray-200 dark:border-gray-700'} flex flex-col rounded-none h-full`}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today's Agenda
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={16} className="mr-2" />
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-5">
            No events or tasks scheduled
          </p>
          <button
            onClick={onScheduleEvent}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium inline-flex items-center"
          >
            <Plus size={16} className="mr-1.5" />
            Schedule Event
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5">
          {events.length > 0 && (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="relative p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left group cursor-pointer"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <Clock size={14} className="mr-1" />
                      {format(new Date(event.start_time), 'h:mm a')}
                    </span>
                    <div className="flex items-center gap-2">
                      {onDeleteEvent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(event.id);
                            setConfirmDeleteType('event');
                          }}
                          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                          title="Delete event"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <span className={`w-2 h-2 rounded-full ${event.status === 'confirmed'
                        ? 'bg-green-500'
                        : event.status === 'cancelled'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                        }`} />
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h4>

                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {event.attendees && event.attendees.length > 0 && (
                      <p className="flex items-center">
                        <Users size={12} className="mr-1" />
                        {event.attendees[0].name}
                      </p>
                    )}
                    {event.location && (
                      <p className="flex items-center truncate">
                        <MapPin size={12} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="px-2 py-1 text-xs rounded-full font-medium"
                      style={{
                        backgroundColor: `${event.color_code || '#6366f1'}20`,
                        color: event.color_code || '#6366f1'
                      }}
                    >
                      {event.event_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tasks.length > 0 && (
            <div className={events.length > 0 ? 'mt-5' : ''}>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Tasks ({tasks.length})
              </h4>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="p-4 rounded-lg border border-orange-200 dark:border-orange-800/50 hover:border-orange-500 dark:hover:border-orange-400 transition-all text-left group bg-orange-50/50 dark:bg-orange-900/10 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        <CheckCircle size={14} className="mr-1 text-orange-500" />
                        {task.start_time || 'All day'}
                      </span>
                      <div className="flex items-center gap-2">
                        {onDeleteTask && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(task.id);
                              setConfirmDeleteType('task');
                            }}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {task.title}
                    </h4>

                    {task.customer_name && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                        <Users size={12} className="mr-1" />
                        {task.customer_name}
                      </p>
                    )}

                    <div className="mt-2">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                        {task.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`p-5 border-t flex-shrink-0 ${theme === 'soft-modern' ? 'border-gray-200 bg-white/50' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'}`}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Events</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {tasks.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Tasks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {events.filter(e => e.status === 'confirmed').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Confirmed</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {confirmDeleteId && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-none">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              Delete {confirmDeleteType === 'event' ? 'Event' : 'Task'}?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this {confirmDeleteType}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmDeleteId(null);
                  setConfirmDeleteType(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
