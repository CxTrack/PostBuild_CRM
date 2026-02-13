import { useMemo } from 'react';
import { useOrganizationStore } from '../stores/organizationStore';
import {
    AVAILABLE_MODULES,
    INDUSTRY_TEMPLATES,
    INDUSTRY_LABELS,
    PLAN_MODULE_ACCESS,
    FREE_TRIAL_ONLY_MODULES,
    FREE_TRIAL_DAYS
} from '../config/modules.config';
import type { Module } from '../types/app.types';

export interface VisibleModule extends Module {
    isLocked: boolean;
    isTrialFeature: boolean; // True if this feature is only available during trial for free tier
    trialDaysRemaining: number | null; // Days remaining in trial, null if not applicable
}

/**
 * Normalize database subscription tier values to match PLAN_MODULE_ACCESS keys
 * Database may have: 'free', 'starter', 'professional', 'enterprise'
 * Code expects: 'free', 'business', 'elite_premium', 'enterprise'
 */
const normalizePlanTier = (dbTier?: string): string => {
    const tierMap: Record<string, string> = {
        'free': 'free',
        'starter': 'business',
        'professional': 'elite_premium',
        'business': 'business',
        'elite_premium': 'elite_premium',
        'enterprise': 'enterprise',
    };
    return tierMap[dbTier || 'free'] || 'free';
};

export const useVisibleModules = () => {
    const { currentOrganization } = useOrganizationStore();

    // MEMOIZE to prevent new object reference on every render
    const result = useMemo(() => {
        const planTier = normalizePlanTier(currentOrganization?.subscription_tier);
        const industryTemplate = currentOrganization?.industry_template || 'general_business';

        // Calculate trial status for free tier
        let trialDaysRemaining: number | null = null;
        let isTrialExpired = false;

        if (planTier === 'free') {
            const trialStartedAt = currentOrganization?.metadata?.trial_started_at;
            if (trialStartedAt) {
                const trialStart = new Date(trialStartedAt);
                const now = new Date();
                const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
                trialDaysRemaining = Math.max(0, FREE_TRIAL_DAYS - daysSinceStart);
                isTrialExpired = trialDaysRemaining <= 0;
            } else {
                // If no trial_started_at, assume trial just started (full days remaining)
                trialDaysRemaining = FREE_TRIAL_DAYS;
                isTrialExpired = false;
            }
        }

        // 1. Get modules defined by industry template
        const templateModuleIds = INDUSTRY_TEMPLATES[industryTemplate] || INDUSTRY_TEMPLATES['general_business'];

        // 2. Get modules allowed by plan tier
        const planAllowedModuleIds = PLAN_MODULE_ACCESS[planTier] || PLAN_MODULE_ACCESS['free'];

        // 3. Determine visibility (Template defines WHAT exists, Plan defines IF it's locked/accessible)
        const visibleModules = templateModuleIds.map(id => {
            const baseModule = AVAILABLE_MODULES[id];
            if (!baseModule) return null;

            // Check if this is a trial-only feature for free tier
            const isTrialOnlyModule = planTier === 'free' && FREE_TRIAL_ONLY_MODULES.includes(id);

            // Module is locked if: not in plan access list, OR trial-only module and trial expired
            const isLocked = !planAllowedModuleIds.includes(id) || (isTrialOnlyModule && isTrialExpired);

            // Apply industry labels
            const labels = INDUSTRY_LABELS[industryTemplate]?.[id];

            return {
                ...baseModule,
                name: labels?.name || baseModule.name,
                description: labels?.description || baseModule.description,
                isLocked,
                isTrialFeature: isTrialOnlyModule && !isTrialExpired, // Only show as trial feature if trial is active
                trialDaysRemaining: isTrialOnlyModule ? trialDaysRemaining : null
            };
        }).filter(Boolean) as VisibleModule[];

        return {
            visibleModules,
            planTier,
            industryTemplate,
            trialDaysRemaining,
            isTrialExpired
        };
    }, [currentOrganization?.subscription_tier, currentOrganization?.industry_template, currentOrganization?.metadata?.trial_started_at]);

    return result;
};
