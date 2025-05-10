import React, { useEffect, useMemo, useState } from 'react';
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
import { Bar, Pie, Line } from 'react-chartjs-2'; // Import Line, Bar, and Pie
import { callsService } from '../../services/callsService';
import { useCallStore } from '../../stores/callStore';
import { Edit, Eye, Headset, Phone, Timer, Trash2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
  const { calls, agents, totalCallsDuration, loading, error } = useCallStore();
  const [currentPage, setCurrentPage] = useState(1);
  const callsPerPage = 20;

  // Fetch calls when the component mounts
  useEffect(() => {
    callsService.fetchCalls();
  }, []);

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

    // Get current calls
    const indexOfLastCall = currentPage * callsPerPage;
    const indexOfFirstCall = indexOfLastCall - callsPerPage;
    const currentCalls = useMemo(() => calls.slice(indexOfFirstCall, indexOfLastCall), [calls, currentPage]);

    // Change page
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const pageNumbers = useMemo(() => {
        const numbers = [];
        for (let i = 1; i <= Math.ceil(calls.length / callsPerPage); i++) {
            numbers.push(i);
        }
        return numbers;
    }, [calls, callsPerPage]);

    const renderPageNumbers = useMemo(() => {
        const pageCount = pageNumbers.length;
        const visiblePageCount = 5; // Number of visible page numbers (including ellipsis)
        const edgePageCount = 3;

        if (pageCount <= visiblePageCount) {
            return pageNumbers;
        }

        const displayedPages = [];
        // First page
        for (let i = 1; i <= Math.min(edgePageCount, pageCount); i++) {
          displayedPages.push(i);
        }

        // Ellipsis
        if (currentPage > edgePageCount + 1) {
            displayedPages.push('...');
        }

        // Last Pages
        for (let i = Math.max(pageCount - edgePageCount + 1, edgePageCount + 1); i <= pageCount; i++) {
            displayedPages.push(i);
        }

        return displayedPages;
    }, [pageNumbers, currentPage]);


    const formatPhoneNumber = (phone: string) => {
      const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits

      // Expecting format like +1XXXXXXXXXX
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        const country = cleaned.slice(0, 1);
        const area = cleaned.slice(1, 4);
        const prefix = cleaned.slice(4, 7);
        const line = cleaned.slice(7, 11);
        return `+${country} (${area}) ${prefix}-${line}`;
      }
    
      return phone; // fallback
    }


    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
    
      const options = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
    
      return new Intl.DateTimeFormat('en-US', options).format(date);
    }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Calls Dashboard - last 1000 calls</h1>

      {loading && <p className="text-white">Loading calls...</p>}
      {error && <p className="text-red-500">Error fetching calls: {error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Link to="/calls" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Agents Amount</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{agents.length}</h3>
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
                  <h3 className="text-2xl font-bold text-white mt-1">{totalCallsDuration} min</h3>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
                  <Timer size={24} />
                </div>
              </div>
            </Link>
          </div>

          {/* Total Calls Bar Chart */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80 mb-6">
            <Bar data={totalCallsChartData} options={mainChartOptions} />
          </div>

          {/* Three smaller charts in a row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80">
              <Bar data={averageCallLengthBarData} options={{
                ...smallChartOptions,
                plugins: { ...smallChartOptions.plugins, title: { ...smallChartOptions.plugins.title, text: 'Average Call Length (minutes)' } },
                scales: { ...smallChartOptions.scales, y: { ...smallChartOptions.scales.y, beginAtZero: true, display: true }, x: { ...smallChartOptions.scales.x, display: false } } // Hide x-axis labels for single bar
              }} />
            </div>

            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80">
              <Pie data={disconnectionReasonPieData} options={{
                ...pieChartOptions,
                plugins: { ...pieChartOptions.plugins, text: 'Disconnection Reason' }
              }} />
            </div>

              {/* Calls by Month Bar Chart */}
              <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 h-80">
                  <Bar
                      data={callsByMonthBarData}
                      options={{
                          ...smallChartOptions,
                          plugins: { ...smallChartOptions.plugins, title: { ...smallChartOptions.plugins, text: 'Calls by Month' } },
                          scales: { ...smallChartOptions.scales, y: { ...smallChartOptions.scales.y, beginAtZero: true, display: true }, x: { ...smallChartOptions.scales.x, display: true } }
                      }}
                  />
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">Audio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {currentCalls.map((call) => (
                      <tr key={call.id} className="text-white">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatPhoneNumber(call.from_number!)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatPhoneNumber(call.to_number!)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.start_time ? formatDate(new Date(call.start_time).toLocaleString()) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.end_time ? formatDate(new Date(call.end_time).toLocaleString()) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.start_time && call.end_time
                            ? Math.round(
                              (new Date(call.end_time).getTime() - new Date(call.start_time).getTime()) / 1000
                            )
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {call.recording_url ? (
                            <audio controls src={call.recording_url} style={{
                              width: '150px',    // shrink width
                              height: '30px',    // shrink height
                              display: 'block',
                              objectFit: 'contain',
                            }}>
                              Download audio
                            </audio>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {calls.length > 0 && (
            <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-700">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="btn btn-secondary">Previous</button>
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === pageNumbers.length} className="btn btn-secondary">Next</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Showing <span className="font-medium text-white">{indexOfFirstCall + 1}</span> to <span className="font-medium text-white">{indexOfLastCall > calls.length ? calls.length : indexOfLastCall}</span> of <span className="font-medium text-white">{calls.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-dark-700 bg-dark-800 text-sm font-medium text-gray-400 hover:bg-dark-700"
                    >
                      Previous
                    </button>
                    {renderPageNumbers.map(number => (
                      <button
                        key={number}
                        onClick={() => {
                          if (number !== '...') {
                            paginate(Number(number));
                          }
                        }}
                        aria-current="page"
                        className={`${currentPage === number ? 'z-10 bg-indigo-500 border-indigo-500 text-white' : 'bg-dark-800 border-dark-700 text-gray-400 hover:bg-dark-700'} relative inline-flex items-center px-4 py-2 border text-sm font-medium`}
                        disabled={number === '...'}
                      >
                        {number}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === pageNumbers.length}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-dark-700 bg-dark-800 text-sm font-medium text-gray-400 hover:bg-dark-700"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Calls;
