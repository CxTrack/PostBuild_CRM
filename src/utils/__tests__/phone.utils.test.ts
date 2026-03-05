import { describe, it, expect } from 'vitest';
import {
  formatPhoneDisplay,
  formatPhoneForStorage,
  getPhoneLink,
  isValidPhone,
} from '../phone.utils';

describe('phone.utils', () => {
  // -----------------------------------------------------------------------
  // formatPhoneDisplay
  // -----------------------------------------------------------------------
  describe('formatPhoneDisplay', () => {
    it('returns empty string for null/undefined/empty', () => {
      expect(formatPhoneDisplay(null)).toBe('');
      expect(formatPhoneDisplay(undefined)).toBe('');
      expect(formatPhoneDisplay('')).toBe('');
    });

    it('formats 10-digit number as (XXX) XXX-XXXX', () => {
      expect(formatPhoneDisplay('6135551234')).toBe('(613) 555-1234');
    });

    it('formats 11-digit number starting with 1 as +1 (XXX) XXX-XXXX', () => {
      expect(formatPhoneDisplay('16135551234')).toBe('+1 (613) 555-1234');
    });

    it('handles numbers with existing formatting', () => {
      expect(formatPhoneDisplay('(613) 555-1234')).toBe('(613) 555-1234');
      expect(formatPhoneDisplay('+1 (613) 555-1234')).toBe('+1 (613) 555-1234');
    });

    it('strips non-digit characters before formatting', () => {
      expect(formatPhoneDisplay('613-555-1234')).toBe('(613) 555-1234');
      expect(formatPhoneDisplay('613.555.1234')).toBe('(613) 555-1234');
    });

    it('returns original for strings with no digits', () => {
      expect(formatPhoneDisplay('abc')).toBe('');
    });

    it('handles international numbers with + prefix', () => {
      const result = formatPhoneDisplay('+442071234567');
      expect(result).toContain('+');
    });
  });

  // -----------------------------------------------------------------------
  // formatPhoneForStorage
  // -----------------------------------------------------------------------
  describe('formatPhoneForStorage', () => {
    it('returns empty string for null/undefined/empty', () => {
      expect(formatPhoneForStorage(null)).toBe('');
      expect(formatPhoneForStorage(undefined)).toBe('');
      expect(formatPhoneForStorage('')).toBe('');
    });

    it('prepends +1 to 10-digit numbers', () => {
      expect(formatPhoneForStorage('6135551234')).toBe('+16135551234');
    });

    it('prepends + to 11+ digit numbers', () => {
      expect(formatPhoneForStorage('16135551234')).toBe('+16135551234');
    });

    it('strips formatting before storing', () => {
      expect(formatPhoneForStorage('(613) 555-1234')).toBe('+16135551234');
      expect(formatPhoneForStorage('+1 (613) 555-1234')).toBe('+16135551234');
      expect(formatPhoneForStorage('613-555-1234')).toBe('+16135551234');
    });

    it('returns raw digits for short numbers', () => {
      expect(formatPhoneForStorage('12345')).toBe('12345');
    });
  });

  // -----------------------------------------------------------------------
  // getPhoneLink
  // -----------------------------------------------------------------------
  describe('getPhoneLink', () => {
    it('returns empty string for null/undefined/empty', () => {
      expect(getPhoneLink(null)).toBe('');
      expect(getPhoneLink(undefined)).toBe('');
      expect(getPhoneLink('')).toBe('');
    });

    it('creates tel: link for 10-digit number', () => {
      expect(getPhoneLink('6135551234')).toBe('tel:+16135551234');
    });

    it('creates tel: link for number already starting with 1', () => {
      expect(getPhoneLink('16135551234')).toBe('tel:+16135551234');
    });

    it('strips formatting in tel: link', () => {
      expect(getPhoneLink('(613) 555-1234')).toBe('tel:+16135551234');
    });
  });

  // -----------------------------------------------------------------------
  // isValidPhone
  // -----------------------------------------------------------------------
  describe('isValidPhone', () => {
    it('treats null/undefined/empty as valid (optional field)', () => {
      expect(isValidPhone(null)).toBe(true);
      expect(isValidPhone(undefined)).toBe(true);
      expect(isValidPhone('')).toBe(true);
    });

    it('accepts 10-digit phone numbers', () => {
      expect(isValidPhone('6135551234')).toBe(true);
    });

    it('accepts 11-digit phone numbers with country code', () => {
      expect(isValidPhone('16135551234')).toBe(true);
    });

    it('accepts formatted phone numbers', () => {
      expect(isValidPhone('(613) 555-1234')).toBe(true);
      expect(isValidPhone('+1 (613) 555-1234')).toBe(true);
    });

    it('rejects numbers shorter than 10 digits', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('123456789')).toBe(false);
    });

    it('rejects numbers longer than 15 digits', () => {
      expect(isValidPhone('1234567890123456')).toBe(false);
    });

    it('accepts international numbers up to 15 digits', () => {
      expect(isValidPhone('+442071234567')).toBe(true);
      expect(isValidPhone('123456789012345')).toBe(true);
    });
  });
});
