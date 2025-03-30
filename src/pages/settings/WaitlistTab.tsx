import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WaitlistEntry {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  plan_type: string;
  message: string | null;
  created_at: string;
  viewed: boolean;
}

const WaitlistTab: React.FC = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast.error('Failed to load waitlist entries');
    } finally {
      setLoading(false);
    }
  };

  const toggleViewed = async (id: string, viewed: boolean) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ viewed })
        .eq('id', id);

      if (error) throw error;

      setEntries(entries.map(entry => 
        entry.id === id ? { ...entry, viewed } : entry
      ));

      toast.success(viewed ? 'Marked as viewed' : 'Marked as unviewed');
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-400">Loading waitlist entries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Waitlist Entries</h2>
        <div className="text-sm text-gray-400">
          Total Entries: {entries.length}
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {entries.map((entry) => (
                <tr key={entry.id} className={`hover:bg-dark-700/50 ${entry.viewed ? 'opacity-75' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{entry.full_name}</div>
                    {entry.company && (
                      <div className="text-sm text-gray-400">{entry.company}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-sm text-gray-300">
                        <Mail size={14} className="mr-1" />
                        {entry.email}
                      </div>
                      {entry.phone && (
                        <div className="flex items-center text-sm text-gray-300">
                          <Phone size={14} className="mr-1" />
                          {entry.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-900/30 text-primary-400">
                      {entry.plan_type}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.viewed 
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {entry.viewed ? 'Viewed' : 'New'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleViewed(entry.id, !entry.viewed)}
                      className="text-gray-400 hover:text-white"
                    >
                      {entry.viewed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {entries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No waitlist entries yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitlistTab;