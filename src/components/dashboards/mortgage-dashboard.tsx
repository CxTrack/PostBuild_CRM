import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  Download,
  ChevronDown,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Search,
  FileText,
  Users,
  CheckCircle
} from 'lucide-react';
import { Deal } from '../../types/mortgage-financial';
import { financialService } from '../../services/mortgageDashboardService';

const MortgageDashboard: React.FC = () => {
  // Helper functions - moved to top to avoid hoisting issues
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleDealClick = (deal: Deal) => {
    // Navigate to opportunity detail - you can implement this navigation
    console.log('Navigate to opportunity:', deal.opportunityId);
    // Example: setSelectedOpportunity(deal.opportunityId);
  };

  const [selectedDateRange, setSelectedDateRange] = useState('YTD');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Get real financial data from service
  const financialData = financialService.calculateFinancialData();
  const kpiData = {
    grossCommission: financialData.grossCommission,
    netCommission: financialData.netCommission,
    averageCommission: financialData.averageCommission,
    totalDeals: financialData.totalDeals
  };

  const monthlyData = financialData.monthlyData;

  const dealTypeData = [
    { type: 'Purchase', commission: 28500, deals: 7 },
    { type: 'Refinance', commission: 12750, deals: 3 },
    { type: 'HELOC', commission: 4500, deals: 2 }
  ];

  const splitDistribution = [
    { label: 'Your Take-Home', value: 83.6, amount: 38250 },
    { label: 'Principal Broker', value: 16.4, amount: 7500 }
  ];

  const pipelineData = {
    totalValue: 2400000,
    projectedCommission: 24000,
    stageBreakdown: [
      { stage: 'Leads', value: 1200000, deals: 8 },
      { stage: 'Opportunities', value: 600000, deals: 2 },
      { stage: 'Qualified', value: 400000, deals: 2 },
      { stage: 'Proposal', value: 200000, deals: 1 }
    ]
  };

  const recentDeals = financialData.recentDeals;

  const dateRangeOptions = ['YTD', 'Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last Year', 'Custom Range'];
  const yearOptions = ['2024', '2023', '2022', '2021'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
          </div>
          <p className="text-slate-300 text-lg">Track your commission earnings and financial performance</p>
        </div>
        {/* <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm text-white rounded-xl border border-slate-600/50 hover:scale-105 transition-all duration-300 font-semibold shadow-lg hover:shadow-green-500/25"
            >
              <Calendar className="w-4 h-4" />
              {selectedDateRange}
              <ChevronDown className={`w-4 h-4 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-2xl z-50">
                <div className="p-2">
                  {dateRangeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedDateRange(option);
                        setShowDateDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 font-medium ${
                        selectedDateRange === option
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                          : 'text-slate-200 hover:bg-gradient-to-r hover:from-slate-700/60 hover:to-slate-600/60 hover:text-white hover:scale-105'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/25">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div> */}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl hover:shadow-green-500/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-400">
              <TrendingUp className="w-4 h-4" />
              +12% vs last period
            </div>
          </div>
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wide">Gross Commission (YTD)</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              {formatCurrency(kpiData.grossCommission)}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              +8% vs last period
            </div>
          </div>
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wide">Net Commission (YTD)</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
              {formatCurrency(kpiData.netCommission)}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl hover:shadow-teal-500/10 hover:border-teal-500/30 transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wide">Average Commission per Deal</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              {formatCurrency(kpiData.averageCommission)}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-blue-400">
              <TrendingUp className="w-4 h-4" />
              +3 this month
            </div>
          </div>
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wide">Total Deals Closed</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              {kpiData.totalDeals}
            </div>
          </div>
        </div>
      </div>

      {/* Commission Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend Chart */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="h-96 relative overflow-hidden">
            <div className="h-full flex items-end justify-between gap-2 px-4" onMouseMove={handleMouseMove}>
              {monthlyData.map((data, index) => (
                <div 
                  key={data.month} 
                  className="flex-1 flex flex-col items-center gap-2 relative"
                  onMouseEnter={() => setHoveredMonth(data.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  <div className="w-full flex flex-col gap-1">
                    {/* Calculate proportional heights based on data values */}
                    {(() => {
                      const maxValue = Math.max(...monthlyData.map(d => Math.max(d.gross, d.net)));
                      const grossHeight = Math.max((data.gross / maxValue) * 280, 8); // Minimum 8px height
                      const netHeight = Math.max((data.net / maxValue) * 280, 8); // Minimum 8px height
                      
                      return (
                        <>
                    <div 
                      className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                      style={{ height: `${grossHeight}px` }}
                      title={`Gross: ${formatCurrency(data.gross)}`}
                    />
                    <div 
                      className="bg-gradient-to-t from-green-600 to-green-400 transition-all duration-500 hover:brightness-110 cursor-pointer"
                      style={{ height: `${netHeight}px` }}
                      title={`Net: ${formatCurrency(data.net)}`}
                    />
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-sm text-white font-semibold bg-slate-800/80 px-2 py-1 rounded">{data.month}</div>
                </div>
              ))}
            </div>
            
            {/* Tooltip - positioned within card boundaries */}
            {hoveredMonth && (
              <div 
                className="absolute z-50 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl p-4 shadow-2xl pointer-events-none max-w-xs"
                style={{ 
                  left: Math.min(Math.max(mousePosition.x - 320, 20), 300), // Keep within card bounds
                  top: Math.min(Math.max(mousePosition.y - 680, 20), 280), // Keep within card bounds
                }}
              >
                <div className="text-white font-semibold text-lg mb-2">{hoveredMonth} 2024</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
                    <span className="text-slate-200 text-sm">Gross:</span>
                    <span className="text-blue-300 font-bold text-sm">
                      {formatCurrency(monthlyData.find(m => m.month === hoveredMonth)?.gross || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-600 to-green-400 rounded"></div>
                    <span className="text-slate-200 text-sm">Net:</span>
                    <span className="text-green-300 font-bold text-sm">
                      {formatCurrency(monthlyData.find(m => m.month === hoveredMonth)?.net || 0)}
                    </span>
                  </div>
                  <div className="border-t border-slate-600/50 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm">Split:</span>
                      <span className="text-orange-300 font-bold text-sm">
                        {formatCurrency((monthlyData.find(m => m.month === hoveredMonth)?.gross || 0) - (monthlyData.find(m => m.month === hoveredMonth)?.net || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                <LineChart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Monthly Commission Trend</h3>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-600/50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded shadow-lg"></div>
                <span className="text-white text-base font-semibold">Gross Commission</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-600 to-green-400 rounded shadow-lg"></div>
                <span className="text-white text-base font-semibold">Net Commission</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commission by Deal Type */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
          <div className="p-8 border-b border-slate-600/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Commission by Deal Type</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {dealTypeData.map((deal, index) => {
                const colors = ['from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-purple-500 to-pink-500'];
                const percentage = (deal.commission / kpiData.grossCommission) * 100;
                
                return (
                  <div key={deal.type} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded bg-gradient-to-r ${colors[index]} shadow-lg`}></div>
                        <span className="text-white font-semibold text-lg">{deal.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-lg">{formatCurrency(deal.commission)}</div>
                        <div className="text-slate-400 text-sm">{deal.deals} deals</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-600/50 rounded-full h-3 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${colors[index]} transition-all duration-500 shadow-lg`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-slate-300 text-sm font-medium">{percentage.toFixed(1)}% of total commission</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Commission Split Distribution */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-8 border-b border-slate-600/50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Commission Split Distribution</h2>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              {splitDistribution.map((split, index) => {
                const colors = ['from-green-500 to-emerald-500', 'from-orange-500 to-amber-500'];
                
                return (
                  <div key={split.label} className="flex items-center gap-4 p-6 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-[1.02] shadow-lg">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${colors[index]} shadow-lg`}></div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-xl mb-1">{split.label}</div>
                      <div className="text-slate-200 font-medium">{formatCurrency(split.amount)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {split.value.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center">
              <div className="relative w-64 h-64">
                <svg width="256" height="256" className="transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray={`${splitDistribution[0].value * 6.28} ${(100 - splitDistribution[0].value) * 6.28}`}
                    className="opacity-80"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray={`${splitDistribution[1].value * 6.28} ${(100 - splitDistribution[1].value) * 6.28}`}
                    strokeDashoffset={`-${splitDistribution[0].value * 6.28}`}
                    className="opacity-80"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">Total</div>
                    <div className="text-slate-300 text-sm">{formatCurrency(kpiData.grossCommission)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Value Section */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-8 border-b border-slate-600/50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Pipeline Value</h2>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm border border-slate-600/30 shadow-lg">
                <div className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wide">Total Pipeline Value</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  {formatCurrency(pipelineData.totalValue)}
                </div>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm border border-slate-600/30 shadow-lg">
                <div className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wide">Projected Commission</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {formatCurrency(pipelineData.projectedCommission)}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-xl mb-4">Deals by Stage</h3>
                {pipelineData.stageBreakdown.map((stage, index) => {
                  const colors = ['from-orange-500 to-amber-500', 'from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-purple-500 to-pink-500'];
                  const percentage = (stage.value / pipelineData.totalValue) * 100;
                  
                  return (
                    <div key={stage.stage} className="p-6 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-[1.02] shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded bg-gradient-to-r ${colors[index]} shadow-lg`}></div>
                          <span className="text-white font-semibold text-lg">{stage.stage}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-lg">{formatCurrency(stage.value)}</div>
                          <div className="text-slate-400 text-sm">{stage.deals} deals</div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-600/50 rounded-full h-3 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${colors[index]} transition-all duration-500 shadow-lg`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-slate-300 text-sm font-medium mt-2">{percentage.toFixed(1)}% of pipeline</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal History Table */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-8 border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Recent Closed Deals</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  className="pl-10 pr-4 py-3 bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm text-white rounded-xl border border-slate-600/50 focus:border-blue-500/50 focus:outline-none w-64 shadow-lg transition-all duration-300"
                />
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm text-white rounded-xl border border-slate-600/50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm border-b border-slate-600/50">
              <tr>
                <th className="text-left px-8 py-6 text-slate-200 font-semibold text-sm uppercase tracking-wider">
                  Client Name
                </th>
                <th className="text-left px-8 py-6 text-slate-200 font-semibold text-sm uppercase tracking-wider">
                  Close Date
                </th>
                <th className="text-left px-8 py-6 text-slate-200 font-semibold text-sm uppercase tracking-wider">
                  Loan Amount
                </th>
                <th className="text-left px-8 py-6 text-slate-200 font-semibold text-sm uppercase tracking-wider">
                  Gross Commission
                </th>
                <th className="text-left px-8 py-6 text-slate-200 font-semibold text-sm uppercase tracking-wider">
                  Split %
                </th>
                <th className="text-left px-8 py-6 text-slate-200 font-semibold text-sm uppercase tracking-wider">
                  Take-Home
                </th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-slate-700/50 hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-slate-600/30 transition-all duration-300 cursor-pointer"
                  onClick={() => handleDealClick(deal)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold text-lg hover:text-blue-400 transition-colors">{deal.clientName}</div>
                        <div className="text-slate-400 text-sm">Click to view opportunity details</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-slate-200 font-medium text-base">{formatDate(deal.closeDate)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-white font-bold text-lg">{formatCurrency(deal.loanAmount)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-green-300 font-bold text-lg">{formatCurrency(deal.grossCommission)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30">
                      {deal.splitPercent}%
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-emerald-300 font-bold text-lg">{formatCurrency(deal.takeHome)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual Income Tracker */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-8 border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Annual Income Tracker</h2>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm text-white rounded-xl border border-slate-600/50 hover:scale-105 transition-all duration-300 font-semibold shadow-lg hover:shadow-amber-500/25"
              >
                {selectedYear}
                <ChevronDown className={`w-4 h-4 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showYearDropdown && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-2xl z-50">
                  <div className="p-2">
                    {yearOptions.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 font-medium ${
                          selectedYear === year
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                            : 'text-slate-200 hover:bg-gradient-to-r hover:from-slate-700/60 hover:to-slate-600/60 hover:text-white hover:scale-105'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="p-8 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm border border-slate-600/30 shadow-lg">
              <div className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wide">Gross Income ({selectedYear})</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                {formatCurrency(kpiData.grossCommission)}
              </div>
              <div className="text-green-400 text-sm font-semibold">+12% vs previous year</div>
            </div>
            <div className="p-8 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm border border-slate-600/30 shadow-lg">
              <div className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wide">Net Income ({selectedYear})</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                {formatCurrency(kpiData.netCommission)}
              </div>
              <div className="text-emerald-400 text-sm font-semibold">+8% vs previous year</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm rounded-xl border border-slate-600/30 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-600/30">
              <h3 className="text-white font-semibold text-xl">Monthly Breakdown - {selectedYear}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border-b border-slate-600/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-slate-200 font-semibold text-sm uppercase tracking-wider">Month</th>
                    <th className="text-left px-6 py-4 text-slate-200 font-semibold text-sm uppercase tracking-wider">Gross Income</th>
                    <th className="text-left px-6 py-4 text-slate-200 font-semibold text-sm uppercase tracking-wider">Net Income</th>
                    <th className="text-left px-6 py-4 text-slate-200 font-semibold text-sm uppercase tracking-wider">Deals Closed</th>
                    <th className="text-left px-6 py-4 text-slate-200 font-semibold text-sm uppercase tracking-wider">Tax Estimate</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month, index) => (
                    <tr key={month.month} className="border-b border-slate-700/50 hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-slate-600/30 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="text-white font-semibold">{month.month}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-green-300 font-bold">{formatCurrency(month.gross)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-emerald-300 font-bold">{formatCurrency(month.net)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-200 font-medium">{Math.floor(Math.random() * 3) + 1}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-400 font-medium">Coming Soon</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageDashboard;
