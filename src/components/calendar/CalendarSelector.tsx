import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { useCalendarStore } from '../../stores/calendarStore';

interface CalendarSelectorProps {
  className?: string;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({ className }) => {
  const {
    availableCalendars,
    selectedCalendarIds,
    toggleCalendar,
    fetchAvailableCalendars,
  } = useCalendarStore();

  const getUsername = (email: string) => {
    return email.split('@')[0];
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={16} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Calendars</span>
      </div>
      <div className="space-y-1">
        {availableCalendars.map((calendar) => {
          const isSelected = selectedCalendarIds.includes(calendar.id);
          return (
            <button
              key={calendar.id}
              onClick={() => toggleCalendar(calendar.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-primary-600/20 border border-primary-600'
                  : 'bg-dark-700 hover:bg-dark-600 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    isSelected ? 'bg-primary-600' : 'bg-gray-500'
                  }`}
                />
                <span
                  className={`text-sm truncate ${
                    isSelected ? 'text-white font-medium' : 'text-gray-400'
                  }`}
                  title={calendar.email}
                >
                  {getUsername(calendar.email)}
                </span>
              </div>
              {isSelected && (
                <Check size={14} className="text-primary-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      {availableCalendars.length === 0 && (
        <p className="text-xs text-gray-500 mt-2">No calendars available</p>
      )}
    </div>
  );
};

export default CalendarSelector;

