import { useMemo } from 'react';
import { useOrganizationStore } from '../stores/organizationStore';
import { getPageLabels, PageLabels } from '../config/modules.config';

/**
 * Hook to get industry-specific page labels
 *
 * Usage:
 *   const labels = usePageLabels('invoices');
 *   <h1>{labels.title}</h1>
 *   <p>{labels.subtitle}</p>
 *   <button>{labels.newButton}</button>
 *
 * Returns all labels for the page, merged with industry-specific overrides
 */
export const usePageLabels = (pageId: string): PageLabels => {
  const { currentOrganization } = useOrganizationStore();

  return useMemo(() => {
    const industryTemplate = currentOrganization?.industry_template || 'general_business';
    return getPageLabels(pageId, industryTemplate);
  }, [pageId, currentOrganization?.industry_template]);
};

/**
 * Hook to get a single label value
 * Useful when you only need one specific label
 *
 * Usage:
 *   const title = usePageLabel('invoices', 'title');
 */
export const usePageLabel = <K extends keyof PageLabels>(
  pageId: string,
  labelKey: K
): PageLabels[K] => {
  const labels = usePageLabels(pageId);
  return labels[labelKey];
};

export default usePageLabels;
