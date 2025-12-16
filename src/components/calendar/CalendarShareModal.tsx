import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { useCalendarStore } from '../../stores/calendarStore';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface CalendarShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarShareModal: React.FC<CalendarShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { calendarShares, inviteUser, revokeAccess, fetchCalendarShares, loading } = useCalendarStore();
  const [emailInput, setEmailInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer');

  useEffect(() => {
    if (isOpen) {
      fetchCalendarShares();
      setEmailInput(''); // Reset email input when modal opens
    }
  }, [isOpen, fetchCalendarShares]);

  const handleInvite = async () => {
    const email = emailInput.trim();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSearching(true);
    try {
      // Get current user to exclude from search
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if trying to share with self
      if (currentUser.email?.toLowerCase() === email.toLowerCase()) {
        toast.error('Cannot share calendar with yourself');
        setIsSearching(false);
        return;
      }

      console.log('🔍 Searching for user with email:', email);
      
      // Search for user by email using database function
      const { data: userData, error: userError } = await supabase
        .rpc('find_user_by_email', { search_email: email });

      console.log('📊 RPC Response:', { 
        hasData: !!userData, 
        dataLength: userData?.length, 
        data: userData,
        error: userError 
      });

      if (userError) {
        console.error('❌ Error searching for user:', {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code,
          email: email
        });
        toast.error(`Failed to search for user: ${userError.message || 'Unknown error'}`);
        setIsSearching(false);
        return;
      }

      if (!userData || userData.length === 0 || !userData[0]) {
        console.log('⚠️ No user found for email:', email);
        toast.error('Failed to find a matching account');
        setIsSearching(false);
        return;
      }

      console.log('✅ User found:', userData[0]);

      const targetUser = userData[0];

      // Check if already shared
      const alreadyShared = calendarShares.some(
        share => share.shared_with_id === targetUser.id
      );
      
      if (alreadyShared) {
        toast.error('Calendar is already shared with this user');
        setIsSearching(false);
        return;
      }

      // Share the calendar
      console.log('📤 Sharing calendar with user:', targetUser.id, 'as', selectedRole);
      await inviteUser(targetUser.id, selectedRole);
      console.log('✅ Calendar shared successfully');
      toast.success(`Shared successfully as ${selectedRole}`);
      setEmailInput('');
      setSelectedRole('viewer'); // Reset to default
      await fetchCalendarShares(); // Refresh the shares list
    } catch (error: any) {
      console.error('❌ Error in handleInvite:', {
        error,
        message: error?.message,
        stack: error?.stack,
        email: emailInput
      });
      if (error.message && !error.message.includes('Failed to find')) {
        toast.error(error.message || 'Failed to share calendar');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleRevoke = async (shareId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${userEmail}?`)) {
      return;
    }

    try {
      await revokeAccess(shareId);
      toast.success('Access revoked successfully');
      await fetchCalendarShares(); // Refresh the shares list
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke access');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Share Calendar</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Invite User Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Invite User to Your Calendar
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              className="input flex-1"
              placeholder="Enter user's email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSearching && !loading) {
                  handleInvite();
                }
              }}
              disabled={isSearching || loading}
            />
            <button
              onClick={handleInvite}
              disabled={!emailInput.trim() || isSearching || loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <UserPlus size={16} />
              Invite
            </button>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="viewer"
                checked={selectedRole === 'viewer'}
                onChange={(e) => setSelectedRole(e.target.value as 'viewer' | 'editor')}
                className="w-4 h-4 text-primary"
                disabled={isSearching || loading}
              />
              <span className="text-sm text-gray-300">Viewer (can view events)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="editor"
                checked={selectedRole === 'editor'}
                onChange={(e) => setSelectedRole(e.target.value as 'viewer' | 'editor')}
                className="w-4 h-4 text-primary"
                disabled={isSearching || loading}
              />
              <span className="text-sm text-gray-300">Editor (can view and edit events)</span>
            </label>
          </div>
        </div>

        {/* Shared Users List */}
        <div>
          <h4 className="text-md font-medium text-white mb-3">
            Users with Access ({calendarShares.length})
          </h4>
          {calendarShares.length === 0 ? (
            <p className="text-sm text-gray-400">No users have access to your calendar yet.</p>
          ) : (
            <div className="space-y-2">
              {calendarShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">
                        {share.shared_with_email || 'Unknown User'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        share.role === 'editor' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {share.role === 'editor' ? 'Editor' : 'Viewer'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Shared on {new Date(share.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(share.id, share.shared_with_email || '')}
                    disabled={loading}
                    className="btn btn-danger btn-sm flex items-center gap-1"
                    title="Revoke access"
                  >
                    <Trash2 size={14} />
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarShareModal;

