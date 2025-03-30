import React from 'react';
import { QuoteStatus } from '../types/database.types';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

const QuoteStatusBadge: React.FC<QuoteStatusBadgeProps> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  
  switch (status) {
    case 'Draft':
      bgColor = 'bg-gray-700/30';
      textColor = 'text-gray-400';
      break;
    case 'Sent':
      bgColor = 'bg-blue-900/30';
      textColor = 'text-blue-400';
      break;
    case 'Accepted':
      bgColor = 'bg-green-900/30';
      textColor = 'text-green-400';
      break;
    case 'Declined':
      bgColor = 'bg-red-900/30';
      textColor = 'text-red-400';
      break;
    case 'Expired':
      bgColor = 'bg-yellow-900/30';
      textColor = 'text-yellow-400';
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

export default QuoteStatusBadge;