import { usePreferencesStore } from '@/stores/preferencesStore';
import { useVisibleModules } from '@/hooks/useVisibleModules';
import { usePageLabels } from '@/hooks/usePageLabels';
import { Users, Calendar as CalendarIcon, Package, FileText, DollarSign, Phone, TrendingUp, CheckSquare, Check, MoreVertical, Smartphone, LayoutGrid } from 'lucide-react';
import { Card } from '@/components/theme/ThemeComponents';

export default function MobileNavSection() {
  const { preferences, saveMobileNavItems } = usePreferencesStore();
  const { visibleModules } = useVisibleModules();
  const enabledModuleIds = visibleModules.map(m => m.id);

  const crmLabels = usePageLabels('crm');
  const calendarLabels = usePageLabels('calendar');
  const quotesLabels = usePageLabels('quotes');
  const invoicesLabels = usePageLabels('invoices');
  const pipelineLabels = usePageLabels('pipeline');
  const tasksLabels = usePageLabels('tasks');

  const ALL_MOBILE_NAV_OPTIONS = [
    { path: '/customers', label: crmLabels.entityPlural, icon: Users, moduleId: 'crm' },
    { path: '/calendar', label: calendarLabels.title, icon: CalendarIcon, moduleId: 'calendar' },
    { path: '/products', label: 'Products', icon: Package, moduleId: 'products' },
    { path: '/quotes', label: quotesLabels.entityPlural, icon: FileText, moduleId: 'quotes' },
    { path: '/invoices', label: invoicesLabels.entityPlural, icon: DollarSign, moduleId: 'invoices' },
    { path: '/calls', label: 'Calls', icon: Phone, moduleId: 'calls' },
    { path: '/pipeline', label: pipelineLabels.title, icon: TrendingUp, moduleId: 'pipeline' },
    { path: '/tasks', label: tasksLabels.entityPlural, icon: CheckSquare, moduleId: 'tasks' },
  ];

  const MOBILE_NAV_OPTIONS = ALL_MOBILE_NAV_OPTIONS.filter(opt => enabledModuleIds.includes(opt.moduleId));

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mobile Quick Access</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
        Customize your mobile bottom navigation. Select your top 3 most used features for quick access. (Home and More are always included).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOBILE_NAV_OPTIONS.map((option) => {
          const selectedItems = preferences.mobileNavItems || [];
          const isSelected = selectedItems.includes(option.path);
          const isMaxReached = selectedItems.length >= 3 && !isSelected;

          return (
            <button
              key={option.path}
              disabled={isMaxReached}
              onClick={() => {
                if (isSelected) {
                  saveMobileNavItems(selectedItems.filter(p => p !== option.path));
                } else if (selectedItems.length < 3) {
                  saveMobileNavItems([...selectedItems, option.path]);
                }
              }}
              className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left group ${isSelected
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : isMaxReached
                  ? 'opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800'
                  : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 active:scale-95'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-gray-600'}`}>
                <option.icon size={22} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white leading-tight">{option.label}</p>
                {isSelected ? (
                  <div className="flex items-center text-[10px] text-blue-600 mt-0.5 font-bold uppercase tracking-wider">
                    <Check size={10} className="mr-1" />
                    Selected
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Available</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center">
          <Smartphone size={16} className="mr-2 text-blue-600" />
          Bottom Bar Preview
        </p>
        <div className="flex justify-around items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
          <div className="flex flex-col items-center opacity-40"><LayoutGrid size={18} /><span className="text-[8px] mt-1 font-bold">Home</span></div>
          {(preferences.mobileNavItems || []).map(path => {
            const item = MOBILE_NAV_OPTIONS.find(o => o.path === path);
            if (!item) return null;
            return (
              <div key={path} className="flex flex-col items-center text-blue-600">
                <item.icon size={18} />
                <span className="text-[8px] mt-1 font-bold">{item.label}</span>
              </div>
            );
          })}
          <div className="flex flex-col items-center opacity-40"><MoreVertical size={18} /><span className="text-[8px] mt-1 font-bold">More</span></div>
        </div>
      </div>
    </Card>
  );
}
