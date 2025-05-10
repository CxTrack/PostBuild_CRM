import React from 'react';
import { Call } from '../types/database.types';
 
interface RecentCallsTableProps {
  currentCalls: Call[];
  formatPhoneNumber: (phone: string) => string;
  formatDate: (dateString: string) => string;
}

const RecentCallsTable: React.FC<RecentCallsTableProps> = ({ currentCalls, formatPhoneNumber, formatDate }) => {
  return (
    <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Recent Calls</h2>
      {currentCalls.length === 0 ? (
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
                        width: '150px',
                        height: '30px',
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
  );
};

export default RecentCallsTable;