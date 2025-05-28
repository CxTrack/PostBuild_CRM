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
import { callsService } from '../../services/callsService';
import { formatService } from '../../services/formatService';

import RecentCallsTable from '../../components/calls/RecentCallsTable';
import { Call } from '../../types/database.types';
import CallsDashboardCharts from '../../components/calls/CallsDashboardCharts';

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

  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const callsPerPage = 20;


  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const data = await callsService.fetchAccountCalls();
        setCalls(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load calls');
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

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


  // const formatPhoneNumber = (phone: string) => {
  //   const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits

  //   // Expecting format like +1XXXXXXXXXX
  //   if (cleaned.length === 11 && cleaned.startsWith('1')) {
  //     const country = cleaned.slice(0, 1);
  //     const area = cleaned.slice(1, 4);
  //     const prefix = cleaned.slice(4, 7);
  //     const line = cleaned.slice(7, 11);
  //     return `+${country} (${area}) ${prefix}-${line}`;
  //   }

  //   return phone; // fallback
  // }


  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);

  //   const options = {
  //     month: 'long',
  //     day: 'numeric',
  //     year: 'numeric',
  //     hour: 'numeric',
  //     minute: '2-digit',
  //     second: '2-digit',
  //     hour12: false,
  //   };

  //   return new Intl.DateTimeFormat('en-US', options).format(date);
  // }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Calls Dashboard</h1>

      {loading && <p className="text-white">Loading calls...</p>}
      {error && <p className="text-red-500">Error fetching calls: {error}</p>}

      {!loading && !error && (
        <>
          <CallsDashboardCharts calls={calls} />

          {/* Recent Calls Table */}
          <RecentCallsTable
            currentCalls={currentCalls}
            formatPhoneNumber={formatService.formatPhoneNumber}
            formatDate={formatService.formatDate}
          />

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
