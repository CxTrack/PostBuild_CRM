import React, { useEffect } from 'react';
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
import { useCallStore } from '../stores/callStore';
import { callsService } from '../services/callsService';

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

  useEffect(() => {
    callsService.fetchCalls();
  }, []); // Fetch calls when the component mounts

  // Dummy data for the chart - replace with actual aggregated data from calls state later if needed
  const data = {
    labels: ['Total Calls', 'Average Call Length (minutes)', 'Success Rate (%)'],
    datasets: [
      {
        label: 'Call Metrics',
        data: [calls.length, 5, 80], // Example: using calls.length for Total Calls
        backgroundColor: [
          'rgba(79, 70, 229, 0.6)', // primary-600
          'rgba(34, 197, 94, 0.6)',  // green-500
          'rgba(234, 179, 8, 0.6)',   // amber-500
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

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow height control
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff' // White color for legend text
        }
      },
      title: {
        display: true,
        text: 'Call Metrics Overview',
        color: '#ffffff' // White color for title
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#cccccc' // Light grey color for y-axis ticks
        },
        grid: {
          color: '#333333' // Dark grey color for y-axis grid lines
        }
      },
      x: {
        ticks: {
          color: '#cccccc' // Light grey color for x-axis ticks
        },
        grid: {
          color: '#333333' // Dark grey color for x-axis grid lines
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Calls Dashboard</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-96 mb-6">
        <Bar data={data} options={options} />
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{call.start_time ? new Date(call.start_time).toLocaleString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{call.end_time ? new Date(call.end_time).toLocaleString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {call.start_time && call.end_time
                        ? Math.round((new Date(call.end_time).getTime() - new Date(call.start_time).getTime()) / 1000)
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{call.disconnection_reason || 'N/A'}</td>
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
