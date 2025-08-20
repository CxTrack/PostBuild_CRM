import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { PipelineItem } from '../../types/database.types';

interface PipelineValueWidgetProps {
  opportunities: PipelineItem[];
}

const PipelineOpportunitiesAverageWidget: React.FC<PipelineValueWidgetProps> = ({ opportunities }) => {
  const [averageDealValue, setAverageDealValue] = useState(0);

  useEffect(() => {
    calculateAverageDealValue();
  }, [opportunities]);

  const calculateAverageDealValue = () => {
    // filter only "Active" opportunities
    const activeOpps = opportunities.filter(
      (o: any) => o.final_status === null
    );

    if (activeOpps.length === 0) {
      setAverageDealValue(0);
      return;
    }

    // sum their dollar_value, safely default to 0 if empty
    const totalValue = activeOpps.reduce(
      (sum, o: any) => sum + (o.dollar_value ? Number(o.dollar_value) : 0),
      0
    );

    // calculate average
    const average = totalValue / activeOpps.length;
    setAverageDealValue(average);
  };

  return (
    <div className="card bg-dark-800 border border-dark-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">Average Deal Value</p>
          <h3 className="text-2xl font-bold text-white mt-1">
            ${averageDealValue.toLocaleString()}
          </h3>
        </div>
        <div className="p-3 rounded-lg bg-purple-500/20 text-purple-500">
          <Users size={24} />
        </div>
      </div>
    </div>
  );
};

export default PipelineOpportunitiesAverageWidget;
