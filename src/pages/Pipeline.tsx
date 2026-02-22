import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import { useQuoteStore } from '@/stores/quoteStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useCustomerStore } from '@/stores/customerStore';
import {
  Plus, Search, FileText, DollarSign, TrendingUp,
  LayoutGrid, List, Columns, MoreVertical, Send, Mouse, Zap,
  ChevronLeft, ChevronRight, Trash2, ArrowRightCircle, MessageSquare
} from 'lucide-react';
import { Card, PageContainer, IconBadge } from '@/components/theme/ThemeComponents';
import { FilterBar } from '@/components/shared/FilterBar';
import { ResizableTable, ColumnDef } from '@/components/compact/ResizableTable';
import { usePipelineConfigStore } from '../stores/pipelineConfigStore';
import { useDealStore } from '../stores/dealStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { usePageLabels } from '@/hooks/usePageLabels';
import { useMemo } from 'react';
import { DashboardStatsSkeleton, TableSkeleton } from '@/components/ui/skeletons';
import QuickAddDealModal from '@/components/pipeline/QuickAddDealModal';
import SendSMSModal from '@/components/sms/SendSMSModal';
import { smsService } from '@/services/sms.service';
import { usePermissions } from '@/hooks/usePermissions';
import { Lock } from 'lucide-react';

interface PipelineItem {
  id: string;
  type: 'quote' | 'invoice' | 'deal';
  number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  stage: string;
  probability: number;
}

type ViewMode = 'kanban' | 'table' | 'split';
type SortField = 'customer' | 'amount' | 'stage' | 'probability' | 'date';
type SortDirection = 'asc' | 'desc';



const Pipeline: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { quotes, fetchQuotes } = useQuoteStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { deals, fetchDeals, deleteDeal, moveDealToStage } = useDealStore();
  const { currentOrganization, loading: orgLoading, demoMode, _hasHydrated } = useOrganizationStore();
  const { stages: configStages, fetchPipelineStages, getStageColor: getStageColorFromStore, getStageByKey } = usePipelineConfigStore();
  const { canAccessSharedModule } = usePermissions();
  const labels = usePageLabels('pipeline');
  const quotesLabels = usePageLabels('quotes');

  const hasAccess = canAccessSharedModule('pipeline');

  // Helper to display stage label instead of raw key
  const getStageLabel = (stageKey: string): string => {
    const stage = getStageByKey(stageKey);
    return stage?.stage_label || stageKey.replace(/_/g, ' ');
  };

  const STAGES = useMemo(() => {
    if (configStages.length === 0) {
      return [
        { id: 'lead', name: 'Lead', probability: 10, color: 'bg-gray-100 text-gray-700', isTerminal: false },
        { id: 'qualified', name: 'Qualified', probability: 25, color: 'bg-blue-100 text-blue-700', isTerminal: false },
        { id: 'proposal', name: 'Proposal', probability: 50, color: 'bg-purple-100 text-purple-700', isTerminal: false },
        { id: 'negotiation', name: 'Negotiation', probability: 75, color: 'bg-amber-100 text-amber-700', isTerminal: false },
        { id: 'closed_won', name: 'Won', probability: 100, color: 'bg-green-100 text-green-700', isTerminal: true },
        { id: 'closed_lost', name: 'Lost', probability: 0, color: 'bg-red-100 text-red-700', isTerminal: true },
      ];
    }
    return configStages.map(s => ({
      id: s.stage_key,
      name: s.stage_label,
      probability: s.default_probability,
      color: `${s.color_bg} ${s.color_text}`,
      isTerminal: s.is_terminal
    }));
  }, [configStages]);

  const getStageColor = (stage: string) => {
    const colors = getStageColorFromStore(stage);
    return `${colors.bg} ${colors.text}`;
  };

  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterValueMin, setFilterValueMin] = useState('');
  const [smsTarget, setSmsTarget] = useState<{
    phone: string;
    name: string;
    customerId: string;
    stageName: string;
  } | null>(null);

  // Stage tab scroll
  const stageTabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = stageTabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = stageTabsRef.current;
    if (!el) return;
    checkScrollability();
    el.addEventListener('scroll', checkScrollability, { passive: true });
    const ro = new ResizeObserver(checkScrollability);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScrollability); ro.disconnect(); };
  }, [checkScrollability, STAGES]);

  const scrollStages = (direction: 'left' | 'right') => {
    const el = stageTabsRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);

      // Fetch from Supabase if organization is available
      if (currentOrganization?.id) {
        try {
          await Promise.all([
            fetchQuotes(currentOrganization.id),
            fetchInvoices(currentOrganization.id),
            fetchCustomers(),
            fetchDeals()
          ]);
        } catch (error) {
          if (!mounted) return;
          console.error('[Pipeline] Data fetch error:', error);
        }
      }
      if (mounted) setLoading(false);
    };

    // Only load data when organization is available
    if (currentOrganization?.id || demoMode) {
      loadData();
      fetchPipelineStages();
    }

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Zustand store functions are stable refs; only re-fetch on org change
  }, [currentOrganization?.id, demoMode]);

  useEffect(() => {
    if (quotes.length > 0 || invoices.length > 0 || deals.length > 0) {
      const pipelineItems: PipelineItem[] = [];

      // Add Deals
      deals.forEach((deal: any) => {
        const customer = customers.find(c => c.id === deal.customer_id);
        pipelineItems.push({
          id: deal.id,
          type: 'deal',
          number: deal.title || 'Untitled Deal',
          customer_id: deal.customer_id,
          customer_name: customer?.name || deal.customers?.name || 'Unknown',
          customer_email: customer?.email || deal.customers?.email || '',
          total_amount: Number(deal.value || 0),
          status: deal.final_status || 'open',
          created_at: deal.created_at,
          stage: deal.stage || 'lead',
          probability: deal.probability || 0,
        });
      });

      quotes?.forEach(quote => {
        if (['sent', 'viewed', 'draft'].includes(quote.status)) {
          const customer = customers.find(c => c.id === quote.customer_id);
          pipelineItems.push({
            id: quote.id,
            type: 'quote',
            number: quote.quote_number,
            customer_name: customer?.name || 'Unknown',
            customer_email: customer?.email || '',
            total_amount: quote.total_amount,
            status: quote.status,
            created_at: quote.created_at,
            stage: 'proposal',
            probability: 50,
          });
        }
      });

      invoices.forEach(invoice => {
        if (['sent', 'viewed', 'draft'].includes(invoice.status)) {
          const customer = customers.find(c => c.id === invoice.customer_id);
          pipelineItems.push({
            id: invoice.id,
            type: 'invoice',
            number: invoice.invoice_number,
            customer_name: customer?.name || 'Unknown',
            customer_email: customer?.email || '',
            total_amount: invoice.total_amount,
            status: invoice.status,
            created_at: invoice.created_at,
            stage: 'negotiation',
            probability: 75,
          });
        } else if (invoice.status === 'paid') {
          const customer = customers.find(c => c.id === invoice.customer_id);
          pipelineItems.push({
            id: invoice.id,
            type: 'invoice',
            number: invoice.invoice_number,
            customer_name: customer?.name || 'Unknown',
            customer_email: customer?.email || '',
            total_amount: invoice.total_amount,
            status: invoice.status,
            created_at: invoice.created_at,
            stage: 'won',
            probability: 100,
          });
        }
      });

      pipelineItems.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(pipelineItems);
    }
  }, [quotes, invoices, deals, customers]);

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = selectedStage === 'all' || item.stage === selectedStage;

    // Date range filter
    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const itemDate = new Date(item.created_at);
      const now = new Date();
      switch (filterDateRange) {
        case 'today':
          matchesDate = itemDate.toDateString() === now.toDateString();
          break;
        case '7d':
          matchesDate = itemDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          matchesDate = itemDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          matchesDate = itemDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'ytd':
          matchesDate = itemDate >= new Date(now.getFullYear(), 0, 1);
          break;
      }
    }

    // Value range filter
    let matchesValue = true;
    if (filterValueMin && filterValueMin !== 'all') {
      const amount = item.total_amount;
      switch (filterValueMin) {
        case 'under_1k': matchesValue = amount < 1000; break;
        case '1k_10k': matchesValue = amount >= 1000 && amount < 10000; break;
        case '10k_50k': matchesValue = amount >= 10000 && amount < 50000; break;
        case '50k_100k': matchesValue = amount >= 50000 && amount < 100000; break;
        case '100k_500k': matchesValue = amount >= 100000 && amount < 500000; break;
        case 'over_500k': matchesValue = amount >= 500000; break;
      }
    }

    return matchesSearch && matchesStage && matchesDate && matchesValue;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'customer':
        comparison = a.customer_name.localeCompare(b.customer_name);
        break;
      case 'amount':
        comparison = a.total_amount - b.total_amount;
        break;
      case 'stage':
        comparison = a.stage.localeCompare(b.stage);
        break;
      case 'probability':
        comparison = a.probability - b.probability;
        break;
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalValue = filteredItems.reduce((sum, item) => sum + item.total_amount, 0);
  const weightedValue = filteredItems.reduce((sum, item) => sum + (item.total_amount * item.probability), 0);

  const groupedByStage = STAGES.map(stage => ({
    ...stage,
    items: filteredItems.filter(item => item.stage === stage.id),
  }));

  const pipelineColumns: ColumnDef<PipelineItem>[] = [
    {
      id: 'deal',
      header: labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1),
      defaultWidth: 250,
      minWidth: 200,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${item.type === 'quote' ? 'bg-purple-500' : 'bg-blue-500'}`} />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {item.number}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {item.type}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'customer',
      header: labels.columns?.customer || 'Customer',
      defaultWidth: 200,
      minWidth: 150,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {item.customer_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {item.customer_email}
          </p>
        </div>
      ),
    },
    {
      id: 'amount',
      header: labels.columns?.value || 'Amount',
      defaultWidth: 120,
      minWidth: 100,
      render: (item) => (
        <div className="text-right font-bold text-gray-900 dark:text-white">
          ${item.total_amount.toLocaleString()}
        </div>
      ),
    },
    {
      id: 'stage',
      header: 'Stage',
      defaultWidth: 140,
      minWidth: 100,
      render: (item) => (
        <div className="flex justify-center">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStageColor(item.stage)}`}>
            {item.stage}
          </span>
        </div>
      ),
    },
    {
      id: 'probability',
      header: 'Probability',
      defaultWidth: 160,
      minWidth: 120,
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${item.probability >= 75 ? 'bg-green-500' :
                item.probability >= 50 ? 'bg-blue-500' :
                  item.probability >= 25 ? 'bg-orange-500' : 'bg-gray-400'
                }`}
              style={{ width: `${item.probability}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
            {Math.round(item.probability)}%
          </span>
        </div>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      defaultWidth: 120,
      minWidth: 100,
      render: (item) => (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
          {new Date(item.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      defaultWidth: 100,
      minWidth: 80,
      render: (item) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${item.type === 'quote' ? 'quotes' : 'invoices'}/${item.id}`);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-blue-600"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // More actions
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-gray-600"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (!hasAccess) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Lock size={40} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Locked</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            Your administrator has disabled sharing for this module.
            Only owners and administrators can access it while sharing is disabled.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {labels.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {labels.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 ${viewMode === 'kanban'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`hidden md:flex px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all items-center gap-2 ${viewMode === 'table'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:flex px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all items-center gap-2 ${viewMode === 'split'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Split</span>
            </button>
          </div>

          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm active:scale-95"
          >
            <Zap className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/pipeline/new')}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{labels.newButton}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<FileText size={20} className="text-blue-600" />}
            gradient="bg-blue-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{labels.stats?.total || 'Total Items'}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{filteredItems.length}</h3>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<DollarSign size={20} className="text-green-600" />}
            gradient="bg-green-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{labels.stats?.totalRevenue || 'Total Value'}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">${totalValue.toLocaleString()}</h3>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4 p-4 h-24">
          <IconBadge
            icon={<TrendingUp size={20} className="text-purple-600" />}
            gradient="bg-purple-50"
            size="md"
          />
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{labels.stats?.outstanding || 'Weighted Value'}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">${Math.round(weightedValue).toLocaleString()}</h3>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative flex items-center max-w-full min-w-0">
          {canScrollLeft && (
            <button
              onClick={() => scrollStages('left')}
              className="absolute left-0 z-10 p-1 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors -ml-1"
              aria-label="Scroll stages left"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div
            ref={stageTabsRef}
            className={`flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto scrollbar-hide ${canScrollLeft ? 'ml-6' : ''} ${canScrollRight ? 'mr-6' : ''}`}
          >
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${selectedStage === 'all'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              All Stages
            </button>
            {STAGES.map(stage => (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${selectedStage === stage.id
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                {stage.name}
              </button>
            ))}
          </div>
          {canScrollRight && (
            <button
              onClick={() => scrollStages('right')}
              className="absolute right-0 z-10 p-1 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors -mr-1"
              aria-label="Scroll stages right"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xl md:ml-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        dateRange={{
          value: filterDateRange,
          onChange: setFilterDateRange,
        }}
        filters={[
          {
            id: 'value_range',
            label: 'Value Range',
            options: [
              { value: 'under_1k', label: 'Under $1,000' },
              { value: '1k_10k', label: '$1,000 - $10,000' },
              { value: '10k_50k', label: '$10,000 - $50,000' },
              { value: '50k_100k', label: '$50,000 - $100,000' },
              { value: '100k_500k', label: '$100,000 - $500,000' },
              { value: 'over_500k', label: 'Over $500,000' },
            ],
            value: filterValueMin,
            onChange: setFilterValueMin,
          },
        ]}
        onClearAll={() => {
          setFilterDateRange('all');
          setFilterValueMin('');
        }}
      />

      {/* Views */}
      {(!_hasHydrated || loading || orgLoading || (!currentOrganization && !demoMode)) ? (
        <div className="space-y-6">
          <DashboardStatsSkeleton />
          <TableSkeleton rows={8} />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className={`w-16 h-16 mx-auto mb-4 ${theme === 'soft-modern' ? '' : 'text-gray-400 dark:text-gray-500'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined} />
          <h3 className={`text-xl font-semibold mb-2 ${theme === 'soft-modern' ? '' : 'text-gray-900 dark:text-white'}`} style={theme === 'soft-modern' ? { color: '#2D2D2D' } : undefined}>
            {selectedStage !== 'all'
              ? `No ${labels.entityPlural} in ${getStageLabel(selectedStage)}`
              : labels.emptyStateTitle}
          </h3>
          <p className={`mb-6 ${theme === 'soft-modern' ? '' : 'text-gray-600 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#6B6B6B' } : undefined}>
            {selectedStage !== 'all'
              ? `There are no ${labels.entityPlural} currently in the ${getStageLabel(selectedStage)} stage`
              : labels.emptyStateDescription}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowQuickAdd(true)}
              className={theme === 'soft-modern' ? "px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2" : "px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center gap-2"}
              style={theme === 'soft-modern' ? {
                background: 'linear-gradient(135deg, #A8C5E8, #90B5D8)',
                color: 'white',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.08)'
              } : undefined}
            >
              <Zap size={18} />
              Quick Add {labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1)}
            </button>
            <button
              onClick={() => navigate('/dashboard/pipeline/new')}
              className={theme === 'soft-modern' ? "px-6 py-3 rounded-xl font-medium transition-all border-2" : "px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"}
              style={theme === 'soft-modern' ? {
                borderColor: 'rgba(168, 197, 232, 0.5)',
                color: '#4A5F80',
              } : undefined}
            >
              <Plus size={18} />
              {labels.emptyStateButton}
            </button>
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        <ResizableTable
          columns={pipelineColumns}
          data={sortedItems}
          onRowClick={(item) => navigate(`/${item.type === 'quote' ? 'quotes' : 'invoices'}/${item.id}`)}
          onSort={(id) => handleSort(id as any)}
          sortColumn={sortField}
          sortDirection={sortDirection}
          storageKey="pipeline-table-v1"
        />
      ) : viewMode === 'split' ? (
        <div className="grid grid-cols-12 gap-6" style={{ height: 'calc(100vh - 400px)' }}>
          <div className="col-span-12 lg:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">All {labels.entityPlural.charAt(0).toUpperCase() + labels.entityPlural.slice(1)} ({filteredItems.length})</h3>
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
              {sortedItems.map(item => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => setSelectedItem(item)}
                  className={`px-6 py-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all ${selectedItem?.id === item.id
                    ? 'bg-gray-100 dark:bg-gray-700 border-l-4 border-l-blue-600 dark:border-l-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        {item.customer_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.number}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${item.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${getStageColor(item.stage)}`}>
                      {getStageLabel(item.stage)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(item.probability)}% probability
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            {selectedItem ? (
              <div className="h-full overflow-y-auto">
                <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {selectedItem.type === 'invoice' ? 'Invoice' : selectedItem.type === 'deal' ? labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1) : quotesLabels.entitySingular.charAt(0).toUpperCase() + quotesLabels.entitySingular.slice(1)}
                      </p>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedItem.customer_name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedItem.customer_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{labels.columns?.value || 'Value'}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${selectedItem.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${getStageColor(selectedItem.stage)}`}>
                      {getStageLabel(selectedItem.stage)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${selectedItem.probability}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {Math.round(selectedItem.probability)}% probability
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      {labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1)} Information
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Number</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedItem.number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {selectedItem.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(selectedItem.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedItem.type === 'invoice' ? 'Invoice' : selectedItem.type === 'deal' ? labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1) : quotesLabels.entitySingular.charAt(0).toUpperCase() + quotesLabels.entitySingular.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      {labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1)} Timeline
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1)} Created</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(selectedItem.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {selectedItem.status === 'sent' && (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">Sent to Customer</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(selectedItem.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (selectedItem.type === 'deal' && selectedItem.customer_id) {
                          navigate(`/dashboard/customers/${selectedItem.customer_id}`);
                        } else if (selectedItem.type === 'quote') {
                          navigate(`/quotes/${selectedItem.id}`);
                        } else {
                          navigate(`/invoices/${selectedItem.id}`);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {selectedItem.type === 'deal' ? 'Customer Details' : selectedItem.type === 'quote' ? 'Quote Details' : 'Invoice Details'}
                    </button>
                    <button
                      onClick={() => {
                        if (selectedItem.type === 'deal') {
                          navigate(`/dashboard/pipeline/new?edit=${selectedItem.id}`);
                        } else if (selectedItem.type === 'quote') {
                          navigate(`/quotes/builder/${selectedItem.id}`);
                        } else {
                          navigate(`/invoices/builder/${selectedItem.id}`);
                        }
                      }}
                      className="px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                    >
                      Edit
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowItemMenu(!showItemMenu)}
                        className="p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      {showItemMenu && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                          {selectedItem.type === 'deal' && STAGES.filter(s => s.id !== selectedItem.stage).slice(0, 4).map(stage => (
                            <button
                              key={stage.id}
                              onClick={async () => {
                                moveDealToStage(selectedItem.id, stage.id as any);
                                setShowItemMenu(false);
                                // Check if pipeline SMS is enabled and trigger SMS modal
                                try {
                                  const settings = await smsService.getSMSSettings(currentOrganization!.id);
                                  if (settings?.pipeline_sms_enabled) {
                                    const stages = settings.pipeline_stages_to_notify || [];
                                    if (stages.length === 0 || stages.includes(stage.id)) {
                                      const customer = customers.find(c => c.id === selectedItem.customer_id);
                                      if (customer?.phone) {
                                        setSmsTarget({
                                          phone: customer.phone,
                                          name: customer.name,
                                          customerId: customer.id,
                                          stageName: stage.name,
                                        });
                                      }
                                    }
                                  }
                                } catch { /* SMS check failed silently */ }
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <ArrowRightCircle size={14} />
                              Move to {stage.name}
                            </button>
                          ))}
                          <button
                            onClick={async () => {
                              if (confirm(`Delete this ${labels.entitySingular}?`)) {
                                if (selectedItem.type === 'deal') {
                                  await deleteDeal(selectedItem.id);
                                }
                                setSelectedItem(null);
                                setShowItemMenu(false);
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div>
                  <Mouse className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Select a {labels.entitySingular}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Click a {labels.entitySingular} from the list to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {groupedByStage.map(stage => (
            <div key={stage.id}>
              <Card className="p-4 min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${theme === 'soft-modern' ? '' : 'text-gray-900 dark:text-white'}`} style={theme === 'soft-modern' ? { color: '#2D2D2D' } : undefined}>
                      {stage.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${theme === 'soft-modern' ? '' : stage.color}`} style={theme === 'soft-modern' ? {
                      background: 'rgba(168, 197, 232, 0.2)',
                      color: '#4A5F80'
                    } : undefined}>
                      {stage.items.length}
                    </span>
                  </div>
                  <span className={`text-xs ${theme === 'soft-modern' ? '' : 'text-gray-500 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined}>
                    {stage.probability}%
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {stage.items.length === 0 ? (
                    <div className={`text-center py-8 border-2 border-dashed rounded-lg ${theme === 'soft-modern' ? '' : 'border-gray-200 dark:border-gray-700'}`} style={theme === 'soft-modern' ? {
                      borderColor: 'rgba(203, 213, 225, 0.3)'
                    } : undefined}>
                      <p className={`text-sm ${theme === 'soft-modern' ? '' : 'text-gray-500 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined}>
                        No items
                      </p>
                    </div>
                  ) : (
                    stage.items.map(item => (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => navigate(`/${item.type === 'quote' ? 'quotes' : item.type === 'invoice' ? 'invoices' : 'dashboard/pipeline'}/${item.id}`)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === 'soft-modern'
                          ? ''
                          : (theme === 'dark' || theme === 'midnight')
                            ? 'bg-gray-700 border-gray-600 hover:border-blue-500'
                            : 'bg-white border-gray-200 hover:border-blue-500'
                          }`}
                        style={theme === 'soft-modern' ? {
                          background: 'rgba(255, 255, 255, 0.6)',
                          border: '2px solid rgba(255, 255, 255, 0.8)',
                          boxShadow: '2px 2px 4px rgba(0,0,0,0.06)',
                        } : undefined}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.type === 'quote' ? (theme === 'soft-modern' ? '' : 'bg-blue-100 text-blue-700') :
                            item.type === 'invoice' ? (theme === 'soft-modern' ? '' : 'bg-purple-100 text-purple-700') :
                              (theme === 'soft-modern' ? '' : 'bg-indigo-100 text-indigo-700')
                            }`} style={theme === 'soft-modern' ? {
                              background: item.type === 'quote' ? 'rgba(168, 197, 232, 0.3)' :
                                item.type === 'invoice' ? 'rgba(201, 184, 212, 0.3)' :
                                  'rgba(99, 102, 241, 0.2)',
                              color: item.type === 'quote' ? '#4A5F80' :
                                item.type === 'invoice' ? '#7A6050' :
                                  '#6366F1'
                            } : undefined}>
                            {item.type === 'quote' ? quotesLabels.entitySingular.charAt(0).toUpperCase() + quotesLabels.entitySingular.slice(1) : item.type === 'invoice' ? 'Invoice' : labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1)}
                          </span>
                          <span className={`text-xs ${theme === 'soft-modern' ? '' : 'text-gray-500 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined}>
                            {item.number}
                          </span>
                        </div>

                        <h4 className={`font-semibold mb-1 ${theme === 'soft-modern' ? '' : 'text-gray-900 dark:text-white'}`} style={theme === 'soft-modern' ? { color: '#2D2D2D' } : undefined}>
                          {item.customer_name}
                        </h4>
                        <p className={`text-sm mb-3 ${theme === 'soft-modern' ? '' : 'text-gray-600 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#6B6B6B' } : undefined}>
                          {item.customer_email}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className={`text-lg font-bold ${theme === 'soft-modern' ? '' : 'text-gray-900 dark:text-white'}`} style={theme === 'soft-modern' ? { color: '#2D2D2D' } : undefined}>
                            ${item.total_amount.toLocaleString()}
                          </span>
                          <span className={`text-xs ${theme === 'soft-modern' ? '' : 'text-gray-500 dark:text-gray-400'}`} style={theme === 'soft-modern' ? { color: '#9CA3AF' } : undefined}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Deal Modal */}
      <QuickAddDealModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />

      {/* SMS Modal triggered on pipeline stage change */}
      <SendSMSModal
        isOpen={!!smsTarget}
        onClose={() => setSmsTarget(null)}
        customerPhone={smsTarget?.phone}
        customerName={smsTarget?.name}
        customerId={smsTarget?.customerId}
        preselectedTemplate="pipeline_change"
        context={{ stageName: smsTarget?.stageName || '' }}
      />
    </PageContainer>
  );
};

export default Pipeline;
