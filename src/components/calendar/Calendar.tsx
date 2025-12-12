import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useCalendarStore } from '../../stores/calendarStore';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CalendarShareModal from './CalendarShareModal';
import CalendarSelector from './CalendarSelector';
import { supabase } from '../../lib/supabase';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarProps {
  className?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onOpenNewWindow?: () => void;
}

const Calendar: React.FC<CalendarProps> = ({
  className,
  isMaximized = false,
  onToggleMaximize,
  onOpenNewWindow
}) => {
  const navigate = useNavigate();
  const { 
    events, 
    fetchEvents, 
    addEvent, 
    updateEvent, 
    deleteEvent,
    fetchCalendarShares,
    fetchAvailableCalendars,
    sharedWithMe
  } = useCalendarStore();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [date, setDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  //const [eventTypeFilter, setEventTypeFilter] = useState<string[]>(['custom', 'invoice']);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    description: '',
    type: 'custom' as 'invoice' | 'expense' | 'task' | 'custom'
  });

  useEffect(() => {
    // Load all data in parallel for better performance
    const loadData = async () => {
      // Get current user ID first (needed for other calls)
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      
      // Run all fetches in parallel
      await Promise.all([
        fetchEvents(),
        fetchCalendarShares(),
        fetchAvailableCalendars()
      ]);
    };
    
    loadData();
  }, []); // Empty deps - only run once on mount
  
  // Check if current user can delete the selected event
  const canDeleteEvent = (event: any): boolean => {
    if (!event || !currentUserId) return false;
    
    // Can delete if it's the user's own event
    if (event.user_id === currentUserId) return true;
    
    // Can delete if user is an editor on a shared calendar where the event owner is the calendar owner
    const isEditor = sharedWithMe.some(
      share => share.owner_id === event.user_id && 
               share.shared_with_id === currentUserId && 
               share.role === 'editor'
    );
    
    return isEditor;
  };

  useEffect(() => {
    if (selectedEvent) {
      setNewEvent({
        title: selectedEvent.title || '',
        start: new Date(selectedEvent.start),
        end: new Date(selectedEvent.end),
        description: selectedEvent.description || '',
        type: selectedEvent.type || 'custom',
      });
    } else {
      setNewEvent({
        title: '',
        start: new Date(),
        end: new Date(),
        description: '',
        type: 'custom',
      });
    }
  }, [selectedEvent]);

  // Filter events based on type
  // const filteredEvents = events.filter(event => {
  //   const today = new Date();
  //   const isToday = isWithinInterval(new Date(event.start), {
  //     start: startOfDay(today),
  //     end: endOfDay(today)
  //   });

  //   return eventTypeFilter.includes(event.type) && isToday;
  // });
  const filteredEvents = events;

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);

    setShowEventModal(true);

    // If it's an invoice event, navigate to invoice detail
    if (event.type === 'invoice' && event.invoice_id) {
      navigate(`/invoices/${event.invoice_id}`);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setNewEvent({
      title: '',
      start,
      end,
      description: '',
      type: 'custom',
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, newEvent);
        toast.success('Event updated successfully');
      } else {
        await addEvent(newEvent);
        toast.success('Event added successfully');
      }
      setShowEventModal(false);
      setSelectedEvent(null);
      setNewEvent({
        title: '',
        start: new Date(),
        end: new Date(),
        description: '',
        type: 'custom',
      });
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await deleteEvent(selectedEvent.id);
      toast.success('Event deleted successfully');
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '';
    switch (event.type) {
      case 'invoice':
        backgroundColor = '#4f46e5'; // primary-600
        break;
      case 'expense':
        backgroundColor = '#dc2626'; // red-600
        break;
      case 'task':
        backgroundColor = '#2563eb'; // blue-600
        break;
      case 'holiday':
        backgroundColor = '#9333ea'; // purple-600
        break;
      default:
        backgroundColor = '#059669'; // green-600
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0',
        display: 'block',
      },
    };
  };

  // Custom event component to display username
  const EventComponent = ({ event }: { event: any }) => {
    const username = event.user_email ? event.user_email.split('@')[0] : 'Unknown';
    return (
      <div className="p-1">
        <div className="font-semibold text-sm">{event.title}</div>
        {event.user_email && (
          <div className="text-xs opacity-90 mt-0.5">by {username}</div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-dark-800 rounded-lg border border-dark-700 p-4 ${className}`}>
      <div className="flex flex-col space-y-4">
        {/* Header with Calendar Selector and Share Button */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CalendarSelector />
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="btn btn-secondary btn-sm flex items-center gap-2"
            title="Share your calendar"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>

        {/* Current Month Display */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">
            {format(date, 'MMMM yyyy')}
          </h2>
        </div>

        {/* Calendar Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded ${view === 'month' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-300'
                }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded ${view === 'week' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-300'
                }`}
            >
              Week
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newDate = view === 'week' 
                  ? subWeeks(date, 1) 
                  : subMonths(date, 1);
                setDate(newDate);
              }}
              className="p-1 hover:bg-dark-700 rounded"
            >
              <ChevronLeft className="text-gray-400" size={20} />
            </button>
            <button
              onClick={() => setDate(new Date())}
              className="px-3 py-1 text-sm text-gray-300 hover:bg-dark-700 rounded"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = view === 'week' 
                  ? addWeeks(date, 1) 
                  : addMonths(date, 1);
                setDate(newDate);
              }}
              className="p-1 hover:bg-dark-700 rounded"
            >
              <ChevronRight className="text-gray-400" size={20} />
            </button>
            {onToggleMaximize && (
              <button
                onClick={onToggleMaximize}
                className="p-1 hover:bg-dark-700 rounded"
                title={isMaximized ? 'Minimize' : 'Maximize'}
              >
                {isMaximized ? (
                  <Minimize2 className="text-gray-400" size={20} />
                ) : (
                  <Maximize2 className="text-gray-400" size={20} />
                )}
              </button>
            )}
            {onOpenNewWindow && (
              <button
                onClick={onOpenNewWindow}
                className="p-1 hover:bg-dark-700 rounded"
                title="Open in new window"
              >
                <ExternalLink className="text-gray-400" size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`transition-all duration-300 ${isMaximized ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-250px)]'}`}>
          <BigCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={(newView: any) => setView(newView)}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleEventClick}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            className="calendar-dark"
            components={{
              toolbar: () => null, // Hide default toolbar
              event: EventComponent, // Custom event component with username
            }}
          />
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedEvent ? 'Edit Event' : 'New Event'}
            </h3>
            {selectedEvent?.user_email && (
              <div className="text-sm text-gray-400 mb-4">
                Created by: {selectedEvent.user_email.split('@')[0]}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event title"
                  disabled={selectedEvent?.calcom_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Type
                </label>
                <select
                  className="input w-full"
                  value={newEvent.type}
                  disabled={selectedEvent?.calcom_id}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value as any })
                  }
                >
                  <option value="custom">Custom Event</option>
                  <option value="task">Task</option>
                </select>

              </div>

              <input
                type="datetime-local"
                className="input w-full"
                value={format(newEvent.start, "yyyy-MM-dd'T'HH:mm")}
                disabled={selectedEvent?.calcom_id}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, start: new Date(e.target.value) })
                }
              />


              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  disabled={selectedEvent?.calcom_id}
                  className="input w-full"
                  value={format(newEvent.end, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end: new Date(e.target.value) })
                  }
                />

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="input w-full"
                  value={newEvent.description}
                  disabled={selectedEvent?.calcom_id}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Event description"
                />

              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              {!selectedEvent?.calcom_id && selectedEvent && canDeleteEvent(selectedEvent) && (
                <button
                  onClick={handleDeleteEvent}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className={selectedEvent?.calcom_id ? "btn btn-outline-secondary" : "btn btn-secondary"}
              >
                Close
              </button>
              {!selectedEvent?.calcom_id && (
                <button
                  onClick={handleSaveEvent}
                  className="btn btn-primary"
                >
                  {selectedEvent ? 'Update' : 'Create'}
                </button>
              )}

            </div>
            {selectedEvent?.calcom_id && (
              <div className="flex justify-center" style={{ width: `font-size: smaller`, color: `cadetblue` }}>
                <span><i>*This event was created through Cal.com. To delete or update it, please do so on the Cal.com platform — it will then be automatically refelcted in this calendar.</i></span>
              </div>            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <CalendarShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

export default Calendar;