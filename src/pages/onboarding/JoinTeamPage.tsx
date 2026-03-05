import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Link, ArrowRight, Users, Building2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

const INDUSTRY_LABELS: Record<string, string> = {
  tax_accounting: 'Tax & Accounting',
  distribution_logistics: 'Distribution',
  gyms_fitness: 'Gyms & Fitness',
  contractors_home_services: 'Contractors',
  healthcare: 'Healthcare',
  real_estate: 'Real Estate',
  legal_services: 'Legal Services',
  general_business: 'General Business',
  agency: 'Agency',
  mortgage_broker: 'Mortgage',
  construction: 'Construction',
};

function getAuthToken(): string | null {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* skip */ }
    }
  }
  return null;
}

interface OrgResult {
  org_id: string;
  org_name: string;
  industry: string;
  member_count: number;
}

export default function JoinTeamPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'invite' | 'search'>('invite');
  const [inviteLink, setInviteLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OrgResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestingOrgId, setRequestingOrgId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showMessageModal, setShowMessageModal] = useState<OrgResult | null>(null);
  const [requestSent, setRequestSent] = useState<string | null>(null);

  const handleInviteSubmit = () => {
    if (!inviteLink.trim()) {
      toast.error('Please enter an invite link or code');
      return;
    }

    // Extract token from invite link or use raw token
    let token = inviteLink.trim();
    try {
      const url = new URL(token);
      const params = new URLSearchParams(url.search);
      if (params.get('token')) {
        token = params.get('token')!;
      }
    } catch {
      // Not a URL, treat as raw token
    }

    navigate(`/accept-invite?token=${token}`);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error('Please enter at least 2 characters');
      return;
    }

    setSearching(true);
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        toast.error('Please sign in first');
        return;
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/search_organizations_public`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_query: searchQuery.trim() }),
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data || []);

      if (!data || data.length === 0) {
        toast('No organizations found matching that name', { icon: '🔍' });
      }
    } catch (err) {
      console.error('[JoinTeam] Search error:', err);
      toast.error('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleRequestJoin = async (org: OrgResult) => {
    setRequestingOrgId(org.org_id);
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        toast.error('Please sign in first');
        return;
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/request_to_join_organization`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_org_id: org.org_id,
          p_message: requestMessage || null,
        }),
      });

      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();

      if (data.success) {
        setRequestSent(org.org_id);
        setShowMessageModal(null);
        setRequestMessage('');
        toast.success(`Request sent to ${org.org_name}! You'll be notified when they respond.`);
      } else {
        toast.error(data.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('[JoinTeam] Request error:', err);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setRequestingOrgId(null);
    }
  };

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-6">
      <OnboardingHeader />

      <div className="max-w-lg mx-auto">
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={() => navigate('/onboarding/profile')}
              className="text-white/30 hover:text-white/60 text-xs font-bold uppercase tracking-widest mb-4 transition-colors"
            >
              &larr; Back
            </button>
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight text-center">
              Join Your Team
            </h1>
            <p className="text-white/40 text-sm mt-2 text-center max-w-[300px]">
              Use an invite link or search for your organization
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('invite')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'invite'
                  ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Link className="w-4 h-4" />
              Invite Link
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'search'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* Invite Link Tab */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                  Invite Link or Code
                </label>
                <input
                  type="text"
                  placeholder="Paste your invite link or token here"
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                />
              </div>
              <button
                onClick={handleInviteSubmit}
                className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] flex items-center justify-center gap-2"
              >
                Join Team
                <ArrowRight size={18} />
              </button>
              <p className="text-white/20 text-xs text-center">
                Ask your team admin for an invite link if you don't have one
              </p>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-blue-400/70 ml-1">
                  Organization Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search for your company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {searchResults.map((org) => (
                    <div
                      key={org.org_id}
                      className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-white/[0.15] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{org.org_name}</p>
                          <p className="text-white/30 text-xs">
                            {INDUSTRY_LABELS[org.industry] || org.industry || 'Business'} &middot; {org.member_count} {org.member_count === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                      </div>

                      {requestSent === org.org_id ? (
                        <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          Sent
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowMessageModal(org)}
                          disabled={requestingOrgId === org.org_id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {requestingOrgId === org.org_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Request to Join'
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-white/30 text-sm">No organizations found</p>
                  <p className="text-white/15 text-xs mt-1">
                    Try a different search term, or ask your admin for an invite link
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Request to Join</h2>
              <p className="text-white/40 text-sm">
                Send a request to <span className="text-white/70 font-semibold">{showMessageModal.org_name}</span>
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">
                Message (optional)
              </label>
              <textarea
                placeholder="Hi, I'd like to join your team..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={3}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowMessageModal(null); setRequestMessage(''); }}
                className="flex-1 py-3 text-white/40 hover:text-white/70 text-sm font-bold rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestJoin(showMessageModal)}
                disabled={requestingOrgId === showMessageModal.org_id}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {requestingOrgId === showMessageModal.org_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
