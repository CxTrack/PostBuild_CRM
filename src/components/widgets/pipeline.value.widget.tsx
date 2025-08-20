import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { PipelineItem } from '../../types/database.types';

interface PipelineValueWidgetProps {
    opportunities: PipelineItem[];
    stats: any;
}

const PipelineValueWidget: React.FC<PipelineValueWidgetProps> = ({ opportunities, stats}) => {
    const [pipelineData, setPipelineData] = useState<any[]>([]);
    const { user } = useAuthStore();

     useEffect(() => {

    //     const loadData = async () => {
    //     }

    //     loadData();
     });

    return (
        <>
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Pipeline Value</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                $ {opportunities.filter((o: any) => o.final_status !== "No Sale")
                  .reduce((sum, o) => sum + (Number(o.dollar_value) || 0), 0)}
              </h3>
              <div className="flex items-center mt-2">
                {stats.trend === 'up' ? (
                  <ArrowUpRight size={16} className="text-green-500" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-500" />
                )}
                <span className={`text-sm ml-1 ${stats.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.change}
                </span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-500">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        </>
    );
};

export default PipelineValueWidget;