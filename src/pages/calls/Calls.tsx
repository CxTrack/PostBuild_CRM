import React, { useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement, // For Pie charts
  PointElement, // For Area charts
  LineElement, // For Area charts
  Filler, // For Area charts
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2'; // Import Line and Pie
import { callsService } from '../../services/callsService';
import { useCallStore } from '../../stores/callStore';
import { Headset, Phone, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement, // Register ArcElement
  PointElement, // Register PointElement
  LineElement, // Register LineElement
  Filler // Register Filler
);

const Calls: React.FC = () => {
  const { calls, loading, error } = useCallStore(); // Removed agents and totalCallsDuration as they are not used directly here now

  // Fetch calls when the component mounts
  useEffect(() => {
    callsService.fetchCalls();
  }, []);

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

  // Calculate disconnection reason counts
  const disconnectionReasonCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    if (calls) {
      calls.forEach(call => {
        const reason = call.disconnection_reason || 'Completed'; // Group null/empty as 'Completed'
        counts[reason] = (counts[reason] || 0) + 1;
      });
    }
    return counts;
  }, [calls]);

  // Prepare data for Total Calls Area Chart (Cumulative count over time)
  const totalCallsAreaData = useMemo(() => {
    if (!calls || calls.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const sortedCalls = [...calls].sort((a, b) => {
      const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return timeA - timeB;
    });

    const labels: string[] = [];
    const data: number[] = [];
    let cumulativeCount = 0;

    sortedCalls.forEach(call => {
      if (call.start_time) {
        cumulativeCount++;
        labels.push(new Date(call.start_time).toLocaleString()); // Use local string for simplicity
        data.push(cumulativeCount);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Total Calls',
          data,
          fill: true,
          backgroundColor: 'rgba(79, 70, 229, 0.3)', // primary-600 with transparency
          borderColor: 'rgba(79, 70, 229, 1)',
          tension: 0.1, // Smooth the line
        },
      ],
    };
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

  // Prepare data for Disconnection Reason Pie Chart
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

  // Options for the Area Chart
  const totalCallsAreaOptions = useMemo(() => ({
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Calls Dashboard</h1>

      {loading && <p className="text-white">Loading calls...</p>}
      {error && <p className="text-red-500">Error fetching calls: {error}</p>}

      {!loading && !error && (
        <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Link to="/calls" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Agents Amount</p>
              <h3 className="text-2xl font-bold text-white mt-1">{0}</h3>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
              <Headset size={24} />
            </div>
          </div>
        </Link>

        <Link to="/calls" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Calls</p>
              <h3 className="text-2xl font-bold text-white mt-1">{calls.length}</h3>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
              <Phone size={24} />
            </div>
          </div>
        </Link>

        <Link to="/calls" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Calls Duration</p>
              <h3 className="text-2xl font-bold text-white mt-1">{0} min</h3>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
              <Timer size={24} />
            </div>
          </div>
        </Link>
      </div>

          {/* Total Calls Area Chart */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80 mb-6">
            <Line data={totalCallsAreaData} options={totalCallsAreaOptions} />
          </div>

          {/* Three smaller charts in a row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Average Call Length Bar Chart */}
            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80">
               <Bar data={averageCallLengthBarData} options={{
                 ...smallChartOptions,
                 plugins: { ...smallChartOptions.plugins, title: { ...smallChartOptions.plugins.title, text: 'Average Call Length (minutes)' } },
                 scales: { ...smallChartOptions.scales, y: { ...smallChartOptions.scales.y, beginAtZero: true, display: true }, x: { ...smallChartOptions.scales.x, display: false } } // Hide x-axis labels for single bar
                }} />
            </div>

            {/* Disconnection Reason Pie Chart 1 */}
            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80">
              <Pie data={disconnectionReasonPieData} options={{
                ...pieChartOptions,
                plugins: { ...pieChartOptions.plugins, title: { ...pieChartOptions.plugins.title, text: 'Disconnection Reason' } }
                }} />
            </div>

            {/* Disconnected Reason Pie Chart 2 (Assuming this was intended to show the same data or similar) */}
             <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80">
              <Pie data={disconnectionReasonPieData} options={{
                ...pieChartOptions,
                plugins: { ...pieChartOptions.plugins, title: { ...pieChartOptions.plugins.title, text: 'Disconnection Reason (Copy)' } }
                }} />
            </div>
          </div>

          {/* Recent Calls Table */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Calls</h2>
            {calls.length === 0 ? (
              <p className="text-white">No calls found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Start Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">End Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Duration (s)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {calls.map((call) => (
                      <tr key={call.id} className="text-white">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{call.from_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{call.to_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.start_time ? new Date(call.start_time).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.end_time ? new Date(call.end_time).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.start_time && call.end_time
                            ? Math.round(
                                (new Date(call.end_time).getTime() - new Date(call.start_time).getTime()) / 1000
                              )
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.disconnection_reason || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Calls;
