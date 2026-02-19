import { useState, useEffect } from 'react';
import { X, Users, Search, Shield, Eye, Edit3, Trash2, Globe } from 'lucide-react';
import { useCustomReportStore } from '@/stores/customReportStore';
import type { CustomReport, ReportShare } from './reportFieldMeta';
import toast from 'react-hot-toast';

interface ReportShareModalProps {
  report: CustomReport;
  organizationId: string;
  theme: string;
  onClose: () => void;
  onTogglePublic: () => void;
}

export const ReportShareModal = ({ report, organizationId, theme, onClose, onTogglePublic }: ReportShareModalProps) => {
  const { fetchShares, addShare, updateShare, removeShare, fetchOrgMembers } = useCustomReportStore();
  const [shares, setShares] = useState<ReportShare[]>([]);
  const [members, setMembers] = useState<{ id: string; email: string; full_name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPermission, setSelectedPermission] = useState<'viewer' | 'editor'>('viewer');

  const isMidnight = theme === 'midnight';
  const isDark = theme === 'dark' || theme === 'midnight';

  const bg = isMidnight ? 'bg-gray-900' : isDark ? 'bg-gray-800' : 'bg-white';
  const border = isMidnight ? 'border-white/10' : isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isMidnight ? 'text-white' : isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isMidnight ? 'text-gray-400' : isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isMidnight ? 'bg-white/[0.05] border-white/10 text-white placeholder-gray-500' : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const hoverBg = isMidnight ? 'hover:bg-white/[0.05]' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, m] = await Promise.all([
          fetchShares(report.id),
          fetchOrgMembers(organizationId),
        ]);
        setShares(s);
        setMembers(m);
      } catch (err: any) {
        toast.error('Failed to load sharing data');
      }
      setLoading(false);
    };
    load();
  }, [report.id, organizationId]);

  const sharedUserIds = new Set(shares.map(s => s.shared_with_user_id));
  // Decode current user ID from token
  let currentUserId = '';
  try {
    const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (tokenKey) {
      const stored = JSON.parse(localStorage.getItem(tokenKey) || '');
      if (stored?.access_token) {
        currentUserId = JSON.parse(atob(stored.access_token.split('.')[1])).sub;
      }
    }
  } catch { /* ignore */ }

  const availableMembers = members.filter(m =>
    m.id !== report.created_by &&
    m.id !== currentUserId &&
    !sharedUserIds.has(m.id) &&
    (search === '' || m.email.toLowerCase().includes(search.toLowerCase()) || m.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddShare = async (userId: string) => {
    try {
      await addShare(report.id, userId, selectedPermission);
      const updatedShares = await fetchShares(report.id);
      setShares(updatedShares);
      setSearch('');
      toast.success('Report shared');
    } catch (err: any) {
      toast.error('Failed to share');
    }
  };

  const handleUpdatePermission = async (shareId: string, permission: 'viewer' | 'editor') => {
    try {
      await updateShare(shareId, permission);
      setShares(shares.map(s => s.id === shareId ? { ...s, permission } : s));
      toast.success('Permission updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await removeShare(shareId);
      setShares(shares.filter(s => s.id !== shareId));
      toast.success('Share removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border ${bg} ${border}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${border}`}>
          <div className="flex items-center gap-2">
            <Share2 className={`w-5 h-5 ${textSecondary}`} />
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Share Report</h2>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${textSecondary} ${hoverBg}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Public toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${isMidnight ? 'bg-white/[0.03] border-white/10' : isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Globe className={`w-5 h-5 ${report.is_public ? 'text-blue-500' : textSecondary}`} />
              <div>
                <p className={`text-sm font-medium ${textPrimary}`}>Public to all team members</p>
                <p className={`text-xs ${textSecondary}`}>Anyone in your organization can view</p>
              </div>
            </div>
            <button
              onClick={onTogglePublic}
              className={`relative w-11 h-6 rounded-full transition-colors ${report.is_public ? 'bg-blue-500' : isMidnight ? 'bg-white/10' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${report.is_public ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Divider */}
          <div className={`border-t ${border}`} />

          {/* Share with specific people */}
          <div>
            <p className={`text-sm font-medium mb-3 ${textPrimary}`}>Share with specific people</p>

            {/* Search + permission selector */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search team members..."
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${inputBg}`}
                />
              </div>
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value as 'viewer' | 'editor')}
                className={`px-3 py-2 rounded-lg border text-sm ${inputBg}`}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>

            {/* Search results */}
            {search && availableMembers.length > 0 && (
              <div className={`rounded-lg border mb-3 max-h-32 overflow-auto ${isMidnight ? 'border-white/10' : isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {availableMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleAddShare(member.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${hoverBg}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-medium">
                      {(member.full_name || member.email)[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${textPrimary}`}>{member.full_name || 'Unnamed'}</p>
                      <p className={`truncate text-xs ${textSecondary}`}>{member.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Current shares */}
            {loading ? (
              <div className={`text-center py-6 text-sm ${textSecondary}`}>Loading...</div>
            ) : shares.length === 0 ? (
              <div className={`text-center py-6 text-sm ${textSecondary}`}>
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Not shared with anyone yet
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map(share => (
                  <div key={share.id} className={`flex items-center justify-between p-3 rounded-lg ${isMidnight ? 'bg-white/[0.03]' : isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs font-medium">
                        {(share.user_name || share.user_email || '?')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm truncate ${textPrimary}`}>{share.user_name || 'User'}</p>
                        <p className={`text-xs truncate ${textSecondary}`}>{share.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={share.permission}
                        onChange={(e) => handleUpdatePermission(share.id, e.target.value as 'viewer' | 'editor')}
                        className={`px-2 py-1 rounded text-xs border ${inputBg}`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        onClick={() => handleRemoveShare(share.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end px-6 py-4 border-t ${border}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Re-export Share2 for use in other components
export { Share2 } from 'lucide-react';
