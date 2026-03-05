import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCustomerStore } from '../customerStore';
import { useOrganizationStore } from '../organizationStore';
import { supabase } from '@/lib/supabase';
import type { Customer, CustomerContact, CustomerNote, CustomerFile } from '@/types/database.types';
import { filterCustomers } from '@/utils/customerFilters';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const baseCustomer: Omit<Customer, 'id' | 'name' | 'first_name' | 'last_name' | 'email'> = {
  organization_id: 'org-001',
  middle_name: null,
  phone: null,
  address: null,
  city: null,
  state: null,
  postal_code: null,
  country: 'CA',
  company: null,
  title: null,
  type: 'Individual',
  priority: 'Medium',
  status: 'Active',
  notes: null,
  total_spent: 0,
  last_purchase: null,
  custom_fields: {},
  tags: [],
  created_by: null,
  assigned_to: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

const mockCustomer: Customer = {
  id: 'cust-001',
  organization_id: 'org-001',
  name: 'Jane Doe',
  first_name: 'Jane',
  middle_name: null,
  last_name: 'Doe',
  email: 'jane@example.com',
  phone: null,
  address: null,
  city: null,
  state: null,
  postal_code: null,
  country: 'CA',
  company: null,
  title: null,
  type: 'Individual',
  priority: 'Medium',
  status: 'Active',
  notes: null,
  total_spent: 0,
  last_purchase: null,
  custom_fields: {},
  tags: [],
  created_by: null,
  assigned_to: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('customerStore', () => {
  beforeEach(() => {
    useCustomerStore.getState().reset();
  });

  // -------------------------------------------------------------------------
  // Clients list
  // -------------------------------------------------------------------------
  describe('clients list', () => {
    it('starts with no clients', () => {
      const { customers } = useCustomerStore.getState();
      expect(customers).toEqual([]);
    });

    it('filterCustomers finds only the matching customer out of two', () => {
      // Arrange: seed store with two customers with distinctive names
      const alice: Customer = { ...baseCustomer, id: 'c-alice', name: 'Alice Johnson', first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com' };
      const bob: Customer   = { ...baseCustomer, id: 'c-bob',   name: 'Bob Smith',    first_name: 'Bob',   last_name: 'Smith',   email: 'bob@example.com' };
      useCustomerStore.setState({ customers: [alice, bob] });

      const { customers } = useCustomerStore.getState();

      // Sanity check: both are present
      expect(customers).toHaveLength(2);

      // Act: use the real filter function from customerFilters.ts
      const results = filterCustomers(customers, 'Alice', 'all', 'all', 'all', 'all', null, []);

      // Assert: only Alice matches
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
    });

    it('has exactly one client after adding one', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCustomer, error: null }),
      } as any);

      await useCustomerStore.getState().createCustomer({
        organization_id: 'org-001',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      });

      const { customers } = useCustomerStore.getState();
      expect(customers).toHaveLength(1);
      expect(customers[0].name).toBe('Jane Doe');
      expect(customers[0].email).toBe('jane@example.com');
    });
  });

  // -------------------------------------------------------------------------
  // Add customer
  // -------------------------------------------------------------------------
  describe('add customer', () => {
    const makeMock = (data: Customer) =>
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data, error: null }),
      } as any);

    it('returned customer has the correct fields', async () => {
      makeMock(mockCustomer);

      const result = await useCustomerStore.getState().createCustomer({
        organization_id: 'org-001',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      });

      expect(result?.id).toBe('cust-001');
      expect(result?.name).toBe('Jane Doe');
      expect(result?.email).toBe('jane@example.com');
      expect(result?.status).toBe('Active');
      expect(result?.priority).toBe('Medium');
      expect(result?.country).toBe('CA');
    });

    it('new customer appears at the top of the list', async () => {
      // Seed one existing customer directly
      const existing: Customer = { ...baseCustomer, id: 'old-001', name: 'Old Customer', first_name: 'Old', last_name: 'Customer', email: 'old@example.com' };
      useCustomerStore.setState({ customers: [existing] });

      makeMock(mockCustomer);

      await useCustomerStore.getState().createCustomer({
        organization_id: 'org-001',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      });

      const { customers } = useCustomerStore.getState();
      expect(customers).toHaveLength(2);
      expect(customers[0].name).toBe('Jane Doe');   // newest first
      expect(customers[1].name).toBe('Old Customer');
    });

    it('adding two customers results in two in the store', async () => {
      const second: Customer = { ...mockCustomer, id: 'cust-002', name: 'Bob Smith', first_name: 'Bob', last_name: 'Smith', email: 'bob@example.com' };

      makeMock(mockCustomer);
      await useCustomerStore.getState().createCustomer({ organization_id: 'org-001', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' });

      makeMock(second);
      await useCustomerStore.getState().createCustomer({ organization_id: 'org-001', first_name: 'Bob', last_name: 'Smith', email: 'bob@example.com' });

      expect(useCustomerStore.getState().customers).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Retrieve customer
  // -------------------------------------------------------------------------
  describe('retrieve customer', () => {
    beforeEach(() => {
      useCustomerStore.setState({ customers: [mockCustomer] });
    });

    describe('getCustomerById (from local store state)', () => {
      it('returns the correct customer when it exists', () => {
        const result = useCustomerStore.getState().getCustomerById('cust-001');

        expect(result).toBeDefined();
        expect(result?.id).toBe('cust-001');
        expect(result?.name).toBe('Jane Doe');
      });

      it('returns undefined for a non-existent id', () => {
        const result = useCustomerStore.getState().getCustomerById('does-not-exist');

        expect(result).toBeUndefined();
      });
    });

    describe('fetchCustomerById (from Supabase)', () => {
      beforeEach(() => {
        useOrganizationStore.setState({ currentOrganization: { id: 'org-001' } as any });
      });

      it('loads the customer into currentCustomer', async () => {
        vi.mocked(supabase.from).mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockCustomer, error: null }),
        } as any);

        await useCustomerStore.getState().fetchCustomerById('cust-001');

        const { currentCustomer } = useCustomerStore.getState();
        expect(currentCustomer).not.toBeNull();
        expect(currentCustomer?.id).toBe('cust-001');
        expect(currentCustomer?.name).toBe('Jane Doe');
      });

      it('sets currentCustomer to null when id is not found', async () => {
        vi.mocked(supabase.from).mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

        await useCustomerStore.getState().fetchCustomerById('no-such-id');

        expect(useCustomerStore.getState().currentCustomer).toBeNull();
      });

      it('sets an error and does nothing when no org is selected', async () => {
        useOrganizationStore.setState({ currentOrganization: null as any });

        await useCustomerStore.getState().fetchCustomerById('cust-001');

        expect(useCustomerStore.getState().error).toBe('No organization selected');
        expect(useCustomerStore.getState().currentCustomer).toBeNull();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Contact information
  // -------------------------------------------------------------------------
  describe('contact information', () => {
    const mockContact: CustomerContact = {
      id: 'contact-001',
      customer_id: 'cust-001',
      name: 'John Doe',
      title: 'Manager',
      email: 'john@example.com',
      phone: '+1-555-0100',
      is_primary: true,
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    };

    it('addContact adds a new contact to the store', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContact, error: null }),
      } as any);

      await useCustomerStore.getState().addContact({ customer_id: 'cust-001', name: 'John Doe' });

      const { contacts } = useCustomerStore.getState();
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('John Doe');
      expect(contacts[0].is_primary).toBe(true);
    });

    it('fetchContacts loads contacts into store', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContact], error: null }),
      } as any);

      await useCustomerStore.getState().fetchContacts('cust-001');

      const { contacts } = useCustomerStore.getState();
      expect(contacts).toHaveLength(1);
      expect(contacts[0].email).toBe('john@example.com');
    });

    it('updateContact reflects the change in the store', async () => {
      useCustomerStore.setState({ contacts: [mockContact] });
      const updated: CustomerContact = { ...mockContact, title: 'Director' };

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      } as any);

      await useCustomerStore.getState().updateContact('contact-001', { title: 'Director' });

      expect(useCustomerStore.getState().contacts[0].title).toBe('Director');
    });

    it('deleteContact removes the contact from the store', async () => {
      useCustomerStore.setState({ contacts: [mockContact] });
      useOrganizationStore.setState({ currentOrganization: { id: 'org-001' } as any });

      // First call: verify customer belongs to org
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'cust-001' }, error: null }),
      } as any);

      // Second call: delete the contact row
      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then(resolve: any, reject: any) {
          return Promise.resolve({ error: null }).then(resolve, reject);
        },
      } as any);

      await useCustomerStore.getState().deleteContact('contact-001', 'cust-001');

      expect(useCustomerStore.getState().contacts).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Communication — notes
  // -------------------------------------------------------------------------
  describe('communication — notes', () => {
    const mockNote: CustomerNote = {
      id: 'note-001',
      organization_id: 'org-001',
      customer_id: 'cust-001',
      user_id: null,
      note_type: 'call',
      content: 'Discussed renewal options',
      is_pinned: false,
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    };

    beforeEach(() => {
      useOrganizationStore.setState({ currentOrganization: { id: 'org-001' } as any });
    });

    it('addNote adds a note to the store', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
      } as any);

      await useCustomerStore.getState().addNote({
        customer_id: 'cust-001',
        note_type: 'call',
        content: 'Discussed renewal options',
      });

      const { notes } = useCustomerStore.getState();
      expect(notes).toHaveLength(1);
      expect(notes[0].content).toBe('Discussed renewal options');
      expect(notes[0].note_type).toBe('call');
    });

    it('fetchNotes loads notes into store', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockNote], error: null }),
      } as any);

      await useCustomerStore.getState().fetchNotes('cust-001');

      const { notes } = useCustomerStore.getState();
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('note-001');
    });

    it('updateNote edits the note content in the store', async () => {
      useCustomerStore.setState({ notes: [mockNote] });
      const updated: CustomerNote = { ...mockNote, content: 'Follow-up scheduled' };

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      } as any);

      await useCustomerStore.getState().updateNote('note-001', { content: 'Follow-up scheduled' });

      expect(useCustomerStore.getState().notes[0].content).toBe('Follow-up scheduled');
    });

    it('deleteNote removes the note from the store', async () => {
      useCustomerStore.setState({ notes: [mockNote] });

      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then(resolve: any, reject: any) {
          return Promise.resolve({ error: null }).then(resolve, reject);
        },
      } as any);

      await useCustomerStore.getState().deleteNote('note-001');

      expect(useCustomerStore.getState().notes).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Documents (files)
  // -------------------------------------------------------------------------
  describe('documents', () => {
    const mockFile: CustomerFile = {
      id: 'file-001',
      organization_id: 'org-001',
      customer_id: 'cust-001',
      uploaded_by: null,
      file_name: 'contract.pdf',
      file_url: 'https://storage.example.com/contract.pdf',
      file_type: 'application/pdf',
      file_size: 204800,
      created_at: '2026-03-01T00:00:00Z',
    };

    it('fetchFiles loads files into store', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockFile], error: null }),
      } as any);

      await useCustomerStore.getState().fetchFiles('cust-001');

      const { files } = useCustomerStore.getState();
      expect(files).toHaveLength(1);
      expect(files[0].file_name).toBe('contract.pdf');
      expect(files[0].file_type).toBe('application/pdf');
    });

    it('fetchFiles results in empty array when customer has no documents', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      await useCustomerStore.getState().fetchFiles('cust-001');

      expect(useCustomerStore.getState().files).toHaveLength(0);
    });
  });
});
