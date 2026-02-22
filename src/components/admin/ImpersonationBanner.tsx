import { Eye, X, Loader2 } from 'lucide-react';
import { useImpersonationStore } from '../../stores/impersonationStore';
import { useNavigate } from 'react-router-dom';

export const ImpersonationBanner = () => {
  const {
    isImpersonating,
    targetUserName,
    targetUserEmail,
    targetOrgName,
    targetRole,
    loading,
    endImpersonation,
  } = useImpersonationStore();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleExit = async () => {
    try {
      await endImpersonation();
      navigate('/admin');
    } catch (err) {
      console.error('[ImpersonationBanner] Exit failed:', err);
      // Force navigate back even on error
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

        <button
          onClick={handleExit}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-sm font-bold transition-colors shrink-0 ml-3"
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
  );
};
