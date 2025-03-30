import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';

const PipelineDetail: React.FC = () => {
  const { stage } = useParams<{ stage: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalValue: 0,
    dealCount: 0,
    avgDealSize: 0,
    conversionRate: 0
  });

  useEffect(() => {
    const loadPipelineDetails = async () => {
      try {
        setLoading(true);

        // Get quotes in this stage
        const quotesPromise = supabase
          .from('quotes')
          .select('*')
          .eq('user_id', user?.id)
          .eq('pipeline_stage', stage)
          .not('status', 'in', '(Declined,Expired)');

        // Get invoices in this stage
        const invoicesPromise = supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user?.id)
          .eq('pipeline_stage', stage)
          .neq('status', 'Cancelled');

        const [quotesResult, invoicesResult] = await Promise.all([
          quotesPromise,
          invoicesPromise
        ]);

        if (quotesResult.error) throw quotesResult.error;
        if (invoicesResult.error) throw invoicesResult.error;

        const quotes = (quotesResult.data || []).map(quote => ({
          ...quote,
          type: 'quote'
        }));

        const invoices = (invoicesResult.data || []).map(invoice => ({
          ...invoice,
          type: 'invoice'
        }));

        const allDeals = [...quotes, ...invoices];
        setDeals(allDeals);

        // Calculate stats
        const totalValue = allDeals.reduce((sum, deal) => sum + deal.total, 0);
        const dealCount = allDeals.length;
        
        setStats({
          totalValue,
          dealCount,
          avgDealSize: dealCount > 0 ? totalValue / dealCount : 0,
          conversionRate: stage === 'closed_won' ? (dealCount / totalValue) * 100 : 0
        });

      } catch (error) {
        console.error('Error loading pipeline details:', error);
        toast.error('Failed to load pipeline details');
      } finally {
        setLoading(false);
      }
    };

    loadPipelineDetails();
  }, [stage, user?.id]);

  const getStageName = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'closed_won':
        return 'bg-green-900/30 text-green-400';
      case 'closed_lost':
        return 'bg-red-900/30 text-red-400';
      case 'invoice_pending':
        return 'bg-purple-900/30 text-purple-400';
      case 'invoice_sent':
        return 'bg-orange-900/30 text-orange-400';
      case 'quote':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'opportunity':
        return 'bg-blue-900/30 text-blue-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-400">Loading pipeline details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/pipeline" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {getStageName(stage || '')}
          </h1>
          <p className="text-gray-400">Pipeline Stage Details</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Value</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${stats.totalValue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-500">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Number of Deals</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {stats.dealCount}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Average Deal Size</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${stats.avgDealSize.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-500">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Conversion Rate</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {stats.conversionRate.toFixed(1)}%
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-500">
              <FileText size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="card bg-dark-800 border border-dark-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Deal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {deals.map((deal) => (
                <tr key={`${deal.type}-${deal.id}`} className="hover:bg-dark-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link 
                      to={`/${deal.type}s/${deal.id}`}
                      className="text-white hover:text-primary-400"
                    >
                      {deal.type === 'quote' ? deal.quote_number : deal.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                    {deal.customer_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-gray-300">
                    ${deal.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                    {deal.due_date ? new Date(deal.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(stage || '')}`}>
                      {deal.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {deals.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="text-gray-600 mb-4 mx-auto" />
              <p className="text-gray-400 text-lg mb-2">No deals found</p>
              <p className="text-gray-500 text-sm">
                There are no deals in this pipeline stage
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineDetail;