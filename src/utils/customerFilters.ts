import type { Customer, TeamWithMembers } from '@/types/database.types';
import { getCustomerFullName } from './customer.utils';

export type OwnershipFilter = string; // 'all' | 'mine' | 'team:<id>' | <userId>
export type TypeFilter    = 'all' | 'personal' | 'business';
export type StatusFilter  = 'all' | 'Active' | 'Inactive';
export type DateFilter    = 'all' | 'today' | '7d' | '30d' | '90d' | 'ytd';

export function filterCustomers(
  customers: Customer[],
  searchTerm: string,
  filterType: TypeFilter,
  filterStatus: StatusFilter,
  filterDateRange: DateFilter | string,
  ownershipFilter: OwnershipFilter,
  currentUserId: string | null,
  teams: TeamWithMembers[],
): Customer[] {
  const term = searchTerm.toLowerCase();

  return customers.filter(customer => {
    // --- Ownership ---
    let matchesOwnership = true;
    if (ownershipFilter === 'mine') {
      matchesOwnership = customer.assigned_to === currentUserId;
    } else if (ownershipFilter === 'all') {
      matchesOwnership = true;
    } else if (ownershipFilter.startsWith('team:')) {
      const teamId = ownershipFilter.replace('team:', '');
      const team = teams.find(t => t.id === teamId);
      const teamUserIds = new Set(team ? team.team_members.map(m => m.user_id) : []);
      matchesOwnership = customer.assigned_to ? teamUserIds.has(customer.assigned_to) : false;
    } else {
      matchesOwnership = customer.assigned_to === ownershipFilter;
    }

    // --- Search ---
    const fullName = getCustomerFullName(customer);
    const matchesSearch = !term || (
      fullName.toLowerCase().includes(term) ||
      customer.name?.toLowerCase().includes(term) ||
      customer.first_name?.toLowerCase().includes(term) ||
      customer.last_name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.includes(searchTerm) ||
      customer.company?.toLowerCase().includes(term)
    );

    // --- Type ---
    const matchesType = filterType === 'all' || customer.customer_type === filterType;

    // --- Status ---
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;

    // --- Date ---
    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const custDate = new Date(customer.created_at);
      const now = new Date();
      switch (filterDateRange) {
        case 'today': matchesDate = custDate.toDateString() === now.toDateString(); break;
        case '7d':    matchesDate = custDate >= new Date(now.getTime() - 7  * 86400000); break;
        case '30d':   matchesDate = custDate >= new Date(now.getTime() - 30 * 86400000); break;
        case '90d':   matchesDate = custDate >= new Date(now.getTime() - 90 * 86400000); break;
        case 'ytd':   matchesDate = custDate >= new Date(now.getFullYear(), 0, 1); break;
      }
    }

    return matchesOwnership && matchesSearch && matchesType && matchesStatus && matchesDate;
  });
}
