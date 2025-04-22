import React, { useState, useEffect } from 'react';
import { Plus, Mail, Check, X, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import ConfirmationModal from '../../components/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { formatPhoneNumber } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  employee_id?: string;
  telephone?: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
}

interface InviteFormData {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  employee_id?: string;
  telephone?: string;
}

const DirectReports: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormData>();
  const [phoneValue, setPhoneValue] = useState('');

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '');
    // Limit to 10 digits
    const truncated = digits.slice(0, 10);
    setPhoneValue(formatPhoneNumber(truncated));
    // Store raw digits in form
    register('telephone').onChange({
      target: { value: truncated, name: 'telephone' }
    });
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email, role, employee_id, telephone, status')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (data: InviteFormData) => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: insertError } = await supabase
        .from('team_members')
        .insert([{
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          role: data.role,
          employee_id: data.employee_id || null,
          telephone: data.telephone || null,
          status: 'active',
          parent_user_id: user.id
        }]);

      if (insertError) throw insertError;
      
      toast.success('Team member created successfully');
      setShowInviteModal(false);
      reset();
      fetchTeamMembers();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  const removeTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Team member removed successfully');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const handleDeleteClick = (id: string) => {
    setMemberToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) removeTeamMember(memberToDelete);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Direct Reports</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Team Member</span>
        </button>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Telephone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-dark-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {member.first_name} {member.last_name}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {member.employee_id || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {member.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {member.telephone ? formatPhoneNumber(member.telephone) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{member.role}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-green-900/30 text-green-400' :
                      member.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setPhoneValue(member.telephone ? formatPhoneNumber(member.telephone) : '');
                          setShowEditModal(true);
                        }}
                        className="text-gray-400 hover:text-primary-400"
                        title="Edit Team Member"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(member.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Remove Team Member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teamMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No team members found. Add your first team member to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Add Team Member</h3>
            
            <form onSubmit={handleSubmit(sendInvite)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    {...register('first_name', { required: 'First name is required' })}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-400">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    {...register('last_name', { required: 'Last name is required' })}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-400">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input w-full"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telephone
                </label>
                <input
                  type="tel"
                  className="input"
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  className="input w-full"
                  {...register('employee_id')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="input w-full"
                  {...register('role', { required: 'Role is required' })}
                >
                  <option value="">Select a role</option>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Account Manager">Account Manager</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Support Agent">Support Agent</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-400">{errors.role.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <span>Create Team Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Team Member</h3>
            
            <form onSubmit={handleSubmit(async (data) => {
              try {
                const { error } = await supabase
                  .from('team_members')
                  .update({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    role: data.role,
                    employee_id: data.employee_id || null,
                    telephone: data.telephone || null
                  })
                  .eq('id', selectedMember.id);

                if (error) throw error;
                
                toast.success('Team member updated successfully');
                setShowEditModal(false);
                setSelectedMember(null);
                reset();
                fetchTeamMembers();
              } catch (error) {
                console.error('Error updating team member:', error);
                toast.error('Failed to update team member');
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    defaultValue={selectedMember.first_name}
                    {...register('first_name', { required: 'First name is required' })}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-400">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    defaultValue={selectedMember.last_name}
                    {...register('last_name', { required: 'Last name is required' })}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-400">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input w-full"
                  defaultValue={selectedMember.email}
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telephone
                </label>
                <input
                  type="tel"
                  className="input"
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  className="input w-full"
                  defaultValue={selectedMember.employee_id}
                  {...register('employee_id')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="input w-full"
                  defaultValue={selectedMember.role}
                  {...register('role', { required: 'Role is required' })}
                >
                  <option value="">Select a role</option>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Account Manager">Account Manager</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Support Agent">Support Agent</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-400">{errors.role.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <span>Update Team Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? This action cannot be undone."
        confirmButtonText="Remove"
        cancelButtonText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

export default DirectReports;