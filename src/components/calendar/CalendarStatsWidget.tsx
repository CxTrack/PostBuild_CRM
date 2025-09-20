import { CalendarDays } from "lucide-react";
import React, { useMemo } from "react";
import { CalendarEvent } from "../../types/calendar.event";

interface CalendarStatsWidgetProps {
  todaysEvents: CalendarEvent[];
}

const CalendarStatsWidget: React.FC<CalendarStatsWidgetProps> = ({ todaysEvents }) => {

  const getNextEventToday = (events: CalendarEvent[]): CalendarEvent | null => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const upcomingToday = events.filter((e) => {
      
      const start = new Date(e.start);
      return (start >= now && start >= todayStart && start <= todayEnd);
    });

    if (upcomingToday.length === 0) return null;

    return upcomingToday.reduce((earliest, current) =>
      new Date(current.start) < new Date(earliest.start) ? current : earliest
    );
  };

  const nextEvent = useMemo(() => getNextEventToday(todaysEvents), [todaysEvents]);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide ">
            Today's Meetings
          </h3>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {todaysEvents.length}
          </div>
        </div>
      </div>

      {/* Next event info */}
      <div className="text-purple-400 text-sm font-semibold mt-2">
        {nextEvent
          ? `Next: ${nextEvent.title} at ${formatTime(nextEvent.start.toString())}`
          : "No more upcomming events today."}
      </div>
    </div>
  );
};

export default CalendarStatsWidget;
