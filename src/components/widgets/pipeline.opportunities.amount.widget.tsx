import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { PipelineItem } from '../../types/database.types';

interface PipelineValueWidgetProps {
  opportunities: PipelineItem[];
}

const PipelineOpportunitiesAmountWidget: React.FC<PipelineValueWidgetProps> = ({ opportunities }) => {
  const [thisMonthCount, setThisMonthCount] = useState(0);
  const [lastMonthCount, setLastMonthCount] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);

  useEffect(() => {
    calculateOpportunityChange();
  }, [opportunities]);

  const calculateOpportunityChange = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Count this month's opportunities
    const thisMonthCount = opportunities.filter((o: any) => {
      const date = new Date(o.created_at);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    // Count last month's opportunities
    const lastMonthCount = opportunities.filter((o: any) => {
      const date = new Date(o.created_at);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }).length;

    setThisMonthCount(thisMonthCount);
    setLastMonthCount(lastMonthCount);

    // Calculate percentage change
    let change = 0;
    if (lastMonthCount === 0) {
      change = thisMonthCount > 0 ? 100 : 0;
    } else {
      change = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
    }

    setPercentageChange(change);
  };

  return (
    <div className="card bg-dark-800 border border-dark-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">Total Deals</p>
          <h3 className="text-2xl font-bold text-white mt-1">
            {thisMonthCount}
          </h3>
          <div className="flex items-center mt-2">
            {percentageChange >= 0 ? (
              <ArrowUpRight size={16} className="text-green-500" />
            ) : (
              <ArrowDownRight size={16} className="text-red-500" />
            )}
            <span
              className={`text-sm ml-1 ${
                percentageChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {percentageChange.toFixed(1)}%
            </span>
            <span className="text-gray-500 text-sm ml-1">vs last month</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
          <FileText size={24} />
        </div>
      </div>
    </div>
  );
};

export default PipelineOpportunitiesAmountWidget;
