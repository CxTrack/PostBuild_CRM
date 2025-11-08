import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, DollarSign, Filter, Search, ArrowUpRight,
  ArrowDownRight, ChevronDown, Calendar, Clock, Filter as FilterIcon
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import PipelineValueWidget from '../widgets/pipeline/pipeline.value.widget';
import { usePipelineStore } from '../../stores/pipelineStore';
import { calculatePercentage } from '../../utils/general';
import PipelineOpportunitiesAmountWidget from '../widgets/pipeline/pipeline.opportunities.amount.widget';
import PipelineOpportunitiesAverageWidget from '../widgets/pipeline/pipeline.opportunities.average.widget';
import PipelineItemsTable from './PipelineItemsTable';

const Pipeline: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [percentageRange, setPercentageRange] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  const [pipeLineValueLastMonth, setPipeLineValueLastMonth] = useState(0);
  const [pipeLineValueThisMonth, setPipeLineValueThisMonth] = useState(0);

  const { opportunities, pipelines, leads, fetchPipelineItems } = usePipelineStore();
  const stats = {
    opportunities: {
      total: opportunities.length,
      value: `$${opportunities.reduce((sum, opp) => sum + (Number(opp.dollar_value) || 0), 0).toLocaleString()}`,
      change: calculatePercentage(pipeLineValueLastMonth, pipeLineValueThisMonth) + '%',
      trend: pipeLineValueThisMonth >= pipeLineValueLastMonth ? 'up' : 'down'
    }
  };

  useEffect(() => {
    const loadPipelineData = async () => {
      try {
        setLoading(true);

        fetchPipelineItems();
        calculateOpportunityChange();

      } catch (error) {
        console.error('Error loading pipeline data:', error);
        toast.error('Failed to load pipeline data');
      } finally {
        setLoading(false);
      }
    };

    loadPipelineData();
  }, [user?.id]);


  const calculateOpportunityChange = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // this month value
    const pipeLineValueThisMonth = opportunities
      .filter((o: any) => {
        const date = new Date(o.created_at);
        return (
          o.final_status !== "No Sale" &&
          date.getMonth() === thisMonth &&
          date.getFullYear() === thisYear
        );
      })
      .reduce((sum, o: any) => sum + Number(o.dollar_value), 0);

    setPipeLineValueThisMonth(pipeLineValueThisMonth);

    // last month value
    const pipeLineValueLastMonth = opportunities
      .filter((o: any) => {
        const date = new Date(o.created_at);
        return (
          o.final_status !== "No Sale" &&
          date.getMonth() === lastMonth &&
          date.getFullYear() === lastMonthYear
        );
      })
      .reduce((sum, o: any) => sum + Number(o.dollar_value), 0);

    setPipeLineValueLastMonth(pipeLineValueLastMonth);
  }

  // Calculate totals
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-400">Loading pipeline data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PipelineValueWidget opportunities={opportunities} stats={stats.opportunities} />
        <PipelineOpportunitiesAmountWidget opportunities={opportunities} />
        <PipelineOpportunitiesAverageWidget opportunities={opportunities} />
      </div>

      {/* Pipeline Stages */}
      <div className="card bg-dark-800 border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Pipeline Stages</h2>
        </div>

        <div className="space-y-4">
          {[
            { stage: 'lead', label: 'Leads', color: 'bg-gray-500' },
            { stage: 'opportunity', label: 'Opportunities', color: 'bg-blue-500' },
            // { stage: 'quote', label: 'Quotes', color: 'bg-yellow-500' },
            // { stage: 'invoice_sent', label: 'Invoices (Sent)', color: 'bg-orange-500' },
            // { stage: 'invoice_pending', label: 'Invoices (Pending)', color: 'bg-purple-500' },
            // { stage: 'closed_won', label: 'Closed (Won)', color: 'bg-green-500' }
          ].map((stage) => {
            const stageData = pipelines?.filter(p => p.stage == stage.stage);
            const value = stageData.reduce((sum, item) => sum + (Number(item.dollar_value) ?? 0), 0);
            const count = stageData.length || 0;
            const percentage = 1; // stageData?.dollar_value || 0;

            return (
              <button
                key={stage.stage}
                className={`w-full relative ${selectedStage === stage.stage ? 'ring-2 ring-primary-500 rounded-lg' : 'hover:bg-dark-700/50'
                  }`}
                onClick={() => {
                  setSelectedStage(selectedStage === stage.stage ? null : stage.stage);
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">{stage.label}</span>
                    <FilterIcon
                      size={14}
                      className={`text-gray-400 transition-colors ${selectedStage === stage.stage ? 'text-primary-400' : 'text-gray-500'
                        }`}
                    />
                  </div>
                  <span className="text-sm text-gray-400">
                    {count} {count === 1 ? 'deal' : 'deals'} · ${value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all duration-300 ${selectedStage === stage.stage ? 'opacity-100' : 'opacity-75'
                      }`}
                    style={{ width: `${percentage * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pipeline Items */}
      <PipelineItemsTable items={pipelines}/>
    </div>
  );
};

export default Pipeline;