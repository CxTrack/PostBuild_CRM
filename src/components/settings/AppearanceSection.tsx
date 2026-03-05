import { useThemeStore, Theme } from '@/stores/themeStore';
import { Sun, Moon, Palette, Sparkles, Check } from 'lucide-react';
import { Card } from '@/components/theme/ThemeComponents';

export default function AppearanceSection() {
  const { theme, setTheme } = useThemeStore();

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      description: 'Clean and bright',
      icon: Sun,
      previewBg: 'bg-white',
      previewBorder: 'border-gray-200',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes',
      icon: Moon,
      previewBg: 'bg-gray-900',
      previewBorder: 'border-gray-700',
    },
    {
      value: 'soft-modern',
      label: 'Soft Modern',
      description: 'Warm and tactile',
      icon: Palette,
      previewBg: 'bg-soft-cream',
      previewBorder: 'border-soft-cream-dark',
    },
    {
      value: 'midnight',
      label: 'Midnight',
      description: 'Premium dark experience',
      icon: Sparkles,
      previewBg: 'bg-black',
      previewBorder: 'border-yellow-500/30',
    },
  ];

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appearance</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose the theme that fits your style
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {themeOptions.map((themeOption) => {
          const IconComponent = themeOption.icon;
          const isSelected = theme === themeOption.value;

          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value as Theme)}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${isSelected
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
              }`}
            >
              <div className={`w-full h-32 rounded-xl mb-4 ${themeOption.previewBg} flex items-center justify-center border-2 ${themeOption.previewBorder}`}>
                <IconComponent size={40} className={isSelected ? 'text-primary-600' : 'text-gray-400'} />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">
                    {themeOption.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {themeOption.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
