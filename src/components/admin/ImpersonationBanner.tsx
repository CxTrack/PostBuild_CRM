import { useState, useRef, useEffect } from 'react';
import { Eye, X, Loader2, ArrowUpDown, Check } from 'lucide-react';
import { useImpersonationStore } from '../../stores/impersonationStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { useAdminStore } from '../../stores/adminStore';
import { useNavigate } from 'react-router-dom';

const getAuthUserId = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.user?.id) return stored.user.id;
      } catch { /* ignore */ }
    }
  }
  return null;
};

const INDUSTRY_LABELS: Record<string, string> = {
  tax_accounting: 'Tax & Accounting',
  distribution_logistics: 'Distribution & Logistics',
  gyms_fitness: 'Gyms & Fitness',
  contractors_home_services: 'Contractors & Home Services',
  healthcare: 'Healthcare',
  real_estate: 'Real Estate',
  legal_services: 'Legal Services',
  general_business: 'General Business',
  agency: 'Agency',
  mortgage_broker: 'Mortgage Broker',
  construction: 'Construction',
};

export const ImpersonationBanner = () => {
  const {
    isImpersonating,
    targetUserName,
    targetUserEmail,
    targetOrgName,
    targetOrgId,
    targetRole,
    loading,
    endImpersonation,
  } = useImpersonationStore();
  const { currentOrganization, fetchUserOrganizations, setCurrentOrganization } = useOrganizationStore();
  const { updateOrgIndustryTemplate } = useAdminStore();
  const navigate = useNavigate();

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateUpdating, setTemplateUpdating] = useState(false);
  const originalTemplateRef = useRef<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowTemplatePicker(false);
      }
    };
    if (showTemplatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTemplatePicker]);

  // Capture the original template when impersonation starts
  useEffect(() => {
    if (isImpersonating && currentOrganization?.industry_template && !originalTemplateRef.current) {
      originalTemplateRef.current = currentOrganization.industry_template;
      console.log('[ImpersonationBanner] Saved original template:', originalTemplateRef.current);
    }
    if (!isImpersonating) {
      originalTemplateRef.current = null;
    }
  }, [isImpersonating, currentOrganization?.industry_template]);

  if (!isImpersonating) return null;

  const currentTemplate = currentOrganization?.industry_template || 'general_business';

  const handleTemplateSwitch = async (templateKey: string) => {
    if (!targetOrgId || templateKey === currentTemplate) {
      setShowTemplatePicker(false);
      return;
    }
    setTemplateUpdating(true);
    try {
      const result = await updateOrgIndustryTemplate(targetOrgId, templateKey);
      if (result.success) {
        // Refresh org data so sidebar/modules update
        const authUserId = getAuthUserId();
        if (authUserId) {
          await fetchUserOrganizations(authUserId);
          await setCurrentOrganization(targetOrgId);
        }
        setShowTemplatePicker(false);
      }
    } catch (err) {
      console.error('[ImpersonationBanner] Template switch failed:', err);
    } finally {
      setTemplateUpdating(false);
    }
  };

  const handleExit = async () => {
    try {
      // Restore the original template if we changed it during impersonation
      const savedOriginal = originalTemplateRef.current;
      if (savedOriginal && targetOrgId && currentTemplate !== savedOriginal) {
        console.log('[ImpersonationBanner] Restoring original template:', savedOriginal);
        await updateOrgIndustryTemplate(targetOrgId, savedOriginal);
      }
      originalTemplateRef.current = null;
      await endImpersonation();
      navigate('/admin');
    } catch (err) {
      console.error('[ImpersonationBanner] Exit failed:', err);
      navigate('/admin');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold truncate">
            Viewing as{' '}
            <span className="font-bold">{targetUserName || 'Unknown'}</span>
            <span className="hidden sm:inline text-amber-100 ml-1">
              ({targetUserEmail})
            </span>
            {targetOrgName && (
              <span className="hidden md:inline text-amber-100 ml-1">
                in {targetOrgName}
              </span>
            )}
            {targetRole && (
              <span className="hidden lg:inline ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold uppercase">
                {targetRole}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Industry Template Switcher */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowTemplatePicker(!showTemplatePicker)}
              disabled={templateUpdating}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-xs font-bold transition-colors"
            >
              {templateUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ArrowUpDown className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{INDUSTRY_LABELS[currentTemplate] || currentTemplate}</span>
              <span className="sm:hidden">Template</span>
            </button>

            {showTemplatePicker && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-[10000]">
                <div className="px-3 py-2 border-b border-gray-700">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Switch Industry Template</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleTemplateSwitch(key)}
                      disabled={templateUpdating}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${
                        key === currentTemplate ? 'text-amber-400 font-semibold bg-gray-800/50' : 'text-gray-300'
                      }`}
                    >
                      {label}
                      {key === currentTemplate && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Exit Button */}
          <button
            onClick={handleExit}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-sm font-bold transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Exit Impersonation</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
