import { describe, it, expect } from 'vitest';
import {
  AVAILABLE_MODULES,
  INDUSTRY_TEMPLATES,
  INDUSTRY_LABELS,
  PLAN_MODULE_ACCESS,
  FREE_TRIAL_ONLY_MODULES,
  FREE_TRIAL_DAYS,
  PLAN_VOICE_MINUTES,
  PLAN_MAX_VOICE_AGENTS,
  PLAN_SMS_LIMITS,
} from '../modules.config';

/**
 * Regression tests for the industry template system.
 *
 * These tests protect the core module configuration that powers the entire CRM.
 * Breaking changes here would affect every tenant, every industry template,
 * and every pricing tier.
 */
describe('modules.config', () => {
  // -----------------------------------------------------------------------
  // AVAILABLE_MODULES
  // -----------------------------------------------------------------------
  describe('AVAILABLE_MODULES', () => {
    const expectedModules = [
      'dashboard', 'crm', 'calendar', 'quotes', 'invoices',
      'products', 'inventory', 'suppliers', 'pipeline',
      'calls', 'tasks', 'financials', 'email',
    ];

    it('contains all 13 expected modules', () => {
      expect(Object.keys(AVAILABLE_MODULES)).toHaveLength(13);
      for (const mod of expectedModules) {
        expect(AVAILABLE_MODULES[mod]).toBeDefined();
      }
    });

    it('every module has required fields', () => {
      for (const [id, mod] of Object.entries(AVAILABLE_MODULES)) {
        expect(mod.id).toBe(id);
        expect(mod.name).toBeTruthy();
        expect(mod.description).toBeTruthy();
        expect(mod.icon).toBeTruthy();
        expect(mod.route).toBeDefined(); // can be '' for dashboard
        expect(mod.category).toBeTruthy();
        expect(Array.isArray(mod.requiredPermissions)).toBe(true);
      }
    });

    it('dashboard has empty route (root)', () => {
      expect(AVAILABLE_MODULES.dashboard.route).toBe('');
    });

    it('modules with dependencies reference valid modules', () => {
      for (const mod of Object.values(AVAILABLE_MODULES)) {
        if (mod.dependencies) {
          for (const dep of mod.dependencies) {
            expect(AVAILABLE_MODULES[dep]).toBeDefined();
          }
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // INDUSTRY_TEMPLATES
  // -----------------------------------------------------------------------
  describe('INDUSTRY_TEMPLATES', () => {
    const expectedIndustries = [
      'tax_accounting', 'distribution_logistics', 'gyms_fitness',
      'contractors_home_services', 'healthcare', 'real_estate',
      'legal_services', 'general_business', 'agency',
      'mortgage_broker', 'construction',
    ];

    it('has all 11 industries', () => {
      expect(Object.keys(INDUSTRY_TEMPLATES)).toHaveLength(11);
      for (const industry of expectedIndustries) {
        expect(INDUSTRY_TEMPLATES[industry]).toBeDefined();
      }
    });

    it('every industry includes dashboard', () => {
      for (const [industry, modules] of Object.entries(INDUSTRY_TEMPLATES)) {
        expect(modules).toContain('dashboard');
      }
    });

    it('every industry includes crm', () => {
      for (const modules of Object.values(INDUSTRY_TEMPLATES)) {
        expect(modules).toContain('crm');
      }
    });

    it('every industry includes calls', () => {
      for (const modules of Object.values(INDUSTRY_TEMPLATES)) {
        expect(modules).toContain('calls');
      }
    });

    it('every industry includes email', () => {
      for (const modules of Object.values(INDUSTRY_TEMPLATES)) {
        expect(modules).toContain('email');
      }
    });

    it('every module in templates exists in AVAILABLE_MODULES', () => {
      for (const [industry, modules] of Object.entries(INDUSTRY_TEMPLATES)) {
        for (const mod of modules) {
          expect(AVAILABLE_MODULES[mod]).toBeDefined();
        }
      }
    });

    it('no template has duplicate modules', () => {
      for (const [industry, modules] of Object.entries(INDUSTRY_TEMPLATES)) {
        const unique = new Set(modules);
        expect(unique.size).toBe(modules.length);
      }
    });

    it('distribution_logistics has inventory and suppliers', () => {
      expect(INDUSTRY_TEMPLATES.distribution_logistics).toContain('inventory');
      expect(INDUSTRY_TEMPLATES.distribution_logistics).toContain('suppliers');
    });

    it('healthcare does NOT have inventory or suppliers', () => {
      expect(INDUSTRY_TEMPLATES.healthcare).not.toContain('inventory');
      expect(INDUSTRY_TEMPLATES.healthcare).not.toContain('suppliers');
    });
  });

  // -----------------------------------------------------------------------
  // INDUSTRY_LABELS
  // -----------------------------------------------------------------------
  describe('INDUSTRY_LABELS', () => {
    it('tax_accounting calls CRM "Clients"', () => {
      expect(INDUSTRY_LABELS.tax_accounting.crm.name).toBe('Clients');
    });

    it('tax_accounting calls quotes "Engagement Letters"', () => {
      expect(INDUSTRY_LABELS.tax_accounting.quotes.name).toBe('Engagement Letters');
    });

    it('healthcare calls CRM "Patients"', () => {
      expect(INDUSTRY_LABELS.healthcare.crm.name).toBe('Patients');
    });

    it('gyms_fitness calls CRM "Members"', () => {
      expect(INDUSTRY_LABELS.gyms_fitness.crm.name).toBe('Members');
    });

    it('real_estate calls CRM "Contacts"', () => {
      expect(INDUSTRY_LABELS.real_estate.crm.name).toBe('Contacts');
    });

    it('distribution_logistics calls CRM "Accounts"', () => {
      expect(INDUSTRY_LABELS.distribution_logistics.crm.name).toBe('Accounts');
    });

    it('mortgage_broker calls CRM "Borrowers"', () => {
      expect(INDUSTRY_LABELS.mortgage_broker.crm.name).toBe('Borrowers');
    });

    it('construction calls quotes "Bids"', () => {
      expect(INDUSTRY_LABELS.construction.quotes.name).toBe('Bids');
    });

    it('agency calls pipeline "Projects"', () => {
      expect(INDUSTRY_LABELS.agency.pipeline.name).toBe('Projects');
    });

    it('every label-referenced module exists in AVAILABLE_MODULES', () => {
      for (const [industry, labels] of Object.entries(INDUSTRY_LABELS)) {
        for (const moduleId of Object.keys(labels)) {
          expect(AVAILABLE_MODULES[moduleId]).toBeDefined();
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // PLAN_MODULE_ACCESS
  // -----------------------------------------------------------------------
  describe('PLAN_MODULE_ACCESS', () => {
    it('has all 4 pricing tiers', () => {
      expect(Object.keys(PLAN_MODULE_ACCESS)).toContain('free');
      expect(Object.keys(PLAN_MODULE_ACCESS)).toContain('business');
      expect(Object.keys(PLAN_MODULE_ACCESS)).toContain('elite_premium');
      expect(Object.keys(PLAN_MODULE_ACCESS)).toContain('enterprise');
    });

    it('every tier includes dashboard and crm', () => {
      for (const modules of Object.values(PLAN_MODULE_ACCESS)) {
        expect(modules).toContain('dashboard');
        expect(modules).toContain('crm');
      }
    });

    it('free tier has access to all modules (during trial)', () => {
      expect(PLAN_MODULE_ACCESS.free).toHaveLength(13);
    });

    it('enterprise has access to all modules', () => {
      expect(PLAN_MODULE_ACCESS.enterprise).toHaveLength(13);
    });

    it('business tier has fewer modules than enterprise', () => {
      expect(PLAN_MODULE_ACCESS.business.length).toBeLessThan(
        PLAN_MODULE_ACCESS.enterprise.length
      );
    });

    it('business tier does NOT include inventory or suppliers', () => {
      expect(PLAN_MODULE_ACCESS.business).not.toContain('inventory');
      expect(PLAN_MODULE_ACCESS.business).not.toContain('suppliers');
    });

    it('business tier includes financials (earnings)', () => {
      expect(PLAN_MODULE_ACCESS.business).toContain('financials');
    });

    it('all plan modules reference valid AVAILABLE_MODULES', () => {
      for (const [plan, modules] of Object.entries(PLAN_MODULE_ACCESS)) {
        for (const mod of modules) {
          expect(AVAILABLE_MODULES[mod]).toBeDefined();
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // FREE_TRIAL_ONLY_MODULES
  // -----------------------------------------------------------------------
  describe('FREE_TRIAL_ONLY_MODULES', () => {
    it('has 7 premium-locked modules', () => {
      expect(FREE_TRIAL_ONLY_MODULES).toHaveLength(7);
    });

    it('includes the expected modules', () => {
      expect(FREE_TRIAL_ONLY_MODULES).toContain('pipeline');
      expect(FREE_TRIAL_ONLY_MODULES).toContain('calls');
      expect(FREE_TRIAL_ONLY_MODULES).toContain('products');
      expect(FREE_TRIAL_ONLY_MODULES).toContain('inventory');
      expect(FREE_TRIAL_ONLY_MODULES).toContain('suppliers');
      expect(FREE_TRIAL_ONLY_MODULES).toContain('financials');
      expect(FREE_TRIAL_ONLY_MODULES).toContain('email');
    });

    it('does NOT include core modules (dashboard, crm, calendar, tasks, quotes, invoices)', () => {
      expect(FREE_TRIAL_ONLY_MODULES).not.toContain('dashboard');
      expect(FREE_TRIAL_ONLY_MODULES).not.toContain('crm');
      expect(FREE_TRIAL_ONLY_MODULES).not.toContain('calendar');
      expect(FREE_TRIAL_ONLY_MODULES).not.toContain('tasks');
      expect(FREE_TRIAL_ONLY_MODULES).not.toContain('quotes');
      expect(FREE_TRIAL_ONLY_MODULES).not.toContain('invoices');
    });

    it('all trial-only modules exist in AVAILABLE_MODULES', () => {
      for (const mod of FREE_TRIAL_ONLY_MODULES) {
        expect(AVAILABLE_MODULES[mod]).toBeDefined();
      }
    });
  });

  // -----------------------------------------------------------------------
  // FREE_TRIAL_DAYS
  // -----------------------------------------------------------------------
  describe('FREE_TRIAL_DAYS', () => {
    it('is 30 days', () => {
      expect(FREE_TRIAL_DAYS).toBe(30);
    });
  });

  // -----------------------------------------------------------------------
  // Voice & SMS Limits
  // -----------------------------------------------------------------------
  describe('Plan limits', () => {
    it('voice minutes scale with plan tier', () => {
      expect(PLAN_VOICE_MINUTES.free).toBeLessThan(PLAN_VOICE_MINUTES.business);
      expect(PLAN_VOICE_MINUTES.business).toBeLessThan(PLAN_VOICE_MINUTES.elite_premium);
      expect(PLAN_VOICE_MINUTES.elite_premium).toBeLessThan(PLAN_VOICE_MINUTES.enterprise);
    });

    it('max voice agents scale with plan tier', () => {
      expect(PLAN_MAX_VOICE_AGENTS.free).toBe(1);
      expect(PLAN_MAX_VOICE_AGENTS.enterprise).toBeGreaterThanOrEqual(10);
    });

    it('SMS limits scale with plan tier', () => {
      expect(PLAN_SMS_LIMITS.free.outbound).toBeLessThan(PLAN_SMS_LIMITS.business.outbound);
      expect(PLAN_SMS_LIMITS.business.outbound).toBeLessThan(PLAN_SMS_LIMITS.elite_premium.outbound);
    });

    it('all plan tiers have both inbound and outbound SMS limits', () => {
      for (const limits of Object.values(PLAN_SMS_LIMITS)) {
        expect(limits.inbound).toBeDefined();
        expect(limits.outbound).toBeDefined();
        expect(limits.inbound).toBeGreaterThan(0);
        expect(limits.outbound).toBeGreaterThan(0);
      }
    });
  });
});
