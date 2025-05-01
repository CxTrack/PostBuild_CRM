import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import ProfileTab from './ProfileTab';
import NotificationsTab from './NotificationsTab';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import DataExportTab from './DataExportTab';
import WaitlistTab from './WaitlistTab';
import BillingTab from './BillingTab';
import AIAgentsTab from './AIAgentsTab';
import EmailTab from './EmailTab';
import IntegrationsTab from './IntegrationsTab';

const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { currentSubscription } = useSubscriptionStore();

  // Check if user has access to premium features
  const hasPremiumAccess = currentSubscription?.plan_id && ['business', 'enterprise'].includes(currentSubscription.plan_id);

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'billing':
        return <BillingTab />;
      case 'ai-agents':
        return <AIAgentsTab />;
      case 'integrations':
        return <IntegrationsTab />;
      case 'email':
        return <EmailTab />;
      case 'data-export':
        return <DataExportTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'waitlist':
        return <WaitlistTab />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => navigate('/settings')}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeTab === 'profile' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-800'
            }`}
          >
            Profile
          </button>
          
          <button
            onClick={() => navigate('/settings?tab=billing')}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeTab === 'billing' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-800'
            }`}
          >
            Billing & Subscription
          </button>

          {/* <button
            onClick={() => navigate('/settings?tab=ai-agents')}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeTab === 'ai-agents' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-800'
            }`}
          >
            AI Agents
            {!hasPremiumAccess && (
              <span className="ml-2 text-yellow-400">★</span>
            )}
          </button> */}

          <button
            onClick={() => navigate('/settings?tab=integrations')}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeTab === 'integrations' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-800'
            }`}
          >
            Integrations
          </button>

          {/* <button
            onClick={() => navigate('/settings?tab=email')}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeTab === 'email' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-800'
            }`}
          >
            Email Settings
          </button> */}

          <button
            onClick={() => navigate('/settings?tab=data-export')}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeTab === 'data-export' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-800'
            }`}
          >
            Data Export
          </button>

          {/* <button
            onClick={() => navigate('/settings?tab=notifications')}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              activeTab === 'notifications' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-800'
            }`}
          >
            Notifications
          </button> */}

          {user?.email === 'maniksharmawork@gmail.com' && (
            <button
              onClick={() => navigate('/settings?tab=waitlist')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'waitlist' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-800'
              }`}
            >
              Waitlist
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1">
          {renderTab()}
        </div>
      </div>
    </div>
  );
};

export default Settings;