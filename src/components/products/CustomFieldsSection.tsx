/**
 * CustomFieldsSection - Renders custom field inputs in product forms
 * Takes field definitions and renders appropriate inputs per field type
 * Supports suggestion dropdowns for text/number/currency fields
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Plus } from 'lucide-react';
import { CustomFieldDefinition, FIELD_TYPE_CONFIG } from '@/types/customFields.types';
import toast from 'react-hot-toast';

interface CustomFieldsSectionProps {
  fields: CustomFieldDefinition[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  inputClasses?: string;
  /** Map of field_key -> array of previously used values (strings) */
  suggestions?: Record<string, string[]>;
}

/** Inline combobox for fields with suggestions (creatable) */
function FieldCombobox({
  value,
  onChange,
  suggestions,
  className,
  placeholder,
  required,
  type = 'text',
  min,
  max,
  step,
  prefix,
}: {
  value: any;
  onChange: (val: any) => void;
  suggestions: string[];
  className: string;
  placeholder: string;
  required?: boolean;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  step?: string;
  prefix?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const displayValue = value === 0 && type === 'number' ? '' : (value ?? '');
  const strValue = String(displayValue);

  const filtered = useMemo(() => {
    if (!strValue.trim()) return suggestions;
    const lower = strValue.toLowerCase().trim();
    return suggestions.filter((s) => s.toLowerCase().includes(lower));
  }, [strValue, suggestions]);

  const exactMatch = suggestions.some(
    (s) => s.toLowerCase() === strValue.toLowerCase().trim()
  );

  const showCreateRow = !!(strValue.trim() && !exactMatch);
  const totalItems = filtered.length + (showCreateRow ? 1 : 0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const selectItem = (item: string) => {
    const isNew = !suggestions.some(s => s.toLowerCase() === item.toLowerCase().trim());
    if (type === 'number') {
      const num = parseFloat(item);
      onChange(isNaN(num) ? item : num);
    } else {
      onChange(item);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);

    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 800);

    if (isNew) {
      toast.success(`New value "${item}" added`, { duration: 2000 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === 'ArrowDown' && totalItems > 0) {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(0);
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectItem(filtered[highlightedIndex]);
        } else if (highlightedIndex === filtered.length && showCreateRow) {
          selectItem(strValue.trim());
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (type === 'number') {
      onChange(raw === '' ? '' : parseFloat(raw));
    } else {
      onChange(raw);
    }
    setHighlightedIndex(-1);
    if (!isOpen && suggestions.length > 0) setIsOpen(true);
  };

  const handleClear = () => {
    const prev = strValue;
    onChange(type === 'number' ? '' : '');
    inputRef.current?.focus();

    if (prev.trim()) {
      toast((t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">Cleared &ldquo;{prev}&rdquo;</span>
          <button
            onClick={() => {
              if (type === 'number') {
                const num = parseFloat(prev);
                onChange(isNaN(num) ? prev : num);
              } else {
                onChange(prev);
              }
              toast.dismiss(t.id);
            }}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Undo
          </button>
        </div>
      ), { duration: 4000 });
    }
  };

  const showDropdown = isOpen && totalItems > 0;

  const inputEl = (
    <input
      ref={inputRef}
      type={type}
      value={displayValue}
      onChange={handleInputChange}
      onFocus={() => suggestions.length > 0 && setIsOpen(true)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      step={step}
      className={`${className} pr-14 ${justSelected ? 'ring-2 ring-green-500 border-green-500' : ''}`}
      style={justSelected ? { transition: 'box-shadow 0.3s, border-color 0.3s' } : undefined}
      role="combobox"
      aria-expanded={showDropdown}
      aria-haspopup="listbox"
      aria-autocomplete="list"
      autoComplete="off"
    />
  );

  const buttons = (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
      {strValue && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          tabIndex={-1}
          aria-label="Clear"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); inputRef.current?.focus(); }}
        className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        tabIndex={-1}
        aria-label="Show suggestions"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );

  const dropdown = showDropdown ? (
    <ul
      ref={listRef}
      role="listbox"
      className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg py-1"
    >
      {filtered.map((item, idx) => (
        <li
          key={item}
          role="option"
          aria-selected={highlightedIndex === idx}
          className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
            highlightedIndex === idx
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
          } ${item === strValue ? 'font-medium' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
          onMouseEnter={() => setHighlightedIndex(idx)}
        >
          {item}
        </li>
      ))}
      {showCreateRow && (
        <li
          role="option"
          aria-selected={highlightedIndex === filtered.length}
          className={`px-3 py-2 text-sm cursor-pointer transition-colors border-t border-gray-100 dark:border-gray-600 flex items-center gap-2 ${
            highlightedIndex === filtered.length
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
          onMouseDown={(e) => { e.preventDefault(); selectItem(strValue.trim()); }}
          onMouseEnter={() => setHighlightedIndex(filtered.length)}
        >
          <Plus className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Create &ldquo;<span className="font-semibold">{strValue.trim()}</span>&rdquo;
          </span>
        </li>
      )}
    </ul>
  ) : null;

  if (prefix) {
    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">{prefix}</span>
          {inputEl}
          {buttons}
        </div>
        {dropdown}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {inputEl}
        {buttons}
      </div>
      {dropdown}
    </div>
  );
}

/** Searchable, clearable combobox for select-type custom fields (non-creatable) */
function SelectCombobox({
  value,
  onChange,
  options,
  className,
  placeholder,
  required,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; color?: string }[];
  className: string;
  placeholder: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Find selected option label for display
  const selectedOption = options.find(o => o.value === value);
  const displayText = isOpen ? search : (selectedOption?.label || '');

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const lower = search.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [search, options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const selectOption = (opt: { value: string; label: string }) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();

    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(0);
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectOption(filtered[highlightedIndex]);
        } else {
          setIsOpen(false);
          setSearch('');
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearch('');
  };

  const handleClear = () => {
    const prevOpt = selectedOption;
    onChange('');
    setSearch('');
    inputRef.current?.focus();

    if (prevOpt) {
      toast((t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">Cleared &ldquo;{prevOpt.label}&rdquo;</span>
          <button
            onClick={() => { onChange(prevOpt.value); toast.dismiss(t.id); }}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Undo
          </button>
        </div>
      ), { duration: 4000 });
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayText}
          onChange={(e) => { setSearch(e.target.value); setHighlightedIndex(-1); if (!isOpen) setIsOpen(true); }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required && !value}
          className={`${className} pr-14 ${justSelected ? 'ring-2 ring-green-500 border-green-500' : ''}`}
          style={justSelected ? { transition: 'box-shadow 0.3s, border-color 0.3s' } : undefined}
          role="combobox"
          aria-expanded={isOpen && filtered.length > 0}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              tabIndex={-1}
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => { setIsOpen(!isOpen); inputRef.current?.focus(); }}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            tabIndex={-1}
            aria-label="Toggle options"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg py-1"
        >
          {filtered.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={highlightedIndex === idx}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center gap-2 ${
                highlightedIndex === idx
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
              } ${opt.value === value ? 'font-medium' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {opt.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
              )}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CustomFieldsSection({ fields, values, onChange, inputClasses, suggestions = {} }: CustomFieldsSectionProps) {
  if (fields.length === 0) return null;

  const baseInput = inputClasses || 'w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

  const renderField = (field: CustomFieldDefinition) => {
    const value = values[field.field_key] ?? field.default_value ?? '';
    const placeholder = field.placeholder || FIELD_TYPE_CONFIG[field.field_type]?.defaultPlaceholder || '';
    const fieldSuggestions = suggestions[field.field_key];
    const hasSuggestions = fieldSuggestions && fieldSuggestions.length > 0;

    switch (field.field_type) {
      case 'text':
      case 'phone':
      case 'email':
      case 'url':
        if (hasSuggestions) {
          return (
            <FieldCombobox
              value={value}
              onChange={(val) => onChange(field.field_key, val)}
              suggestions={fieldSuggestions}
              className={baseInput}
              placeholder={placeholder}
              required={field.is_required}
              type="text"
            />
          );
        }
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
        if (hasSuggestions) {
          return (
            <FieldCombobox
              value={value}
              onChange={(val) => onChange(field.field_key, val)}
              suggestions={fieldSuggestions}
              className={baseInput}
              placeholder={placeholder}
              required={field.is_required}
              type="number"
              min={field.validation?.min_value}
              max={field.validation?.max_value}
              step="any"
            />
          );
        }
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
        if (hasSuggestions) {
          return (
            <FieldCombobox
              value={value}
              onChange={(val) => onChange(field.field_key, val)}
              suggestions={fieldSuggestions}
              className={`${baseInput} pl-8`}
              placeholder={placeholder}
              required={field.is_required}
              type="number"
              step="0.01"
              min={0}
              prefix="$"
            />
          );
        }
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
          <SelectCombobox
            value={value}
            onChange={(val) => onChange(field.field_key, val)}
            options={field.options || []}
            className={baseInput}
            placeholder={placeholder || 'Select...'}
            required={field.is_required}
          />
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
