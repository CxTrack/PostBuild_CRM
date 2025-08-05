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

import Calendar from '../../components/calendar/Calendar';

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

const CalendarDashboard: React.FC = () => {

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
      } catch (err: any) {
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);


  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Callendar Dashboard</h1>

      {loading && <p className="text-white">Loading events...</p>}
      {error && <p className="text-red-500">Error fetching events: {error}</p>}

      {!loading && !error && 
        <Calendar></Calendar>
      }
    </div>
  );
};

export default CalendarDashboard;
