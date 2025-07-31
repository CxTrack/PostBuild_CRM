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
import AdminCallsDashboardCharts from '../../components/calls/AdminCallsDashboardCharts';
import CallAgentTab from '../settings/CallAgentTab';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement, 
  PointElement, 
  LineElement,
  Filler
);

const AdminCallAgent: React.FC = () => {

  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const callsPerPage = 20;


  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const data = await callsService.fetchAllCalls();
        setCalls(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load all calls');
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Call Agents</h1>

      {loading && <p className="text-white">Loading call agents...</p>}
      {error && <p className="text-red-500">Error fetching call agents: {error}</p>}

      {!loading && !error && (
        <>
          <CallAgentTab></CallAgentTab>
        </>
      )}
    </div>
  );
};

export default AdminCallAgent;
