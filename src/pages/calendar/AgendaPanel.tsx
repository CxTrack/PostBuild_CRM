import { format } from 'date-fns';
import {
  X, Clock, MapPin, Users, Calendar, Plus, CheckCircle
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
  onScheduleEvent: () => void;
  onClose: () => void;
}

export default function AgendaPanel({
  selectedDate,
  events,
  tasks = [],
  onEventClick,
  onTaskClick,
  onScheduleEvent,
  onClose
}: AgendaPanelProps) {
  const { theme } = useThemeStore();
  const totalItems = events.length + tasks.length;

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
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <Clock size={14} className="mr-1" />
                      {format(new Date(event.start_time), 'h:mm a')}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${event.status === 'confirmed'
                      ? 'bg-green-500'
                      : event.status === 'cancelled'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                      }`} />
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
                </button>
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
                  <button
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="w-full p-4 rounded-lg border border-orange-200 dark:border-orange-800/50 hover:border-orange-500 dark:hover:border-orange-400 transition-all text-left group bg-orange-50/50 dark:bg-orange-900/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        <CheckCircle size={14} className="mr-1 text-orange-500" />
                        {task.start_time || 'All day'}
                      </span>
                      <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {task.priority}
                      </span>
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
                  </button>
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
    </Card>
  );
}
