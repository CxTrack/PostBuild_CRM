import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateUrl,
  validatePositiveNumber,
  validateAll,
} from '../validation';

describe('validation', () => {
  // -----------------------------------------------------------------------
  // validateEmail
  // -----------------------------------------------------------------------
  describe('validateEmail', () => {
    it('treats empty/null/undefined as valid (optional)', () => {
      expect(validateEmail(null).isValid).toBe(true);
      expect(validateEmail(undefined).isValid).toBe(true);
      expect(validateEmail('').isValid).toBe(true);
      expect(validateEmail('  ').isValid).toBe(true);
    });

    it('accepts valid email addresses', () => {
      expect(validateEmail('user@example.com').isValid).toBe(true);
      expect(validateEmail('name+tag@company.co').isValid).toBe(true);
      expect(validateEmail('test.user@domain.org').isValid).toBe(true);
      expect(validateEmail('USER@EXAMPLE.COM').isValid).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('not-an-email').isValid).toBe(false);
      expect(validateEmail('@no-user.com').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('user@.com').isValid).toBe(false);
    });

    it('rejects emails longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      expect(validateEmail(longEmail).isValid).toBe(false);
      expect(validateEmail(longEmail).error).toContain('too long');
    });

    it('returns meaningful error messages', () => {
      const result = validateEmail('bad-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('valid email');
    });
  });

  // -----------------------------------------------------------------------
  // validatePhone
  // -----------------------------------------------------------------------
  describe('validatePhone', () => {
    it('treats empty/null/undefined as valid (optional)', () => {
      expect(validatePhone(null).isValid).toBe(true);
      expect(validatePhone(undefined).isValid).toBe(true);
      expect(validatePhone('').isValid).toBe(true);
    });

    it('accepts valid phone numbers', () => {
      expect(validatePhone('6135551234').isValid).toBe(true);
      expect(validatePhone('+16135551234').isValid).toBe(true);
      expect(validatePhone('(613) 555-1234').isValid).toBe(true);
    });

    it('rejects phone numbers that are too short', () => {
      const result = validatePhone('12345');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('rejects phone numbers that are too long', () => {
      const result = validatePhone('1234567890123456');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  // -----------------------------------------------------------------------
  // validateRequired
  // -----------------------------------------------------------------------
  describe('validateRequired', () => {
    it('rejects null/undefined/empty/whitespace', () => {
      expect(validateRequired(null).isValid).toBe(false);
      expect(validateRequired(undefined).isValid).toBe(false);
      expect(validateRequired('').isValid).toBe(false);
      expect(validateRequired('  ').isValid).toBe(false);
    });

    it('accepts non-empty strings', () => {
      expect(validateRequired('hello').isValid).toBe(true);
      expect(validateRequired('a').isValid).toBe(true);
    });

    it('includes field name in error message', () => {
      const result = validateRequired('', 'Email');
      expect(result.error).toBe('Email is required');
    });

    it('uses default field name when not specified', () => {
      const result = validateRequired('');
      expect(result.error).toBe('This field is required');
    });
  });

  // -----------------------------------------------------------------------
  // validateMinLength
  // -----------------------------------------------------------------------
  describe('validateMinLength', () => {
    it('treats empty/null as valid (optional)', () => {
      expect(validateMinLength(null, 5).isValid).toBe(true);
      expect(validateMinLength(undefined, 5).isValid).toBe(true);
    });

    it('accepts strings meeting minimum length', () => {
      expect(validateMinLength('hello', 5).isValid).toBe(true);
      expect(validateMinLength('hello world', 5).isValid).toBe(true);
    });

    it('rejects strings below minimum length', () => {
      const result = validateMinLength('hi', 5, 'Password');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 5 characters');
      expect(result.error).toContain('Password');
    });

    it('trims whitespace before checking', () => {
      expect(validateMinLength('  hi  ', 5).isValid).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // validateMaxLength
  // -----------------------------------------------------------------------
  describe('validateMaxLength', () => {
    it('treats empty/null as valid', () => {
      expect(validateMaxLength(null, 10).isValid).toBe(true);
      expect(validateMaxLength(undefined, 10).isValid).toBe(true);
    });

    it('accepts strings within max length', () => {
      expect(validateMaxLength('hello', 10).isValid).toBe(true);
      expect(validateMaxLength('hi', 10).isValid).toBe(true);
    });

    it('rejects strings exceeding max length', () => {
      const result = validateMaxLength('this is too long', 10, 'Name');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no more than 10 characters');
      expect(result.error).toContain('Name');
    });
  });

  // -----------------------------------------------------------------------
  // validateUrl
  // -----------------------------------------------------------------------
  describe('validateUrl', () => {
    it('treats empty/null as valid (optional)', () => {
      expect(validateUrl(null).isValid).toBe(true);
      expect(validateUrl(undefined).isValid).toBe(true);
      expect(validateUrl('').isValid).toBe(true);
    });

    it('accepts valid URLs', () => {
      expect(validateUrl('https://example.com').isValid).toBe(true);
      expect(validateUrl('http://example.com').isValid).toBe(true);
      expect(validateUrl('example.com').isValid).toBe(true);
    });

    it('rejects invalid URLs', () => {
      const result = validateUrl('not a url');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid URL');
    });
  });

  // -----------------------------------------------------------------------
  // validatePositiveNumber
  // -----------------------------------------------------------------------
  describe('validatePositiveNumber', () => {
    it('treats empty/null/undefined as valid (optional)', () => {
      expect(validatePositiveNumber(null).isValid).toBe(true);
      expect(validatePositiveNumber(undefined).isValid).toBe(true);
      expect(validatePositiveNumber('').isValid).toBe(true);
    });

    it('accepts zero and positive numbers', () => {
      expect(validatePositiveNumber(0).isValid).toBe(true);
      expect(validatePositiveNumber(100).isValid).toBe(true);
      expect(validatePositiveNumber(99.99).isValid).toBe(true);
      expect(validatePositiveNumber('42').isValid).toBe(true);
    });

    it('rejects negative numbers', () => {
      const result = validatePositiveNumber(-5, 'Amount');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('positive number');
      expect(result.error).toContain('Amount');
    });

    it('rejects non-numeric strings', () => {
      const result = validatePositiveNumber('abc', 'Price');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a number');
    });
  });

  // -----------------------------------------------------------------------
  // validateAll
  // -----------------------------------------------------------------------
  describe('validateAll', () => {
    it('returns valid when all validations pass', () => {
      const result = validateAll(
        validateRequired('hello'),
        validateEmail('user@example.com'),
        validateMinLength('password123', 8)
      );
      expect(result.isValid).toBe(true);
    });

    it('returns first failure', () => {
      const result = validateAll(
        validateRequired(''),       // fails
        validateEmail('bad-email'), // also fails
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('stops at the first validation failure', () => {
      const result = validateAll(
        validateRequired('hello'),      // passes
        validateMinLength('hi', 8),     // fails
        validateEmail('bad-email'),     // also fails, but should not be reported
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });
  });
});
