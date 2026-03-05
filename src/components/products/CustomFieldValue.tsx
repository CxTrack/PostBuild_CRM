/**
 * CustomFieldValue - Display component for custom field values in table cells
 */

import type { CustomFieldDefinition } from '@/types/customFields.types';

interface CustomFieldValueProps {
  field: CustomFieldDefinition;
  value: any;
}

export default function CustomFieldValue({ field, value }: CustomFieldValueProps) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-gray-400 dark:text-gray-600">--</span>;
  }

  switch (field.field_type) {
    case 'currency':
      return (
        <span className="font-medium text-gray-900 dark:text-white">
          ${typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
        </span>
      );

    case 'number':
      return (
        <span className="font-medium text-gray-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      );

    case 'checkbox':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );

    case 'select': {
      const option = field.options?.find(o => o.value === value);
      if (option?.color) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: option.color + '20', color: option.color }}>
            {option.label}
          </span>
        );
      }
      return <span className="text-gray-900 dark:text-white">{option?.label || value}</span>;
    }

    case 'multiselect': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1">
          {selected.map(v => {
            const opt = field.options?.find(o => o.value === v);
            return (
              <span key={v} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {opt?.label || v}
              </span>
            );
          })}
        </div>
      );
    }

    case 'url':
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate block max-w-[200px]">
          {value.replace(/^https?:\/\//, '')}
        </a>
      );

    case 'email':
      return (
        <a href={`mailto:${value}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
          {value}
        </a>
      );

    case 'date':
      try {
        return <span className="text-gray-900 dark:text-white">{new Date(value).toLocaleDateString()}</span>;
      } catch {
        return <span className="text-gray-900 dark:text-white">{value}</span>;
      }

    case 'datetime':
      try {
        return <span className="text-gray-900 dark:text-white">{new Date(value).toLocaleString()}</span>;
      } catch {
        return <span className="text-gray-900 dark:text-white">{value}</span>;
      }

    default:
      return <span className="text-gray-900 dark:text-white">{String(value)}</span>;
  }
}
