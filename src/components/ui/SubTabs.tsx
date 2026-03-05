import React from 'react';

interface SubTab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface SubTabsProps {
  tabs: SubTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const SubTabs: React.FC<SubTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
