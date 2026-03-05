/**
 * CustomFieldsSection - Renders custom field inputs in product forms
 * Takes field definitions and renders appropriate inputs per field type
 */

import { CustomFieldDefinition, FIELD_TYPE_CONFIG } from '@/types/customFields.types';

interface CustomFieldsSectionProps {
  fields: CustomFieldDefinition[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  inputClasses?: string;
}

export default function CustomFieldsSection({ fields, values, onChange, inputClasses }: CustomFieldsSectionProps) {
  if (fields.length === 0) return null;

  const baseInput = inputClasses || 'w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

  const renderField = (field: CustomFieldDefinition) => {
    const value = values[field.field_key] ?? field.default_value ?? '';
    const placeholder = field.placeholder || FIELD_TYPE_CONFIG[field.field_type]?.defaultPlaceholder || '';

    switch (field.field_type) {
      case 'text':
      case 'phone':
      case 'email':
      case 'url':
        return (
          <input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => onChange(field.field_key, e.target.value)}
            placeholder={placeholder}
            required={field.is_required}
            className={baseInput}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(field.field_key, e.target.value)}
            placeholder={placeholder}
            required={field.is_required}
            rows={3}
            className={baseInput}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value === 0 ? '' : value}
            onChange={(e) => onChange(field.field_key, e.target.value === '' ? '' : parseFloat(e.target.value))}
            placeholder={placeholder}
            required={field.is_required}
            min={field.validation?.min_value}
            max={field.validation?.max_value}
            step="any"
            className={baseInput}
          />
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
            <input
              type="number"
              value={value === 0 ? '' : value}
              onChange={(e) => onChange(field.field_key, e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder={placeholder}
              required={field.is_required}
              step="0.01"
              min="0"
              className={`${baseInput} pl-8`}
            />
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(field.field_key, e.target.value)}
            required={field.is_required}
            className={baseInput}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(field.field_key, e.target.value)}
            required={field.is_required}
            className={baseInput}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(field.field_key, e.target.value)}
            required={field.is_required}
            className={baseInput}
          >
            <option value="">{placeholder || 'Select...'}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'multiselect': {
        const selected: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => {
                    const newVal = e.target.checked
                      ? [...selected, opt.value]
                      : selected.filter(v => v !== opt.value);
                    onChange(field.field_key, newVal);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(field.field_key, e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.description || 'Yes'}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(field.field_key, e.target.value)}
            placeholder={placeholder}
            className={baseInput}
          />
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-purple-600 dark:text-purple-400"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        Custom Fields
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.field_label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {field.description && field.field_type !== 'checkbox' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{field.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
