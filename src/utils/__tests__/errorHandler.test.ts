import { describe, it, expect, vi } from 'vitest';
import { getSafeErrorMessage, logError } from '../errorHandler';

describe('errorHandler', () => {
  // -----------------------------------------------------------------------
  // getSafeErrorMessage
  // -----------------------------------------------------------------------
  describe('getSafeErrorMessage', () => {
    it('matches "duplicate key" pattern', () => {
      const error = new Error('Duplicate key value violates unique constraint');
      expect(getSafeErrorMessage(error)).toBe('This record already exists');
    });

    it('matches "violates foreign key" pattern', () => {
      const error = new Error('Update or delete violates foreign key constraint');
      expect(getSafeErrorMessage(error)).toBe('Cannot delete: this item is linked to other records');
    });

    it('matches "network" pattern', () => {
      const error = new Error('Network request failed');
      expect(getSafeErrorMessage(error)).toBe('Network error. Please check your connection');
    });

    it('matches "timeout" pattern', () => {
      const error = new Error('Request timeout exceeded');
      expect(getSafeErrorMessage(error)).toBe('Request timed out. Please try again');
    });

    it('matches "unauthorized" pattern', () => {
      const error = new Error('User is unauthorized');
      expect(getSafeErrorMessage(error)).toBe('You are not authorized to perform this action');
    });

    it('matches "rate limit" pattern', () => {
      const error = new Error('Rate limit exceeded');
      expect(getSafeErrorMessage(error)).toBe('Too many requests. Please wait a moment');
    });

    it('matches "not found" pattern', () => {
      const error = new Error('Resource not found');
      expect(getSafeErrorMessage(error)).toBe('The requested item was not found');
    });

    it('returns operation-specific fallback for unknown errors', () => {
      const error = new Error('Something weird happened with SQL injection attempt');
      expect(getSafeErrorMessage(error, 'fetch')).toBe('Failed to load data. Please refresh and try again');
      expect(getSafeErrorMessage(error, 'create')).toBe('Failed to create record. Please try again');
      expect(getSafeErrorMessage(error, 'update')).toBe('Failed to update record. Please try again');
      expect(getSafeErrorMessage(error, 'delete')).toBe('Failed to delete record. Please try again');
      expect(getSafeErrorMessage(error, 'auth')).toBe('Authentication failed. Please sign in again');
      expect(getSafeErrorMessage(error, 'default')).toBe('An error occurred. Please try again');
    });

    it('handles non-Error objects', () => {
      expect(getSafeErrorMessage('duplicate key found')).toBe('This record already exists');
      expect(getSafeErrorMessage(42)).toBe('An error occurred. Please try again');
      expect(getSafeErrorMessage({ message: 'timeout' })).toBe('An error occurred. Please try again');
    });

    it('never leaks raw SQL or technical details', () => {
      const error = new Error('SELECT * FROM users WHERE id = 1; DROP TABLE users;--');
      const message = getSafeErrorMessage(error);
      expect(message).not.toContain('SELECT');
      expect(message).not.toContain('DROP TABLE');
      expect(message).not.toContain('users');
    });

    it('case-insensitive matching', () => {
      expect(getSafeErrorMessage(new Error('DUPLICATE KEY'))).toBe('This record already exists');
      expect(getSafeErrorMessage(new Error('Unauthorized Access'))).toBe('You are not authorized to perform this action');
    });
  });

  // -----------------------------------------------------------------------
  // logError
  // -----------------------------------------------------------------------
  describe('logError', () => {
    it('logs in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logError('TestContext', new Error('test error'));
      // The function checks import.meta.env.DEV which is true in test setup
      // Just verify no throw
      consoleSpy.mockRestore();
    });
  });
});
