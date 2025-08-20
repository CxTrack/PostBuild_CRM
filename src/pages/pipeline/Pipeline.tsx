import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, DollarSign, Filter, Search, ArrowUpRight,
  ArrowDownRight, ChevronDown, Calendar, Clock, Filter as FilterIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import PipelineValueWidget from '../../components/widgets/pipeline.value.widget';
import { usePipelineStore } from '../../stores/pipelineStore';
import { calculatePercentage } from '../../utils/general';
import PipelineOpportunitiesAmountWidget from '../../components/widgets/pipeline.opportunities.amount.widget';
import PipelineOpportunitiesAverageWidget from '../../components/widgets/pipeline.opportunities.average.widget';

const Pipeline: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

        // Get detailed pipeline items
        // const quotesPromise = supabase
        //   .from('quotes')
        //   .select('*')
        //   .eq('user_id', user?.id)
        //   .filter('status', 'not.in', '("Declined","Expired")');

        // const invoicesPromise = supabase
        //   .from('invoices')
        //   .select('*')
        //   .eq('user_id', user?.id)
        //   .neq('status', 'Cancelled');

        // const [quotesResult, invoicesResult] = await Promise.all([
        //   quotesPromise,
        //   invoicesPromise
        // ]);

        // if (quotesResult.error) throw quotesResult.error;
        // if (invoicesResult.error) throw invoicesResult.error;

        // const quotes = (quotesResult.data || []).map(quote => ({
        //   id: quote.id,
        //   title: quote.quote_number,
        //   customer_name: quote.customer_name,
        //   total: quote.total,
        //   created_at: quote.created_at,
        //   due_date: quote.expiry_date,
        //   status: quote.status,
        //   pipeline_stage: quote.pipeline_stage,
        //   type: 'quote' as const
        // }));

        // const invoices = (invoicesResult.data || []).map(invoice => ({
        //   id: invoice.id,
        //   title: invoice.invoice_number,
        //   customer_name: invoice.customer_name,
        //   total: invoice.total,
        //   created_at: invoice.created_at,
        //   due_date: invoice.due_date,
        //   status: invoice.status,
        //   pipeline_stage: invoice.pipeline_stage,
        //   type: 'invoice' as const
        // }));

        // setPipelineItems([...quotes, ...invoices]);
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

  // Filter and sort pipeline items
  const filteredItems = pipelines
    .filter(item => {
      // Stage filter
      if (selectedStage && item.stage !== selectedStage) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.customers?.name.toLowerCase().includes(searchLower) ||
          item.customers?.company?.toLowerCase().includes(searchLower) ||
          item.customers?.email?.toLowerCase().includes(searchLower) ||
          item.customers?.phone?.toLowerCase().includes(searchLower) ||
          item.customers?.title?.toLowerCase().includes(searchLower) ||
          item.closing_probability?.toLowerCase().includes(searchLower) ||
          item.dollar_value.toLowerCase().includes(searchLower) ||
          item.final_status?.toLowerCase().includes(searchLower)
        );
      }

      // Date range filter
      if (dateRange !== 'all') {
        const itemDate = new Date(item.created_at);
        const now = new Date();

        switch (dateRange) {
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            return itemDate >= weekStart;

          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return itemDate >= monthStart;

          case 'quarter':
            const quarterStart = new Date(now);
            quarterStart.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
            return itemDate >= quarterStart;

          case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return itemDate >= yearStart;

          case 'ytd':
            const ytdStart = new Date(now.getFullYear(), 0, 1);
            return itemDate >= ytdStart;

          case 'custom':
            const startDate = customDateRange.start ? new Date(customDateRange.start) : null;
            const endDate = customDateRange.end ? new Date(customDateRange.end) : null;

            if (startDate && endDate) {
              return itemDate >= startDate && itemDate <= endDate;
            }
            return true;

          default:
            return true;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc'
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return sortOrder === 'desc'
          ? Number(b.dollar_value) - Number(a.dollar_value)
          : Number(a.dollar_value) - Number(b.dollar_value);
      }
    });

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
      <div className="card bg-dark-800 border border-dark-700">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search deals..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="ytd">Year to Date</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateRange === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({
                    ...prev,
                    start: e.target.value
                  }))}
                />
                <input
                  type="date"
                  className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({
                    ...prev,
                    end: e.target.value
                  }))}
                />
              </div>
            )}

            <button
              className="btn btn-secondary flex items-center space-x-2"
              onClick={() => {
                if (sortBy === 'date') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('date');
                  setSortOrder('desc');
                }
              }}
            >
              <Calendar size={16} />
              <ChevronDown
                size={16}
                className={`transform transition-transform ${sortBy === 'date' && sortOrder === 'asc' ? 'rotate-180' : ''
                  }`}
              />
            </button>

            <button
              className="btn btn-secondary flex items-center space-x-2"
              onClick={() => {
                if (sortBy === 'value') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('value');
                  setSortOrder('desc');
                }
              }}
            >
              <DollarSign size={16} />
              <ChevronDown
                size={16}
                className={`transform transition-transform ${sortBy === 'value' && sortOrder === 'asc' ? 'rotate-180' : ''
                  }`}
              />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Deal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stage</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredItems.map((item) => (
                <tr key={`${item.stage}-${item.id}`} className="hover:bg-dark-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link
                      to={`/${item.stage}s/${item.id}`}
                      className="text-white hover:text-primary-400"
                    >
                      {item.stage}
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                    {item.customers?.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${item.stage === 'closed_won' ? 'bg-green-900/30 text-green-400' :
                        // item.pipeline_stage === 'closed_lost' ? 'bg-red-900/30 text-red-400' :
                        //   item.pipeline_stage === 'invoice_pending' ? 'bg-purple-900/30 text-purple-400' :
                        //     item.pipeline_stage === 'invoice_sent' ? 'bg-orange-900/30 text-orange-400' :
                        //       item.pipeline_stage === 'quote' ? 'bg-yellow-900/30 text-yellow-400' :
                        item.stage === 'opportunity' ? 'bg-blue-900/30 text-blue-400' :
                          'bg-gray-900/30 text-gray-400'
                      }`}>
                      {item.stage.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-gray-300">
                    ${item.dollar_value.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                    {item.closing_date ? new Date(item.closing_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="text-gray-600 mb-4 mx-auto" />
              <p className="text-gray-400 text-lg mb-2">No deals found</p>
              <p className="text-gray-500 text-sm">
                Try adjusting your filters or create a new deal
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pipeline;