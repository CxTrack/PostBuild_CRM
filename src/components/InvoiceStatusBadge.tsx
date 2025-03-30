import React from 'react';
import { InvoiceStatus } from '../types/database.types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  
  switch (status) {
    case 'Draft':
      bgColor = 'bg-gray-700/30';
      textColor = 'text-gray-400';
      break;
    case 'Issued':
      bgColor = 'bg-blue-900/30';
      textColor = 'text-blue-400';
      break;
    case 'Paid':
      bgColor = 'bg-green-900/30';
      textColor = 'text-green-400';
      break;
    case 'Part paid':
      bgColor = 'bg-yellow-900/30';
      textColor = 'text-yellow-400';
      break;
    case 'Cancelled':
      bgColor = 'bg-red-900/30';
      textColor = 'text-red-400';
      break;
    case 'Disputed':
      bgColor = 'bg-purple-900/30';
      textColor = 'text-purple-400';
      break;
    case 'On hold':
      bgColor = 'bg-orange-900/30';
      textColor = 'text-orange-400';
      break;
    default:
      bgColor = 'bg-gray-700/30';
      textColor = 'text-gray-400';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

export default InvoiceStatusBadge;