import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  autoDetectMapping,
  getCRMFields,
  findDuplicates,
  transformRowToCustomer,
  validateImportData,
  computeCSVStats,
  prepareSampleRows,
  applyMappingSuggestions,
} from '../csv.utils';

describe('csv.utils', () => {
  // -----------------------------------------------------------------------
  // parseCSV
  // -----------------------------------------------------------------------
  describe('parseCSV', () => {
    it('parses basic comma-delimited CSV', () => {
      const csv = 'name,email,phone\nJohn Doe,john@example.com,6135551234\nJane Smith,jane@example.com,6135555678';
      const { headers, rows } = parseCSV(csv);
      expect(headers).toEqual(['name', 'email', 'phone']);
      expect(rows).toHaveLength(2);
      expect(rows[0].name).toBe('John Doe');
      expect(rows[0].email).toBe('john@example.com');
      expect(rows[1].name).toBe('Jane Smith');
    });

    it('handles quoted values with commas inside', () => {
      const csv = 'name,company\n"Smith, John","Acme, Inc."';
      const { rows } = parseCSV(csv);
      expect(rows[0].name).toBe('Smith, John');
      expect(rows[0].company).toBe('Acme, Inc.');
    });

    it('handles escaped quotes in quoted values', () => {
      const csv = 'name,note\nJohn,"He said ""hello"""';
      const { rows } = parseCSV(csv);
      expect(rows[0].note).toBe('He said "hello"');
    });

    it('handles semicolon-delimited CSV', () => {
      const csv = 'name;email;phone\nJohn;john@test.com;123';
      const { headers, rows } = parseCSV(csv);
      expect(headers).toEqual(['name', 'email', 'phone']);
      expect(rows[0].name).toBe('John');
    });

    it('handles tab-delimited CSV', () => {
      const csv = 'name\temail\tphone\nJohn\tjohn@test.com\t123';
      const { headers, rows } = parseCSV(csv);
      expect(headers).toEqual(['name', 'email', 'phone']);
      expect(rows[0].name).toBe('John');
    });

    it('handles Windows-style line endings (\\r\\n)', () => {
      const csv = 'name,email\r\nJohn,john@test.com\r\nJane,jane@test.com';
      const { rows } = parseCSV(csv);
      expect(rows).toHaveLength(2);
    });

    it('skips empty lines', () => {
      const csv = 'name,email\n\nJohn,john@test.com\n\n';
      const { rows } = parseCSV(csv);
      expect(rows).toHaveLength(1);
    });

    it('returns empty arrays for empty input', () => {
      const { headers, rows } = parseCSV('');
      expect(headers).toEqual([]);
      expect(rows).toEqual([]);
    });

    it('trims whitespace from headers and values', () => {
      const csv = ' name , email \nJohn , john@test.com ';
      const { headers, rows } = parseCSV(csv);
      expect(headers).toEqual(['name', 'email']);
      expect(rows[0].name).toBe('John');
      expect(rows[0].email).toBe('john@test.com');
    });
  });

  // -----------------------------------------------------------------------
  // autoDetectMapping
  // -----------------------------------------------------------------------
  describe('autoDetectMapping', () => {
    it('maps standard column names to CRM fields', () => {
      const mapping = autoDetectMapping(['email', 'phone', 'first_name', 'last_name', 'company']);
      expect(mapping.email).toBe('email');
      expect(mapping.phone).toBe('phone');
      expect(mapping.first_name).toBe('first_name');
      expect(mapping.last_name).toBe('last_name');
      expect(mapping.company).toBe('company');
    });

    it('maps aliased column names', () => {
      const mapping = autoDetectMapping(['E-Mail', 'Telephone', 'Full Name', 'Organization']);
      expect(mapping['E-Mail']).toBe('email');
      expect(mapping['Telephone']).toBe('phone');
      expect(mapping['Full Name']).toBe('name');
      expect(mapping['Organization']).toBe('company');
    });

    it('leaves unknown columns unmapped (empty string)', () => {
      const mapping = autoDetectMapping(['custom_field_xyz', 'email']);
      expect(mapping.custom_field_xyz).toBe('');
      expect(mapping.email).toBe('email');
    });

    it('handles case-insensitive matching', () => {
      const mapping = autoDetectMapping(['EMAIL', 'PHONE', 'COMPANY']);
      expect(mapping.EMAIL).toBe('email');
      expect(mapping.PHONE).toBe('phone');
      expect(mapping.COMPANY).toBe('company');
    });
  });

  // -----------------------------------------------------------------------
  // getCRMFields
  // -----------------------------------------------------------------------
  describe('getCRMFields', () => {
    it('returns all expected fields', () => {
      const fields = getCRMFields();
      const keys = fields.map(f => f.key);
      expect(keys).toContain('first_name');
      expect(keys).toContain('last_name');
      expect(keys).toContain('email');
      expect(keys).toContain('phone');
      expect(keys).toContain('company');
      expect(keys).toContain('address');
      expect(keys).toContain('city');
      expect(keys).toContain('state');
      expect(keys).toContain('postal_code');
      expect(keys).toContain('country');
    });

    it('every field has a label and group', () => {
      const fields = getCRMFields();
      for (const field of fields) {
        expect(field.label).toBeTruthy();
        expect(field.group).toBeTruthy();
      }
    });
  });

  // -----------------------------------------------------------------------
  // findDuplicates
  // -----------------------------------------------------------------------
  describe('findDuplicates', () => {
    const existingCustomers = [
      { id: '1', email: 'john@example.com', phone: '+16135551234', name: 'John' },
      { id: '2', email: 'jane@example.com', phone: '+16135555678', name: 'Jane' },
    ];

    it('detects email duplicates', () => {
      const rows = [
        { Email: 'john@example.com', Name: 'John Doe' },
        { Email: 'new@example.com', Name: 'New Person' },
      ];
      const mapping = { Email: 'email', Name: 'name' };
      const duplicates = findDuplicates(rows, mapping, existingCustomers);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].matchType).toBe('email');
      expect(duplicates[0].csvRowIndex).toBe(0);
    });

    it('detects phone duplicates', () => {
      const rows = [
        { Phone: '(613) 555-1234', Name: 'Someone' },
      ];
      const mapping = { Phone: 'phone', Name: 'name' };
      const duplicates = findDuplicates(rows, mapping, existingCustomers);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].matchType).toBe('phone');
    });

    it('returns empty array when no duplicates exist', () => {
      const rows = [
        { Email: 'unique@example.com', Phone: '9995551234' },
      ];
      const mapping = { Email: 'email', Phone: 'phone' };
      const duplicates = findDuplicates(rows, mapping, existingCustomers);
      expect(duplicates).toHaveLength(0);
    });

    it('email match takes priority over phone match for same row', () => {
      const rows = [
        { Email: 'john@example.com', Phone: '(613) 555-1234' },
      ];
      const mapping = { Email: 'email', Phone: 'phone' };
      const duplicates = findDuplicates(rows, mapping, existingCustomers);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].matchType).toBe('email');
    });
  });

  // -----------------------------------------------------------------------
  // transformRowToCustomer
  // -----------------------------------------------------------------------
  describe('transformRowToCustomer', () => {
    it('maps CSV columns to customer fields', () => {
      const row = { Name: 'John Doe', Email: 'john@example.com', Phone: '6135551234' };
      const mapping = { Name: 'name', Email: 'email', Phone: 'phone' };
      const customer = transformRowToCustomer(row, mapping);
      expect(customer.name).toBe('John Doe');
      expect(customer.email).toBe('john@example.com');
      expect(customer.phone).toBe('6135551234');
    });

    it('generates full name from first + last', () => {
      const row = { First: 'John', Last: 'Doe' };
      const mapping = { First: 'first_name', Last: 'last_name' };
      const customer = transformRowToCustomer(row, mapping);
      expect(customer.name).toBe('John Doe');
    });

    it('sets default values for missing fields', () => {
      const row = { Name: 'John' };
      const mapping = { Name: 'name' };
      const customer = transformRowToCustomer(row, mapping);
      expect(customer.status).toBe('Active');
      expect(customer.priority).toBe('Medium');
      expect(customer.total_spent).toBe(0);
      expect(customer.tags).toEqual([]);
    });

    it('detects customer_type from company presence', () => {
      const withCompany = transformRowToCustomer(
        { Name: 'John', Company: 'Acme' },
        { Name: 'name', Company: 'company' }
      );
      expect(withCompany.customer_type).toBe('business');

      const withoutCompany = transformRowToCustomer(
        { Name: 'John' },
        { Name: 'name' }
      );
      expect(withoutCompany.customer_type).toBe('personal');
    });

    it('splits tags on comma or semicolon', () => {
      const row = { Name: 'John', Tags: 'vip, new; important' };
      const mapping = { Name: 'name', Tags: 'tags' };
      const customer = transformRowToCustomer(row, mapping);
      expect(customer.tags).toEqual(['vip', 'new', 'important']);
    });

    it('ignores unmapped columns (empty string mapping)', () => {
      const row = { Name: 'John', CustomField: 'something' };
      const mapping = { Name: 'name', CustomField: '' };
      const customer = transformRowToCustomer(row, mapping);
      expect(customer.name).toBe('John');
      expect(customer.CustomField).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // validateImportData
  // -----------------------------------------------------------------------
  describe('validateImportData', () => {
    it('returns no errors for valid data', () => {
      const rows = [{ Email: 'john@example.com' }, { Email: 'jane@example.com' }];
      const mapping = { Email: 'email' };
      const errors = validateImportData(rows, mapping);
      expect(errors).toHaveLength(0);
    });

    it('catches invalid email format', () => {
      const rows = [{ Email: 'not-an-email' }, { Email: 'valid@example.com' }];
      const mapping = { Email: 'email' };
      const errors = validateImportData(rows, mapping);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].rowIndex).toBe(0);
    });

    it('ignores rows with empty email', () => {
      const rows = [{ Email: '' }, { Email: 'valid@example.com' }];
      const mapping = { Email: 'email' };
      const errors = validateImportData(rows, mapping);
      expect(errors).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // computeCSVStats
  // -----------------------------------------------------------------------
  describe('computeCSVStats', () => {
    it('computes null counts, unique counts, and sample values', () => {
      const rows = [
        { name: 'John', email: 'john@test.com', phone: '' },
        { name: 'Jane', email: 'jane@test.com', phone: '123' },
        { name: 'John', email: '', phone: '456' },
      ];
      const headers = ['name', 'email', 'phone'];
      const stats = computeCSVStats(rows, headers);

      expect(stats.nullCounts.name).toBe(0);
      expect(stats.nullCounts.email).toBe(1);
      expect(stats.nullCounts.phone).toBe(1);

      expect(stats.uniqueCounts.name).toBe(2); // John, Jane
      expect(stats.uniqueCounts.email).toBe(2);
      expect(stats.uniqueCounts.phone).toBe(2);

      expect(stats.sampleValues.name).toContain('John');
      expect(stats.sampleValues.name).toContain('Jane');
    });
  });

  // -----------------------------------------------------------------------
  // prepareSampleRows
  // -----------------------------------------------------------------------
  describe('prepareSampleRows', () => {
    it('returns all rows when 25 or fewer', () => {
      const rows = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
      expect(prepareSampleRows(rows)).toHaveLength(10);
    });

    it('returns first 20 + last 5 for large datasets', () => {
      const rows = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
      const sample = prepareSampleRows(rows);
      expect(sample).toHaveLength(25);
      expect(sample[0].id).toBe('0');
      expect(sample[19].id).toBe('19');
      expect(sample[20].id).toBe('95');
      expect(sample[24].id).toBe('99');
    });
  });

  // -----------------------------------------------------------------------
  // applyMappingSuggestions
  // -----------------------------------------------------------------------
  describe('applyMappingSuggestions', () => {
    it('applies accepted mapping suggestions', () => {
      const current = { Name: 'name', CustomCol: '' };
      const suggestions = [
        { csvHeader: 'CustomCol', suggestedCrmField: 'company', confidence: 0.9, reason: 'pattern match' },
      ];
      const accepted = new Set(['CustomCol']);
      const result = applyMappingSuggestions(current, suggestions, accepted);
      expect(result.CustomCol).toBe('company');
      expect(result.Name).toBe('name');
    });

    it('ignores non-accepted suggestions', () => {
      const current = { Name: 'name', CustomCol: '' };
      const suggestions = [
        { csvHeader: 'CustomCol', suggestedCrmField: 'company', confidence: 0.9, reason: 'test' },
      ];
      const accepted = new Set<string>(); // none accepted
      const result = applyMappingSuggestions(current, suggestions, accepted);
      expect(result.CustomCol).toBe('');
    });
  });
});
