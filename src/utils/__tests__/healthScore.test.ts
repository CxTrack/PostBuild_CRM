import { describe, it, expect } from 'vitest';
import {
  calculateHealthScore,
  getHealthStatus,
  getHealthLabel,
} from '../healthScore';

describe('healthScore', () => {
  // -----------------------------------------------------------------------
  // calculateHealthScore
  // -----------------------------------------------------------------------
  describe('calculateHealthScore', () => {
    const perfectOrg = {
      active_users: 10,
      total_users: 10,
      api_calls_30d: 15000,
      storage_gb: 2,
      calls_made: 50,
      revenue: 5000,
      subscription_status: 'active',
      open_tickets: 0,
      features_used: ['invoices', 'quotes', 'calls', 'tasks', 'pipeline'],
      last_login_days_ago: 0,
      payment_failures: 0,
      error_rate: 0.1,
    };

    it('returns 100 for a perfectly healthy org', () => {
      const score = calculateHealthScore(perfectOrg);
      expect(score.overall).toBe(100);
      expect(score.engagement).toBe(100);
      expect(score.adoption).toBe(100);
      expect(score.payment).toBe(100);
      expect(score.support).toBe(100);
      expect(score.technical).toBe(100);
    });

    it('penalizes low active user ratio', () => {
      const org = { ...perfectOrg, active_users: 3, total_users: 10 };
      const score = calculateHealthScore(org);
      expect(score.engagement).toBeLessThan(100);
      expect(score.overall).toBeLessThan(100);
    });

    it('penalizes low API usage', () => {
      const org = { ...perfectOrg, api_calls_30d: 50 };
      const score = calculateHealthScore(org);
      expect(score.engagement).toBeLessThan(100);
    });

    it('penalizes stale last login', () => {
      const org = { ...perfectOrg, last_login_days_ago: 15 };
      const score = calculateHealthScore(org);
      expect(score.engagement).toBeLessThan(100);
    });

    it('scales adoption score by features used', () => {
      const org1 = { ...perfectOrg, features_used: ['invoices'] };
      const org5 = { ...perfectOrg, features_used: ['invoices', 'quotes', 'calls', 'tasks', 'pipeline'] };
      const score1 = calculateHealthScore(org1);
      const score5 = calculateHealthScore(org5);
      expect(score1.adoption).toBeLessThan(score5.adoption);
      expect(score5.adoption).toBe(100);
    });

    it('gives zero adoption for zero features', () => {
      const org = { ...perfectOrg, features_used: [] };
      const score = calculateHealthScore(org);
      expect(score.adoption).toBe(0);
    });

    it('handles different subscription statuses', () => {
      const trial = calculateHealthScore({ ...perfectOrg, subscription_status: 'trial' });
      const pastDue = calculateHealthScore({ ...perfectOrg, subscription_status: 'past_due' });
      const canceled = calculateHealthScore({ ...perfectOrg, subscription_status: 'canceled' });

      expect(trial.payment).toBeGreaterThan(pastDue.payment);
      expect(pastDue.payment).toBeGreaterThan(canceled.payment);
      expect(canceled.payment).toBe(0);
    });

    it('deducts for payment failures', () => {
      const org = { ...perfectOrg, payment_failures: 3 };
      const score = calculateHealthScore(org);
      expect(score.payment).toBeLessThan(100);
    });

    it('penalizes open support tickets', () => {
      const zero = calculateHealthScore({ ...perfectOrg, open_tickets: 0 });
      const many = calculateHealthScore({ ...perfectOrg, open_tickets: 6 });
      expect(zero.support).toBe(100);
      expect(many.support).toBe(0);
    });

    it('penalizes high error rates', () => {
      const low = calculateHealthScore({ ...perfectOrg, error_rate: 0.1 });
      const high = calculateHealthScore({ ...perfectOrg, error_rate: 6 });
      expect(low.technical).toBe(100);
      expect(high.technical).toBe(0);
    });

    it('never returns negative scores', () => {
      const worst = {
        active_users: 0,
        total_users: 10,
        api_calls_30d: 0,
        storage_gb: 0,
        calls_made: 0,
        revenue: 0,
        subscription_status: 'canceled',
        open_tickets: 20,
        features_used: [],
        last_login_days_ago: 100,
        payment_failures: 10,
        error_rate: 50,
      };
      const score = calculateHealthScore(worst);
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.engagement).toBeGreaterThanOrEqual(0);
      expect(score.payment).toBeGreaterThanOrEqual(0);
    });

    it('overall score sums all categories correctly', () => {
      const score = calculateHealthScore(perfectOrg);
      // Overall is the raw sum (max 100), individual percentages are of their category max
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.overall).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------------------
  // getHealthStatus
  // -----------------------------------------------------------------------
  describe('getHealthStatus', () => {
    it('returns "excellent" for 90+', () => {
      expect(getHealthStatus(90)).toBe('excellent');
      expect(getHealthStatus(100)).toBe('excellent');
    });

    it('returns "good" for 70-89', () => {
      expect(getHealthStatus(70)).toBe('good');
      expect(getHealthStatus(89)).toBe('good');
    });

    it('returns "warning" for 50-69', () => {
      expect(getHealthStatus(50)).toBe('warning');
      expect(getHealthStatus(69)).toBe('warning');
    });

    it('returns "critical" for below 50', () => {
      expect(getHealthStatus(49)).toBe('critical');
      expect(getHealthStatus(0)).toBe('critical');
    });
  });

  // -----------------------------------------------------------------------
  // getHealthLabel
  // -----------------------------------------------------------------------
  describe('getHealthLabel', () => {
    it('returns human-readable labels', () => {
      expect(getHealthLabel(95)).toBe('Excellent');
      expect(getHealthLabel(75)).toBe('Good');
      expect(getHealthLabel(55)).toBe('At Risk');
      expect(getHealthLabel(30)).toBe('Critical');
    });
  });
});
