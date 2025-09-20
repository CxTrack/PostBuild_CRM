import React, { useEffect, useState } from 'react';
import { Call } from '../../types/database.types';
import { formatService } from '../../services/formatService';
import { customerService } from '../../services/customerService'
import { useNavigate } from "react-router-dom";
import { Loader2, PhoneCall, Timer, UserCheck, UserMinus, XCircle } from "lucide-react";

interface RecentCallsTableProps {
  currentCalls: Call[];
  preview: boolean;
  formatPhoneNumber: (phone: string) => string;
  formatDate: (dateString: string, showTime: boolean) => string;
}

const RecentCallsTable: React.FC<RecentCallsTableProps> = ({ currentCalls, formatPhoneNumber, formatDate, preview }) => {
  const navigate = useNavigate();
  const [customerNameDialog, setCustomerNameDialog] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  //const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [customerNames, setCustomerNames] = useState<{ [callId: string]: string }>({});

  const indexOfLastCall = currentPage * itemsPerPage;
  const indexOfFirstCall = indexOfLastCall - itemsPerPage;
  const currentCallsPaginated = currentCalls.slice(indexOfFirstCall, indexOfLastCall);

  //const totalPages = Math.ceil(currentCalls.length / itemsPerPage);

  useEffect(() => {
    if (!currentCallsPaginated.length) return;

    const fetchCustomerNames = async () => {
      const namesToAdd: { [callId: string]: string } = {};

      await Promise.all(
        currentCallsPaginated.map(async (call) => {
          if (customerNames[call.id]) return;

          try {
            const formattedPhone = await formatService.formatPhoneNumberAsInDB(call.from_number!);
            namesToAdd[call.id] = await getCustomerName(formattedPhone);
          } catch (error) {
            namesToAdd[call.id] = formatPhoneNumber(call.from_number!) || 'Unknown';
          }
        })
      );

      if (Object.keys(namesToAdd).length > 0) {
        setCustomerNames((prev) => ({ ...prev, ...namesToAdd }));
      }
    };

    fetchCustomerNames();
  }, [currentCallsPaginated]);

  useEffect(() => {
    const loadCustomerName = async () => {


      if (selectedCall?.from_number) {
        const name = await getCustomerName(selectedCall.from_number);
        setCustomerNameDialog(name);
      }
    };

    loadCustomerName();
  }, [selectedCall?.from_number]);

  const getCallTypeIcon = (type: string, status: string) => {
    if (status === 'missed') return <XCircle className="w-4 h-4 text-red-400" />;
    if (type === 'inbound') return <PhoneCall className="w-4 h-4 text-green-400" />;
    return <PhoneCall className="w-4 h-4 text-blue-400" />;
  };

  const getCustomerypeIcon = (type: string) => {
    if (type === 'Unknown') return <UserMinus className="w-4 h-4 text-red-400" />;
    return <UserCheck className="w-4 h-4 text-blue-400" />;
  };


  const handleRowClick = (call: Call) => {
    setSelectedCall(call);
    setIsModalOpen(true);
  };

  const getCustomerName = async (phone: string) => {
    const formattedPhone = await formatService.formatPhoneNumberAsInDB(phone);
    const customer = await customerService.getCustomerByPhone(formattedPhone);
    return customer?.name ?? formatPhoneNumber(formattedPhone);
  }

  return (
    <>
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6 md:p-8 border-b border-slate-600/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title and icon */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg">
                <PhoneCall className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Recent Calls
              </h2>
            </div>

            <button
              onClick={() => navigate("/calls")}
              className="sm:mt-0 w-full sm:w-auto text-blue-400 hover:text-blue-300 text-sm font-semibold transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg hover:bg-blue-500/10"
            >
              {preview ? "View All Calls" : ""}
            </button>

          </div>
        </div>


        {currentCalls.length === 0 ? (
          <p className="text-white p-6">No calls found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm border-b border-slate-600/50">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-200 font-semibold text-sm uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-slate-200 font-semibold text-sm uppercase tracking-wider">From</th>
                  <th className="text-left px-4 py-3 text-slate-200 font-semibold text-sm uppercase tracking-wider hidden sm:table-cell">Call Time</th>
                  <th className="text-left px-4 py-3 text-slate-200 font-semibold text-sm uppercase tracking-wider hidden sm:table-cell">Duration (s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {(preview ? currentCallsPaginated.slice(0, 5) : currentCallsPaginated).map((call) => (
                  <tr key={call.id} className="text-white cursor-pointer hover:bg-dark-700" onClick={() => handleRowClick(call)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {customerNames[call.id] ? (
                          <>
                            {getCustomerypeIcon(customerNames[call.id])}
                            <span className="text-white font-semibold text-sm sm:text-lg truncate">{customerNames[call.id]}</span>
                          </>
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getCallTypeIcon('inbound', '')}
                        <div className="text-white font-semibold text-sm truncate">{formatPhoneNumber(call.from_number!)}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm hidden sm:table-cell">
                      {call.start_time ? formatDate(call.start_time, true) : 'N/A'}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm hidden sm:table-cell">
                      {call.start_time && call.end_time
                        ? <span className="flex items-center gap-1">
                          <Timer className="w-4 h-4 text-slate-400" />
                          {Math.round((new Date(call.end_time).getTime() - new Date(call.start_time).getTime()) / 1000)}
                        </span>
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default RecentCallsTable;