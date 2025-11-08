import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, DollarSign, Filter, Search, ArrowUpRight,
  ArrowDownRight, ChevronDown, Calendar, Clock, Filter as FilterIcon
} from 'lucide-react';
import { PipelineItem } from '../../types/database.types';

interface PipelineItemsTableProps {
  items: PipelineItem[];
}

const PipelineItemsTable: React.FC<PipelineItemsTableProps> = ({ items }) => {
  //const { user } = useAuthStore();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [percentageRange, setPercentageRange] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort pipeline items
  const filteredItems = items
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

      if (percentageRange == '') {
        return true;
      } else {
        switch (percentageRange) {
          case '20': return item.closing_probability == 'Preapproval - 20%';
          case '40': return item.closing_probability == 'Approved Preapproval - 40%';
          case '60': return item.closing_probability == 'Live Deal - 60%';
          case '80': return item.closing_probability == 'Approved Live Deal - 80%';
          default: return true;
        }
      }
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

  return (
    <div className="space-y-6">

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

          {/* Pipeline Item Filters */}
          <div className="flex gap-2">
            <select
              className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
              value={percentageRange}
              onChange={(e) => setPercentageRange(e.target.value)}
            >
              <option value="all">All</option>
              <option value="20">Preapproval - 20%</option>
              <option value="40">Approved Preapproval - 40%</option>
              <option value="60">Live Deal - 60%</option>
              <option value="80">Approved Live Deal - 80%</option>
            </select>

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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Probability</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredItems.map((item) => (
                <tr key={`${item.stage}-${item.id}`} className="hover:bg-dark-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link
                      to={`/${item.stage}/${item.id}`}
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
                    ${//item.stage === 'closed_won' ? 'bg-green-900/30 text-green-400' :
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
                    ${Number(item.dollar_value).toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-300 ">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${item.stage === 'opportunity' ? 'bg-green-900/30 text-green-400' : ''}`}>
                      {item?.closing_probability}
                    </span>
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

export default PipelineItemsTable;