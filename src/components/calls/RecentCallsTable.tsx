import React, { useEffect, useState } from 'react';
import { Call } from '../../types/database.types';
import { useNavigate } from 'react-router-dom';
import { formatService } from '../../services/formatService';
import { customerService } from '../../services/customerService'
import { callsService } from '../../services/callsService'
import { Loader2 } from "lucide-react";

interface RecentCallsTableProps {
  currentCalls: Call[];
  formatPhoneNumber: (phone: string) => string;
  formatDate: (dateString: string) => string;
}

const RecentCallsTable: React.FC<RecentCallsTableProps> = ({ currentCalls, formatPhoneNumber, formatDate }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  //const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [customerNames, setCustomerNames] = useState<{ [callId: string]: string }>({});

  const indexOfLastCall = currentPage * itemsPerPage;
  const indexOfFirstCall = indexOfLastCall - itemsPerPage;
  const currentCallsPaginated = currentCalls.slice(indexOfFirstCall, indexOfLastCall);

  const totalPages = Math.ceil(currentCalls.length / itemsPerPage);

useEffect(() => {
  if (!currentCallsPaginated.length) return;

  const fetchCustomerNames = async () => {
    const namesToAdd: { [callId: string]: string } = {};

    await Promise.all(
      currentCallsPaginated.map(async (call) => {
        if (customerNames[call.id]) return;

        try {
          const formattedPhone = await formatService.formatPhoneNumberAsInDB(call.from_number!);
          const customer = await customerService.getCustomerByPhone(formattedPhone);
          namesToAdd[call.id] = customer ? customer.name : formatPhoneNumber(call.from_number!);
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
}, [currentCallsPaginated]); // ✅ Only when calls change


  // const handlePageChange = (pageNumber: number) => {
  //   setCurrentPage(pageNumber);
  // };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRowClick = (call: Call) => {
    setSelectedCall(call);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCall(null);
  };

  return (
    <>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {currentCallsPaginated.map((call) => (
                  <tr key={call.id} className="text-white cursor-pointer hover:bg-dark-700" onClick={() => handleRowClick(call)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {customerNames[call.id] ? (
                        customerNames[call.id]
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </td>
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

                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-dark-700 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-white">Page {currentPage} of {totalPages}</span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-dark-700 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 p-6 rounded-lg text-white max-w-4xl w-full">
            <h3 className="text-xl font-bold mb-4">Call Details</h3>
            <p><strong>From:</strong> {formatPhoneNumber(selectedCall.from_number!)}</p>
            <p><strong>To:</strong> {formatPhoneNumber(selectedCall.to_number!)}</p>
            <p><strong>Start Time:</strong> {selectedCall.start_time ? formatDate(new Date(selectedCall.start_time).toLocaleString()) : 'N/A'}</p>
            <p><strong>End Time:</strong> {selectedCall.end_time ? formatDate(new Date(selectedCall.end_time).toLocaleString()) : 'N/A'}</p>
            <p><strong>Duration:</strong> {selectedCall.start_time && selectedCall.end_time
              ? Math.round(
                (new Date(selectedCall.end_time).getTime() - new Date(selectedCall.start_time).getTime()) / 1000
              )
              : 'N/A'} s</p>
            <div className="mt-4 block mb-2">
              <strong>Recording:</strong>
              {selectedCall.recording_url ? (
                <audio controls src={selectedCall.recording_url} className="mt-2 w-full">
                  Download audio
                </audio>
              ) : (
                <button onClick={async () => {
                  const apiCallDetails = await callsService.getCallRecording(selectedCall.provider_call_id);
                  if (apiCallDetails?.recording_url) {
                    setSelectedCall({
                      ...selectedCall!,
                      recording_url: apiCallDetails.recording_url
                    });
                  }
                }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >Load Recording</button>
              )}
            </div>
            <div className="mt-4">
              <strong>Transcript:</strong>
              <p> {selectedCall.transcript} </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
            {selectedCall.user_id && ( //TODO: compare this user is logged user
            
              <button
                onClick={async () => {
                  const customer = await formatService.formatPhoneNumberAsInDB(selectedCall.from_number!);
                  const foundCustomer = await customerService.getCustomerByPhone(customer);
                  if (foundCustomer) {
                    navigate(`/customers/${foundCustomer.id}`);
                  }
                }}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >View User Details</button>
              
            )}
            <button
              onClick={closeModal}
              className="mt-6 px-4 py-2 bg-dark-700 text-white rounded hover:bg-dark-600"
            >
              Close
            </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecentCallsTable;