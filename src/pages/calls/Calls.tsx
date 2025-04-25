import React, { useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { callsService } from '../../services/callsService';
import { useCallStore } from '../../stores/callStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Calls: React.FC = () => {
  const { calls, loading, error } = useCallStore();

  // Fetch calls when the component mounts
  useEffect(() => {
    callsService.fetchCalls();
  }, []);

  // Calculate the average call duration in minutes
  const averageCallDuration = useMemo(() => {
    if (!calls.length) return 0;

    console.log('Calls:', calls); // Debugging line to ensure we have data

    const totalDuration = calls.reduce((acc, call) => {
      const duration = (new Date(call.end_time).getTime() - new Date(call.start_time).getTime()) / 1000 // duration in seconds
      return acc + duration;
    }, 0);

    const averageInSeconds = totalDuration / calls.length;

    // Convert seconds to minutes (rounded to two decimal places)
    const averageInMinutes = (averageInSeconds / 60).toFixed(2);

    console.log('Total Duration (seconds):', totalDuration);
    console.log('Average Duration (minutes):', averageInMinutes);

    return parseFloat(averageInMinutes);
  }, [calls]);

  const chartData = useMemo(() => {
    console.log(averageCallDuration);
    

    return {
      labels: ['Total Calls', 'Average Call Length (minutes)', 'Success Rate (%)'],
      datasets: [
        {
          label: 'Call Metrics',
          data: [calls.length, averageCallDuration, 0], // <-- average in minutes
          backgroundColor: [
            'rgba(79, 70, 229, 0.6)',
            'rgba(34, 197, 94, 0.6)',
            'rgba(234, 179, 8, 0.6)',
          ],
          borderColor: [
            'rgba(79, 70, 229, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(234, 179, 8, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [calls, averageCallDuration]);

  const options = {
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
        text: 'Call Metrics Overview',
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
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Calls Dashboard</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-96 mb-6">
        <Bar data={chartData} options={options} />
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Calls</h2>
        {loading && <p className="text-white">Loading calls...</p>}
        {error && <p className="text-red-500">Error fetching calls: {error}</p>}
        {!loading && !error && calls.length === 0 && (
          <p className="text-white">No calls found.</p>
        )}
        {!loading && !error && calls.length > 0 && (
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
    </div>
  );
};

export default Calls;
