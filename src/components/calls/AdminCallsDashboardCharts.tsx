import React, { useEffect, useMemo, useState } from 'react';
import { Call } from '../../types/database.types';
import { useCallStore } from '../../stores/callStore';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { CallsWidgetsDashboard } from './CallsWidgetsDashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CallsDashboardChartsProps {
  calls: Call[];
}

const AdminCallsDashboardCharts: React.FC<CallsDashboardChartsProps> = ({ calls }) => {

  const [totalCallsDuration, setTotalCallsDuration] = useState(0);
  const { agentsCount, fetchCallAgents } = useCallStore();
  const [totalCallGrowghtLastMonth, setTotalCallGrowghtLastMonth] = useState(0);
  const [totalCallGrowghtThisMonth, setTotalCallGrowghtThisMonth] = useState(0);
  const [totalDurationGrowghtLastMonth, setTotalDurationGrowghtLastMonth] = useState(0);
  const [totalDurationGrowghtThisMonth, setTotalDurationGrowghtThisMonth] = useState(0);

  useEffect(() => {
    fetchCallAgents();
    setTotalCallsDuration(getTotalCallsDuration());

    fetchTotalCallsGrowthLastMonth();
    fetchTotalCallsGrowthThisMonth();

    getTotalDurationThisMonth(calls);
    getTotalDurationLastMonth(calls);

  }, [calls]);

  function getTotalCallsDuration(): number {
    const totalDurationMs = calls.reduce((sum, call) => {
      const start = new Date(call.start_time).getTime();
      const end = new Date(call.end_time).getTime();
      return sum + (end - start); // duration in ms
    }, 0);

    const totalDurationSeconds = totalDurationMs / 1000;
    const totalDurationMinutes = totalDurationSeconds / 60;

    return totalDurationMinutes;
  }

  function fetchTotalCallsGrowthLastMonth() {

    const callsByDate: { [date: string]: number } = {};

    // Calculate date range for last month
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1); // One millisecond before this month's start

    calls.forEach(call => {
      if (call.start_time) {
        const callDate = new Date(call.start_time);

        if (callDate >= startOfLastMonth && callDate <= endOfLastMonth) {
          const dateStr = callDate.toISOString().split('T')[0]; // YYYY-MM-DD
          callsByDate[dateStr] = (callsByDate[dateStr] || 0) + 1;
        }
      }
    });

    setTotalCallGrowghtLastMonth(Object.values(callsByDate).reduce((sum, count) => sum + count, 0));
  }

  function fetchTotalCallsGrowthThisMonth() {

    const callsByDate: { [date: string]: number } = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (Jan = 0)

    // Example: assume `calls` is your array of call records
    calls.forEach(call => {
      if (call.start_time) {
        const date = new Date(call.start_time);
        if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
          const dateKey = date.toISOString().split('T')[0]; // "YYYY-MM-DD"
          callsByDate[dateKey] = (callsByDate[dateKey] || 0) + 1;
        }
      }
    });

    // Total calls from this month
    setTotalCallGrowghtThisMonth(Object.values(callsByDate).reduce((sum, count) => sum + count, 0));
  }

  function getTotalDurationThisMonth(calls: { start_time: string; end_time: string }[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filteredCalls = calls.filter(call => {
      const startDate = new Date(call.start_time);
      return (
        startDate.getFullYear() === currentYear &&
        startDate.getMonth() === currentMonth
      );
    });

    setTotalDurationGrowghtThisMonth(getTotalDuration(filteredCalls))
  }

  function getTotalDurationLastMonth(calls: { start_time: string; end_time: string }[]) {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const yearOfLastMonth = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const filteredCalls = calls.filter(call => {
      const startDate = new Date(call.start_time);
      return (
        startDate.getFullYear() === yearOfLastMonth &&
        startDate.getMonth() === lastMonth
      );
    });

    setTotalDurationGrowghtLastMonth(getTotalDuration(filteredCalls))
  }

  function getTotalDuration(calls: { start_time: string; end_time: string }[]): number {
    const totalDurationMs = calls.reduce((sum, call) => {
      const start = new Date(call.start_time).getTime();
      const end = new Date(call.end_time).getTime();
      return sum + (end - start); // duration in ms
    }, 0);

    return totalDurationMs / 1000 / 60; // minutes
  }



  // Calculate the average call duration in minutes
  const averageCallDuration = useMemo(() => {
    if (!calls || calls.length === 0) return 0;

    const completedCalls = calls.filter(call => call.start_time && call.end_time);

    if (completedCalls.length === 0) return 0;

    const totalDuration = completedCalls.reduce((acc, call) => {
      const start = new Date(call.start_time!).getTime();
      const end = new Date(call.end_time!).getTime();
      const durationInSeconds = (end - start) / 1000;
      return acc + durationInSeconds;
    }, 0);

    const averageInSeconds = totalDuration / completedCalls.length;
    const averageInMinutes = (averageInSeconds / 60).toFixed(2);

    return parseFloat(averageInMinutes);
  }, [calls]);

  // Prepare data for Average Call Length Bar Chart
  const averageCallLengthBarData = useMemo(() => {
    return {
      labels: ['Average Call Length (minutes)'],
      datasets: [
        {
          label: 'Average Duration',
          data: [averageCallDuration],
          backgroundColor: 'rgba(34, 197, 94, 0.6)', // green-500
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [averageCallDuration]);

  // Calculate disconnection reason counts
  const disconnectionReasonCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    if (calls) {
      calls.forEach(call => {
        //const reason = call.disconnection_reason || 'Completed'; // Group null/empty as 'Completed'
        //console.log(call);

        const reason = call.disconnection_reason.replace('_',' ');
        counts[reason] = (counts[reason] || 0) + 1;
      });
    }
    return counts;
  }, [calls]);

  const callsByDate: { [key: string]: number } = {};

  calls.forEach(call => {
    if (call.start_time) {
      const date = new Date(call.start_time).toISOString().split('T')[0]; // Get YYYY-MM-DD
      callsByDate[date] = (callsByDate[date] || 0) + 1;
    }
  });

  const sortedDates = Object.keys(callsByDate).sort();

  const labels: string[] = [];
  const data: number[] = [];
  let cumulativeCount = 0;

  sortedDates.forEach(date => {
    labels.push(date);
    cumulativeCount += callsByDate[date];
    data.push(cumulativeCount);
  });

  // Options for the smaller charts
  const smallChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
        },
      },
      title: {
        display: true,
        // Text will be set individually for each chart
        color: '#ffffff',
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              if (context.chart.config.type === 'pie') {
                const total = context.dataset.data.reduce((sum: number, value: number) => sum + value, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1) + '%';
                label += `${context.parsed} (${percentage})`;
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#cccccc',
        },
        grid: {
          color: '#333333',
        },
        display: true, // Show Y axis for Bar chart
      },
      x: {
        ticks: {
          color: '#cccccc',
        },
        grid: {
          color: '#333333',
        },
        display: true, // Show X axis for Bar chart
      },
    },
  }), []);

  // Calculate disconnection reason counts
  const disconnectionReasonPieData = useMemo(() => {
    const labels = Object.keys(disconnectionReasonCounts);
    const data = Object.values(disconnectionReasonCounts);
    const backgroundColors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966CC',
      '#FF9F40',
      '#E7E9ED',
    ]; // Example colors

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: '#ffffff', // White border for slices
          borderWidth: 2,
        },
      ],
    };
  }, [disconnectionReasonCounts]);

  // Options specifically for Pie charts (no scales)
  const pieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
        },
      },
      title: {
        display: true,
        // Text will be set individually for each chart
        color: '#ffffff',
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.label || '';
            if (label) label += ': ';
            const total = context.dataset.data.reduce((sum: number, value: number) => sum + value, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1) + '%';
            label += `${context.raw} (${percentage})`;
            return label;
          },
        },
      },
    },
  }), []);

  // Group calls by month and year
  const callsByMonth = useMemo(() => {
    if (!calls) return {};
    const groupedCalls: { [key: string]: number } = {};
    calls.forEach(call => {
      if (call.start_time) {
        const date = new Date(call.start_time);
        const formattedDate = format(date, 'yyyy-MM');
        groupedCalls[formattedDate] = (groupedCalls[formattedDate] || 0) + 1;
      }
    });
    return groupedCalls;
  }, [calls]);

  // Prepare data for Calls by Month Bar Chart
  const callsByMonthBarData = useMemo(() => {
    const labels = Object.keys(callsByMonth);
    const sortedLabels = labels.sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      const dateA = new Date(yearA, monthA - 1).getTime();
      const dateB = new Date(yearB, monthB - 1).getTime();
      return dateA - dateB;
    });
    const data: number[] = sortedLabels.map(label => callsByMonth[label]);

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Number of Calls',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [callsByMonth]);

  // Options for the main chart (updated for Bar chart)
  const mainChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
        },
      },
      title: {
        display: true,
        text: 'Total Calls Over Time',
        color: '#ffffff',
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += context.parsed.y;
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Force whole number steps
          color: '#cccccc',
        },
        grid: {
          color: '#333333',
        },
      },
      x: {
        ticks: {
          color: '#cccccc',
        },
        grid: {
          color: '#333333',
        },
      },
    },
  }), []);

  // Prepare data for Total Calls Chart (Cumulative count over time, grouped by date)
  const totalCallsChartData = useMemo(() => {
    if (!calls || calls.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const callsByDate: { [key: string]: number } = {};

    calls.forEach(call => {
      if (call.start_time) {
        const date = new Date(call.start_time).toISOString().split('T')[0]; // Get YYYY-MM-DD
        callsByDate[date] = (callsByDate[date] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(callsByDate).sort();

    const labels: string[] = [];
    const data: number[] = [];
    let cumulativeCount = 0;

    sortedDates.forEach(date => {
      labels.push(date);
      cumulativeCount += callsByDate[date];
      data.push(cumulativeCount);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Total Calls',
          data,
          backgroundColor: 'rgba(79, 70, 229, 0.6)', // primary-600 with transparency
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [calls]);

  return (
    <div className="card border border-dark-700 mb-5">

      <CallsWidgetsDashboard
        agentsCount={agentsCount} calls={calls}
        averageCallLenght={averageCallDuration}
        totalCallGrowthThisMonth={totalCallGrowghtThisMonth}
        totalCallGrowthLastMonth={totalCallGrowghtLastMonth}
        totalCallsDuration={totalCallsDuration} 
        totalCallsDurationGrowthThisMonth={totalDurationGrowghtThisMonth} 
        totalCallsDurationGrowthLastMonth={totalDurationGrowghtLastMonth}
      ></CallsWidgetsDashboard>

      {/* Total Calls Bar Chart */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80 mb-6">
        <Line data={totalCallsChartData} options={mainChartOptions} />
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80 mb-6">
        <Bar
          data={callsByMonthBarData}
          options={{
            ...smallChartOptions,
            plugins: { ...smallChartOptions.plugins, title: { ...smallChartOptions.plugins, text: 'Calls by Month' } },
            scales: { ...smallChartOptions.scales, y: { ...smallChartOptions.scales.y, beginAtZero: true, display: true }, x: { ...smallChartOptions.scales.x, display: true } }
          }}
        />
      </div>

      {/* Three smaller charts in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80">
          <Pie data={disconnectionReasonPieData} options={{
            ...pieChartOptions,
            plugins: { ...pieChartOptions.plugins }
          }} />
        </div> */}
      </div>
    </div>

  );
};

export default AdminCallsDashboardCharts;