import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Users, Building2, Mail, Phone,
  Eye, Edit, Trash2, MessageSquare, X,
  ChevronLeft, ChevronRight, UserCheck, ChevronDown
} from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { useThemeStore } from '@/stores/themeStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useTeamStore } from '@/stores/teamStore';
import { supabase } from '@/lib/supabase';
import CustomerModal from '@/components/customers/CustomerModal';
import SendSMSModal from '@/components/sms/SendSMSModal';
import { getCustomerFullName } from '@/utils/customer.utils';
import { formatPhoneDisplay } from '@/utils/phone.utils';
import { Card, Button, PageContainer } from '@/components/theme/ThemeComponents';
import { FilterBar } from '@/components/shared/FilterBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { CustomerTableSkeleton } from '@/components/ui/TableSkeleton';
import { usePageLabels } from '@/hooks/usePageLabels';
import SettingsPopover from '@/components/settings/SettingsPopover';
import CustomFieldsPanel from '@/components/settings/CustomFieldsPanel';
import CSVImporter from '@/components/import/CSVImporter';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import BusinessCardCapture from '@/components/customers/BusinessCardCapture';
import { usePermissions } from '@/hooks/usePermissions';
import { Lock } from 'lucide-react';

export const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'business'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [smsTarget, setSmsTarget] = useState<{ phone: string; name: string; id: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all'); // 'mine' | 'all' | userId | 'team:teamId'
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<string>('');
  const [showReassignDropdown, setShowReassignDropdown] = useState(false);
  const [bulkReassigning, setBulkReassigning] = useState(false);

  const { currentOrganization, currentMembership, teamMembers, _hasHydrated } = useOrganizationStore();
  const { customers, loading, fetchCustomers, deleteCustomer, deleteCustomers, bulkReassignCustomers } = useCustomerStore();
  const { teams, fetchTeams } = useTeamStore();
  const { theme } = useThemeStore();
  const { confirm, DialogComponent } = useConfirmDialog();
  const { canAccessSharedModule } = usePermissions();
  const labels = usePageLabels('crm');

  // Determine current user id
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Set default ownership filter based on role
  useEffect(() => {
    if (currentMembership && currentUserId) {
      const role = currentMembership.role;
      if (role === 'user') {
        setOwnershipFilter('mine');
      } else {
        setOwnershipFilter('all');
      }
    }
  }, [currentMembership?.role, currentUserId]);

  const isManagerOrAbove = currentMembership?.role === 'owner' || currentMembership?.role === 'admin' || currentMembership?.role === 'manager';

  const hasAccess = canAccessSharedModule('crm');

  // Business card scanner handler
  const [prefillData, setPrefillData] = useState<any>(null);

  const handleCardExtracted = (contact: any, imageUrl: string) => {
    setPrefillData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      address: contact.address || '',
      city: contact.city || '',
      state: contact.state || '',
      postal_code: contact.postal_code || '',
      country: contact.country || '',
      card_image_url: imageUrl,
    });
    setShowCustomerModal(true);
  };

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchCustomers();
      fetchTeams();
    }
  }, [currentOrganization?.id]);

  // Get user IDs for team filtering
  const getTeamUserIds = (teamId: string): Set<string> => {
    const team = teams.find(t => t.id === teamId);
    return new Set(team ? team.team_members.map(m => m.user_id) : []);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Ownership filter
      let matchesOwnership = true;
      if (ownershipFilter === 'mine') {
        matchesOwnership = customer.assigned_to === currentUserId;
      } else if (ownershipFilter === 'all') {
        matchesOwnership = true;
      } else if (ownershipFilter.startsWith('team:')) {
        const teamId = ownershipFilter.replace('team:', '');
        const teamUserIds = getTeamUserIds(teamId);
        matchesOwnership = customer.assigned_to ? teamUserIds.has(customer.assigned_to) : false;
      } else {
        // Specific user ID
        matchesOwnership = customer.assigned_to === ownershipFilter;
      }

      const fullName = getCustomerFullName(customer);
      const matchesSearch =
        fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.first_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.phone?.includes(debouncedSearchTerm) ||
        customer.company?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesType = filterType === 'all' || customer.customer_type === filterType;
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;

      let matchesDate = true;
      if (filterDateRange !== 'all') {
        const custDate = new Date(customer.created_at);
        const now = new Date();
        switch (filterDateRange) {
          case 'today': matchesDate = custDate.toDateString() === now.toDateString(); break;
          case '7d': matchesDate = custDate >= new Date(now.getTime() - 7 * 86400000); break;
          case '30d': matchesDate = custDate >= new Date(now.getTime() - 30 * 86400000); break;
          case '90d': matchesDate = custDate >= new Date(now.getTime() - 90 * 86400000); break;
          case 'ytd': matchesDate = custDate >= new Date(now.getFullYear(), 0, 1); break;
        }
      }

      return matchesOwnership && matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [customers, debouncedSearchTerm, filterType, filterStatus, filterDateRange, ownershipFilter, currentUserId, teams]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterType, filterStatus, filterDateRange, pageSize, ownershipFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const handleDelete = async (id: string) => {
    if (currentMembership?.role !== 'owner' && currentMembership?.role !== 'admin') {
      toast.error(`You do not have permission to delete ${labels.entityPlural}`);
      return;
    }
    const confirmed = await confirm({
      title: `Delete ${labels.entitySingular}`,
      message: `Are you sure you want to delete this ${labels.entitySingular}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
    });

    if (confirmed) {
      try {
        await deleteCustomer(id);
        toast.success(`${labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1)} deleted successfully`);
      } catch (error) {
        toast.error(`Failed to delete ${labels.entitySingular}`);
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedCustomers.map((c) => c.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...pageIds]));
    }
  };

  const handleBulkDelete = async () => {
    if (currentMembership?.role !== 'owner' && currentMembership?.role !== 'admin') {
      toast.error(`You do not have permission to delete ${labels.entityPlural}`);
      return;
    }
    const count = selectedIds.size;
    const confirmed = await confirm({
      title: `Delete ${count} ${count === 1 ? labels.entitySingular : labels.entityPlural}`,
      message: `Are you sure you want to delete ${count} ${count === 1 ? labels.entitySingular : labels.entityPlural}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: `Delete ${count}`,
    });

    if (confirmed) {
      setBulkDeleting(true);
      try {
        const { succeeded, failed } = await deleteCustomers(Array.from(selectedIds));
        if (succeeded > 0) {
          toast.success(`Deleted ${succeeded} ${succeeded === 1 ? labels.entitySingular : labels.entityPlural}`);
        }
        if (failed > 0) {
          toast.error(`Failed to delete ${failed} ${failed === 1 ? labels.entitySingular : labels.entityPlural} (may have associated quotes or invoices)`);
        }
        setSelectedIds(new Set());
      } catch {
        toast.error(`Failed to delete ${labels.entityPlural}`);
      } finally {
        setBulkDeleting(false);
      }
    }
  };

  const handleBulkReassign = async (targetUserId: string) => {
    if (!isManagerOrAbove) {
      toast.error('You do not have permission to reassign');
      return;
    }
    setBulkReassigning(true);
    try {
      const { succeeded, failed } = await bulkReassignCustomers(Array.from(selectedIds), targetUserId);
      if (succeeded > 0) {
        const targetUser = teamMembers.find(m => m.id === targetUserId);
        toast.success(`Reassigned ${succeeded} ${succeeded === 1 ? labels.entitySingular : labels.entityPlural} to ${targetUser?.full_name || 'user'}`);
      }
      if (failed > 0) {
        toast.error(`Failed to reassign ${failed} ${failed === 1 ? labels.entitySingular : labels.entityPlural}`);
      }
      setSelectedIds(new Set());
      setShowReassignDropdown(false);
    } catch {
      toast.error('Failed to reassign');
    } finally {
      setBulkReassigning(false);
    }
  };

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
    <PageContainer>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {labels.subtitle}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center"
          >
            <Plus size={20} className="mr-2" />
            {labels.newButton}
          </Button>
          <div className="ml-2">
            <SettingsPopover
              onCustomFields={() => setShowCustomFields(true)}
              onImportCSV={() => setShowImporter(true)}
              onExportData={() => toast('Export feature coming soon', { icon: '🚧' })}
              onManageTags={() => toast('Tags management coming soon', { icon: '🚧' })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={labels.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={
                theme === 'soft-modern'
                  ? 'w-full pl-10 pr-4 py-2 bg-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] border-2 border-transparent focus:border-blue-500 transition-all text-gray-700 placeholder:text-gray-400'
                  : 'w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-white placeholder-gray-500'
              }
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setShowCustomerModal(true)}
            className="md:hidden p-2"
          >
            <Plus size={20} />
          </Button>
        </div>

        <FilterBar
          dateRange={{
            value: filterDateRange,
            onChange: setFilterDateRange,
          }}
          filters={[
            {
              id: 'type',
              label: 'Type',
              options: [
                { value: 'personal', label: 'Personal' },
                { value: 'business', label: 'Business' },
              ],
              value: filterType,
              onChange: (v) => setFilterType(v as any),
            },
            {
              id: 'status',
              label: 'Status',
              options: [
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ],
              value: filterStatus,
              onChange: (v) => setFilterStatus(v as any),
            },
          ]}
          onClearAll={() => {
            setFilterType('all');
            setFilterStatus('all');
            setFilterDateRange('all');
          }}
        />
      </Card>

      {/* Ownership Filter Pills */}
      <Card className="mb-4 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1 flex items-center">
            <UserCheck size={14} className="mr-1" />
            View:
          </span>
          <button
            onClick={() => setOwnershipFilter('mine')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              ownershipFilter === 'mine'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            My {labels.entityPlural}
          </button>
          <button
            onClick={() => setOwnershipFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              ownershipFilter === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All {labels.entityPlural}
          </button>
          {isManagerOrAbove && (
            <div className="relative">
              <button
                onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  ownershipFilter !== 'mine' && ownershipFilter !== 'all'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {ownershipFilter !== 'mine' && ownershipFilter !== 'all'
                  ? ownershipFilter.startsWith('team:')
                    ? teams.find(t => t.id === ownershipFilter.replace('team:', ''))?.name || 'Team'
                    : teamMembers.find(m => m.id === ownershipFilter)?.full_name || 'Person'
                  : 'Filter by...'}
                <ChevronDown size={12} />
              </button>
              {showOwnerDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  {teams.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                        Teams
                      </div>
                      {teams.map(team => (
                        <button
                          key={team.id}
                          onClick={() => { setOwnershipFilter(`team:${team.id}`); setShowOwnerDropdown(false); }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                          {team.name}
                          <span className="ml-auto text-xs text-gray-400">{team.team_members.length}</span>
                        </button>
                      ))}
                    </>
                  )}
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                    People
                  </div>
                  {teamMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => { setOwnershipFilter(member.id); setShowOwnerDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      {member.avatar_url ? (
                        <img src={member.avatar_url} className="w-5 h-5 rounded-full" alt="" />
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: member.color }}>
                          {(member.full_name || member.email)?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{member.full_name || member.email}</span>
                      {member.id === currentUserId && <span className="text-[10px] text-gray-400">(you)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {ownershipFilter !== 'mine' && ownershipFilter !== 'all' && (
            <button
              onClick={() => setOwnershipFilter('all')}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">{filteredCustomers.length}</span>
          </div>
          <div className="flex items-center">
            <Users size={16} className="text-blue-600 dark:text-blue-400 mr-1" />
            <span className="text-gray-600 dark:text-gray-400">Personal:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {filteredCustomers.filter(c => c.customer_type === 'personal').length}
            </span>
          </div>
          <div className="flex items-center">
            <Building2 size={16} className="text-purple-600 dark:text-purple-400 mr-1" />
            <span className="text-gray-600 dark:text-gray-400">Business:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {filteredCustomers.filter(c => c.customer_type === 'business').length}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex-1 overflow-y-auto">
        {(!_hasHydrated || loading) ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            <CustomerTableSkeleton />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Users size={40} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? labels.emptyStateTitle : `No ${labels.entityPlural} yet`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Try adjusting your search or filters'
                : labels.emptyStateDescription}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
              >
                {labels.emptyStateButton}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={paginatedCustomers.length > 0 && paginatedCustomers.every((c) => selectedIds.has(c.id))}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {labels.columns?.name}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {paginatedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedIds.has(customer.id) ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}
                      >
                        {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                          <td className="px-4 py-4 w-10">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(customer.id)}
                              onChange={() => toggleSelect(customer.id)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <Link
                            to={`/dashboard/customers/${customer.id}`}
                            className="flex items-center space-x-3 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold">
                              {customer.customer_type === 'business' ? (
                                <Building2 size={20} />
                              ) : (
                                getCustomerFullName(customer).charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                {getCustomerFullName(customer)}
                              </p>
                              {customer.company && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {customer.company}
                                </p>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${customer.customer_type === 'business'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                            }`}>
                            {customer.customer_type === 'business' ? (
                              <>
                                <Building2 size={12} className="mr-1" />
                                Business
                              </>
                            ) : (
                              <>
                                <Users size={12} className="mr-1" />
                                Personal
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Mail size={14} className="mr-2" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Phone size={14} className="mr-2" />
                                {formatPhoneDisplay(customer.phone)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${customer.status === 'Active'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {customer.assigned_user ? (
                            <div className="flex items-center gap-2">
                              {customer.assigned_user.avatar_url ? (
                                <img src={customer.assigned_user.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-700 dark:text-primary-400">
                                  {(customer.assigned_user.full_name || customer.assigned_user.email)?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                                {customer.assigned_user.full_name || customer.assigned_user.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                          ${customer.total_spent?.toLocaleString() || '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/dashboard/customers/${customer.id}`}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={18} />
                            </Link>
                            {customer.phone && (
                              <button
                                onClick={() => setSmsTarget({
                                  phone: customer.phone!,
                                  name: getCustomerFullName(customer),
                                  id: customer.id,
                                })}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="Send SMS"
                              >
                                <MessageSquare size={18} />
                              </button>
                            )}
                            <Link
                              to={`/dashboard/customers/${customer.id}`}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </Link>
                            {(currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
                              <button
                                onClick={() => handleDelete(customer.id)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Showing</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>of {filteredCustomers.length} {labels.entityPlural}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (currentMembership?.role === 'owner' || currentMembership?.role === 'admin') && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-2xl border border-gray-700 dark:border-gray-600">
                <span className="text-sm font-medium whitespace-nowrap">
                  {selectedIds.size} selected
                </span>
                {/* Reassign dropdown */}
                {isManagerOrAbove && (
                  <div className="relative">
                    <button
                      onClick={() => setShowReassignDropdown(!showReassignDropdown)}
                      disabled={bulkReassigning}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <UserCheck size={15} />
                      {bulkReassigning ? 'Reassigning...' : 'Reassign'}
                      <ChevronDown size={12} />
                    </button>
                    {showReassignDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                          Reassign to
                        </div>
                        {teamMembers.map(member => (
                          <button
                            key={member.id}
                            onClick={() => handleBulkReassign(member.id)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            {member.avatar_url ? (
                              <img src={member.avatar_url} className="w-5 h-5 rounded-full" alt="" />
                            ) : (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: member.color }}>
                                {(member.full_name || member.email)?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <span className="truncate">{member.full_name || member.email}</span>
                            {member.id === currentUserId && <span className="text-[10px] text-gray-400">(you)</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                  {bulkDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => { setSelectedIds(new Set()); setShowReassignDropdown(false); }}
                  className="p-1.5 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Clear selection"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="md:hidden space-y-4 px-4 pb-20">
              {paginatedCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  to={`/dashboard/customers/${customer.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${customer.customer_type === 'business'
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        }`}>
                        {customer.customer_type === 'business' ? (
                          <Building2 size={24} />
                        ) : (
                          getCustomerFullName(customer).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {getCustomerFullName(customer)}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.company || (customer.customer_type === 'personal' ? 'Individual' : 'Business')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${customer.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-gray-50 text-gray-700 border-gray-100'
                      }`}>
                      {customer.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Contact</p>
                      <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                        <Mail size={12} className="mr-1.5 text-blue-500" />
                        <span className="truncate">{customer.email || 'No email'}</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Spent</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ${customer.total_spent?.toLocaleString() || '0.00'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center -space-x-2">
                      {/* Subtle visual indicator or action shortcuts if needed */}
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-blue-100 flex items-center justify-center">
                        <Eye size={14} className="text-blue-600" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center">
                      View Profile
                      <Plus size={14} className="ml-1 rotate-45" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setPrefillData(null);
        }}
        customer={prefillData || undefined}
      />

      <CSVImporter
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onSuccess={() => {
          setShowImporter(false);
          fetchCustomers();
          toast.success('Import completed successfully');
        }}
      />

      <CustomFieldsPanel
        isOpen={showCustomFields}
        onClose={() => setShowCustomFields(false)}
        entityType="customer"
      />
      <DialogComponent />
      {/* Mobile Business Card Scanner FAB */}
      <BusinessCardCapture onContactExtracted={handleCardExtracted} />

      <SendSMSModal
        isOpen={!!smsTarget}
        onClose={() => setSmsTarget(null)}
        customerPhone={smsTarget?.phone || ''}
        customerName={smsTarget?.name || ''}
        customerId={smsTarget?.id}
      />
    </PageContainer>
  );
};
