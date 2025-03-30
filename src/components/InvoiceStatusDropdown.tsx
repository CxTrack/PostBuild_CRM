import React, { useState, useRef, useEffect } from 'react';
import { InvoiceStatus } from '../types/database.types';
import { ChevronDown, Check } from 'lucide-react';

interface InvoiceStatusDropdownProps {
  currentStatus: InvoiceStatus;
  onStatusChange: (status: InvoiceStatus) => void;
  disabled?: boolean;
}

const InvoiceStatusDropdown: React.FC<InvoiceStatusDropdownProps> = ({ 
  currentStatus, 
  onStatusChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const statuses: InvoiceStatus[] = [
    'Draft',
    'Issued',
    'Paid',
    'Part paid',
    'Cancelled',
    'Disputed',
    'On hold'
  ];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-700 text-gray-300';
      case 'Issued':
        return 'bg-blue-700 text-white';
      case 'Paid':
        return 'bg-green-700 text-white';
      case 'Part paid':
        return 'bg-yellow-700 text-white';
      case 'Cancelled':
        return 'bg-red-700 text-white';
      case 'Disputed':
        return 'bg-purple-700 text-white';
      case 'On hold':
        return 'bg-orange-700 text-white';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };
  
  const getStatusDot = (status: InvoiceStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-400';
      case 'Issued':
        return 'bg-blue-400';
      case 'Paid':
        return 'bg-green-400';
      case 'Part paid':
        return 'bg-yellow-400';
      case 'Cancelled':
        return 'bg-red-400';
      case 'Disputed':
        return 'bg-purple-400';
      case 'On hold':
        return 'bg-orange-400';
      default:
        return 'bg-gray-400';
    }
  };
  
  const handleStatusClick = (status: InvoiceStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${getStatusColor(currentStatus)} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {currentStatus}
        <ChevronDown className="ml-2 -mr-0.5 h-4 w-4" aria-hidden="true" />
      </button>
      
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-dark-800 ring-1 ring-black ring-opacity-5 z-10 border border-dark-700">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusClick(status)}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-dark-700"
                role="menuitem"
              >
                <div className="flex items-center">
                  <span className={`h-2 w-2 rounded-full ${getStatusDot(status)} mr-2`}></span>
                  <span className="text-white">{status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceStatusDropdown;