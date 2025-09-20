import { CalendarDays } from 'lucide-react';
import React from 'react';
import { CalendarEvent } from '../../types/calendar.event';


interface CalendarEventsDisplayProps {
    iconStyle: string;
    caption: string;
    displayedEvents: CalendarEvent[];
}

const CalendarEventsDisplay: React.FC<CalendarEventsDisplayProps> = ({ displayedEvents, caption, iconStyle }) => {
    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'invoice': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
            case 'task': return 'bg-gradient-to-r from-green-500 to-emerald-500';
            case 'custom': return 'bg-gradient-to-r from-purple-500 to-pink-500';
            case 'holiday': return 'bg-gradient-to-r from-orange-500 to-amber-500';
            default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
        }
    };

    // Always show 3 slots minimum (pad with placeholders)
    const displayEvents = [
        ...displayedEvents,
        ...Array(Math.max(0, 4 - displayedEvents.length)).fill(null)
    ];

    return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
            <div className="p-6 border-b border-slate-600/50">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r shadow-lg ${iconStyle}`}>
                        <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <h2 className={`text-xl font-bold bg-gradient-to-r ${iconStyle} bg-clip-text text-transparent`}>
                        {caption}
                    </h2>
                </div>
            </div>
            <div className="p-6">
                {/* Wrapper with fixed height for 4 cards + scroll if more */}
                <div className="space-y-4 h-[24rem] overflow-y-auto pr-2">
                    {displayEvents.map((event, idx) => (
                        event ? (
                            <div
                                key={event.id}
                                className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-700/30 to-slate-600/30 backdrop-blur-sm border border-slate-600/20 hover:border-slate-500/40 transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className={`w-4 h-4 rounded-full mt-2 ${getEventTypeColor(event.type)} shadow-lg`} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-semibold text-base mb-1">{event.title}</h3>
                                    <div className="text-slate-400 text-sm">
                                        {event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={`placeholder-${idx}`}
                                className="flex items-center justify-center gap-4 p-4 rounded-xl bg-slate-700/20 border border-slate-600/20 text-slate-500 italic"
                            >
                                No event
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
};



export default CalendarEventsDisplay;