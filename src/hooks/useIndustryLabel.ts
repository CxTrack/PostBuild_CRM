import { useOrganizationStore } from '../stores/organizationStore';
import { INDUSTRY_LABELS, AVAILABLE_MODULES } from '../config/modules.config';

/**
 * Returns the industry-specific display label for a given module ID.
 * Falls back to the default module name if no industry override exists.
 *
 * Example: for contractors_home_services, 'quotes' → 'Estimates'
 */
export const useIndustryLabel = (moduleId: string): string => {
    const { currentOrganization } = useOrganizationStore();
    const template = currentOrganization?.industry_template || 'general_business';
    return INDUSTRY_LABELS[template]?.[moduleId]?.name || AVAILABLE_MODULES[moduleId]?.name || moduleId;
};
