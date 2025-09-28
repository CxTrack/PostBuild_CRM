import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  DollarSign,
  LayoutDashboard,
  Target
} from 'lucide-react';
import { useCalendarStore } from '../stores/calendarStore';
import CalendarEventsDisplay from './calendar/CalendarEventsDisplay';
import RecentCallsTable from './calls/RecentCallsTable';
import { formatService } from '../services/formatService';
import { callsService } from '../services/callsService';
import { Call, Task } from '../types/database.types';
import TaskList from './tasks/task-list';
import { useTaskStore } from '../stores/taskStore';
import { usePipelineStore } from '../stores/pipelineStore';
import CalendarStatsWidget from './calendar/CalendarStatsWidget';

const Dashboard: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const { upcomingEvents, todaysEvents, fetchEvents } = useCalendarStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { leads, opportunities, fetchPipelineItems } = usePipelineStore();


  const [pipeLineValueLastMonth, setPipeLineValueLastMonth] = useState(0);
  const [pipeLineValueThisMonth, setPipeLineValueThisMonth] = useState(0);

  useEffect(() => {

    const fetchCalls = async () => {
      try {
        const data = await callsService.fetchAccountCalls();
        setCalls(data);

        fetchPipelineItems();

        await fetchTasks()
      } catch (err: any) {
        console.error(err);
      } finally {
      }
    };

    fetchEvents();
    fetchCalls();
    calculateOpportunityChange();

  }, []);


  const calculateOpportunityChange = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // this month value
    const pipeLineValueThisMonth = filteredOpportunities
      .filter((o: any) => {
        const date = new Date(o.created_at);
        return (
          o.final_status !== "No Sale" &&
          date.getMonth() === thisMonth &&
          date.getFullYear() === thisYear
        );
      })
      .reduce((sum, o: any) => sum + Number(o.dollar_value), 0);

    setPipeLineValueThisMonth(pipeLineValueThisMonth);

    const pipeLineValueLastMonth = filteredOpportunities
      .filter((o: any) => {
        const date = new Date(o.created_at);
        return (
          o.final_status !== "No Sale" &&
          date.getMonth() === lastMonth &&
          date.getFullYear() === lastMonthYear
        );
      })
      .reduce((sum, o: any) => sum + Number(o.dollar_value), 0);

    setPipeLineValueLastMonth(pipeLineValueLastMonth);
  }

  const filteredOpportunities = [...opportunities].sort((a, b) => {
    const order = (status: string | null) => {
      if (status === null) return 0;              // first
      if (status !== "Sale" && status !== "No Sale") return 1; // second (anything else)
      if (status === "Sale") return 2;            // third
      if (status === "No Sale") return 3;         // last
      return 4; // fallback
    };

    return order(a.final_status) - order(b.final_status);
  });

  const getTodaysTasks = (tasks: Task[]): Task[] => {
    const today = new Date();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    return tasks.filter(task => {
      const due = new Date(task.due_date);
      return due <= endOfDay;
    });
  }

  const getNextUpcomingTasks = (tasks: Task[], count: number = 3): Task[] => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0); // today at midnight
    tomorrow.setDate(tomorrow.getDate() + 1); // move to tomorrow midnight

    return tasks
      .filter(task => new Date(task.due_date) >= tomorrow) // only tasks from tomorrow onwards
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()) // soonest first
      .slice(0, count); // take first N
  };

  const calculatePercentage = (oldValue: number, newValue: number): number => {
    let percentChange: number;

    if (oldValue === 0) {
      percentChange = newValue > 0 ? 100 : 0; // or Infinity depending on your use case
    } else {
      percentChange = ((newValue - oldValue) / oldValue) * 100;
    }

    return Math.trunc(percentChange);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-600/50 shadow-2xl gap-4 sm:gap-0">
        {/* Left Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex-shrink-0">
            <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-300 text-sm sm:text-lg mt-1 sm:mt-2">
              Welcome back! Here's what's happening today.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="text-left sm:text-right">
          <div className="text-slate-400 text-xs sm:text-sm mb-1">Today</div>
          <div className="text-white font-semibold text-sm sm:text-lg">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>


      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide ">
                Active Deals
              </h3>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                {leads.length}
              </div>
            </div>
          </div>
          {/* <div className="text-green-400 text-sm font-semibold">+{getLeadsThisWeek(leads).length} this week</div> */}
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl hover:shadow-green-500/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-300  text-sm font-semibold uppercase tracking-wide ">
                Pipeline Value
              </h3>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                $ {filteredOpportunities.filter((o: any) => o.final_status !== "No Sale")
                  .reduce((sum, o) => sum + (Number(o.dollar_value) || 0), 0).toLocaleString('en-US')}

              </div>
            </div>
          </div>
          <div className={`text-sm font-semibold ${calculatePercentage(pipeLineValueLastMonth, pipeLineValueThisMonth) < 0
            ? "text-red-400"
            : "text-green-400"
            }`}>{calculatePercentage(pipeLineValueLastMonth, pipeLineValueThisMonth) + '% vs last month'}</div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide ">
                Tasks Due Today
              </h3>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                {getTodaysTasks(tasks).length}
              </div>
            </div>
          </div>
          <div className="text-orange-400 text-sm font-semibold">{getTodaysTasks(tasks).filter(task => task.priority === 'high').length} high priority</div>
        </div>

        {/* Today's Events Widget */}
        <CalendarStatsWidget todaysEvents={todaysEvents} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <TaskList title="Today's Tasks" tasks={getTodaysTasks(tasks)} iconStyle="from-orange-500 to-amber-600" />
          <TaskList title='Upcoming Tasks' tasks={getNextUpcomingTasks(tasks, 3)} iconStyle="from-indigo-500 to-purple-600" />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <CalendarEventsDisplay displayedEvents={todaysEvents} caption="Today's Events" iconStyle="from-green-500 to-emerald-600" />
          <CalendarEventsDisplay displayedEvents={upcomingEvents} caption="Upcoming Events" iconStyle="from-purple-500 to-pink-600" />
        </div>
      </div>

      <RecentCallsTable
        currentCalls={calls}
        preview={true}
        formatPhoneNumber={formatService.formatPhoneNumber}
        formatDate={formatService.formatDate}
      />
    </div>
  );
};

export default Dashboard;