import React, { useEffect, useState } from 'react';
import Calendar from '../../components/calendar/Calendar';


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
      <h1 className="text-2xl font-bold text-white mb-6">Calendar Dashboard</h1>

      {loading && <p className="text-white">Loading events...</p>}
      {error && <p className="text-red-500">Error fetching events: {error}</p>}

      {!loading && !error && 
        <Calendar></Calendar>
      }
    </div>
  );
};

export default CalendarDashboard;
