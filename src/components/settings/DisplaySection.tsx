import { usePreferencesStore } from '@/stores/preferencesStore';
import { Card } from '@/components/theme/ThemeComponents';
import { Monitor } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function DisplaySection() {
  const { preferences, saveDisplayPreferences } = usePreferencesStore();
  const { emailPageSize } = preferences.displayPreferences;

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Display</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Customize how content is displayed across the application
      </p>

      <div className="space-y-6">
        {/* Email page size */}
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <Monitor size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Emails per page
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Set how many email threads are displayed per page in the communications view
            </p>
            <div className="flex gap-2">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => saveDisplayPreferences({ ...preferences.displayPreferences, emailPageSize: size })}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    emailPageSize === size
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
