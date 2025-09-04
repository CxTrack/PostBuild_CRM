import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Calendar, DollarSign, FileText, Handshake, PhoneIncoming, Settings, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useActivityStore } from '../../stores/activitiesStore';
import { RecentActivityType } from '../../types/recent.activity.type';
import { formatDateTimeUTC } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';

interface RecentActivitiesProps {
  activityTypes?: RecentActivityType[]; // optional for getCustomerActivities
  customerId?: string; // optional for getCustomerActivities
  fetchFunction: (customer_id?: string, types?: RecentActivityType[]) => Promise<void>;
  title?: string;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activityTypes,
  customerId,
  fetchFunction,
  title = 'Recent Activity'
}) => {
  const navigate = useNavigate();
  const { activities } = useActivityStore();

  useEffect(() => {
    const loadData = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        navigate('/login');
        return;
      }

      // Decide what to pass based on props
      if (fetchFunction === undefined) return;

      if (customerId) {
        await fetchFunction(customerId);
      } else {
        await fetchFunction(userData.user.id, activityTypes);
      }
    };

    loadData();
  }, []);

  return (
    <div className="card bg-dark-800 border border-dark-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {activities!.length > 0 ? (
        <div className="space-y-4 max-h-[90vh] overflow-y-auto pr-2">
          {activities!.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-md bg-dark-700/50 hover:bg-dark-700 transition-colors"
            >
              <div
                className={`p-2 rounded-md ${
                  activity.type === 'invoice'
                    ? 'bg-blue-500/20 text-blue-500'
                    : activity.type === 'purchase'
                    ? 'bg-purple-500/20 text-purple-500'
                    : activity.type === 'customer'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-amber-500/20 text-amber-500'
                }`}
              >
                {activity.activity_type === 'lead' && <Handshake size={18} />}
                {activity.activity_type === 'call' && <PhoneIncoming size={18} />}
                {activity.activity_type === 'task' && <FileText size={18} />}
                {activity.activity_type === 'opportunity' && <DollarSign size={18} />}
                {activity.activity_type === 'calender_event' && <Calendar size={18} />}
                {activity.activity_type === 'system' && <Settings size={18} />}
                {activity.activity_type === 'product' && <ShoppingCart size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{activity.title}</p>
                {activity.activity && <div>{activity.activity}</div>}
                <div className="text-sm text-gray-400 mt-1">
                  {activity.created_at && <div>{formatDateTimeUTC(activity.created_at)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="flex flex-col items-center justify-center">
            <FileText size={48} className="text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No recent activity</p>
            <p className="text-gray-500 text-sm mb-6">Your recent activities will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivities;
