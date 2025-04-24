import React from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Calls: React.FC = () => {
  const data = {
    labels: ['Total Calls', 'Average Call Length (minutes)', 'Success Rate (%)'],
    datasets: [
      {
        label: 'Call Metrics',
        data: [150, 5, 80], // Dummy data: 150 calls, 5 mins avg length, 80% success
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            color: '#d1d5db' // gray-300
        }
      },
      title: {
        display: true,
        text: 'Call Performance Metrics',
        color: '#f3f4f6' // gray-100
      },
    },
    scales: {
        x: {
            ticks: {
                color: '#9ca3af' // gray-400
            },
            grid: {
                color: '#374151' // gray-700
            }
        },
        y: {
            ticks: {
                color: '#9ca3af' // gray-400
            },
             grid: {
                color: '#374151' // gray-700
            }
        }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Calls Dashboard</h1>
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-96">
         <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default Calls;