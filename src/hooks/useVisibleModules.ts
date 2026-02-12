import { useMemo } from 'react';
import { useOrganizationStore } from '../stores/organizationStore';
import {
    AVAILABLE_MODULES,
    INDUSTRY_TEMPLATES,
    INDUSTRY_LABELS,
    PLAN_MODULE_ACCESS
} from '../config/modules.config';
import type { Module } from '../types/app.types';

export interface VisibleModule extends Module {
    isLocked: boolean;
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

        // Debug logging
        console.log('[CxTrack] useVisibleModules - Org:', currentOrganization?.name);
        console.log('[CxTrack] useVisibleModules - Raw tier:', currentOrganization?.subscription_tier, '→ Normalized:', planTier);
        console.log('[CxTrack] useVisibleModules - Industry template:', industryTemplate);

        // 1. Get modules defined by industry template
        const templateModuleIds = INDUSTRY_TEMPLATES[industryTemplate] || INDUSTRY_TEMPLATES['general_business'];
        console.log('[CxTrack] useVisibleModules - Template module IDs:', templateModuleIds);

        // 2. Get modules allowed by plan tier
        const planAllowedModuleIds = PLAN_MODULE_ACCESS[planTier] || PLAN_MODULE_ACCESS['free'];

        // 3. Determine visibility (Template defines WHAT exists, Plan defines IF it's locked/accessible)
        const visibleModules = templateModuleIds.map(id => {
            const baseModule = AVAILABLE_MODULES[id];
            if (!baseModule) return null;

            const isLocked = !planAllowedModuleIds.includes(id);

            // Apply industry labels
            const labels = INDUSTRY_LABELS[industryTemplate]?.[id];

            return {
                ...baseModule,
                name: labels?.name || baseModule.name,
                description: labels?.description || baseModule.description,
                isLocked
            };
        }).filter(Boolean) as VisibleModule[];

        return {
            visibleModules,
            planTier,
            industryTemplate
        };
    }, [currentOrganization?.subscription_tier, currentOrganization?.industry_template]);

    return result;
};
