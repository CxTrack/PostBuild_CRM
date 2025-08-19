import { format } from 'date-fns';
import React from 'react';
import { CalendarEvent } from '../../types/calendar.event';


interface CalendarEventEditProps {
    event: CalendarEvent;
    onClose: () => void;
}

const CalendarEventEdit: React.FC<CalendarEventEditProps> = ({ event, onClose  }) => {

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-white mb-4">
                    {'Event Details'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            className="input w-full"
                            value={event?.title}
                            placeholder="Event title"
                            disabled={true}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Type
                        </label>
                        <select
                            className="input w-full"
                            value={event?.type}
                            disabled={true}
                        >
                            <option value="custom">Custom Event</option>
                            <option value="task">Task</option>
                        </select>

                    </div>

                    <input
                        type="datetime-local"
                        className="input w-full"
                        value={format(event?.start, "yyyy-MM-dd'T'HH:mm")}
                        disabled={true}
                    />


                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            End Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            disabled={true}
                            className="input w-full"
                            value={format(event?.end, "yyyy-MM-dd'T'HH:mm")}
                        />

                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            className="input w-full"
                            value={event?.description}
                            disabled={true}
                            rows={3}
                            placeholder="Event description"
                        />

                    </div>
                </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
            </div>
        </div>
    )
};

export default CalendarEventEdit;