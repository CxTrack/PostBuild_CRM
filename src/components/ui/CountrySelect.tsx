import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { COUNTRIES, findCountryFromValue, normalizeCountryName } from '@/constants/countries';
import type { CountryData } from '@/constants/countries';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showFlag?: boolean;
  /** What onChange receives: full country name (default) or ISO code */
  valueFormat?: 'name' | 'iso';
  /** Show "Other" option for free-text entry of unlisted countries (default: true) */
  allowCustom?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder = 'Select country',
  className = '',
  disabled = false,
  showFlag = true,
  valueFormat = 'name',
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Resolve the current value to a CountryData (if known)
  const resolvedCountry: CountryData | undefined = findCountryFromValue(value);

  // Display text for the trigger button
  const displayText = resolvedCountry
    ? resolvedCountry.name
    : value || '';

  const displayFlag = resolvedCountry?.flag;

  // Filter countries by search term
  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.iso.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const handleSelect = useCallback((country: CountryData) => {
    const emitValue = valueFormat === 'iso' ? country.iso : country.name;
    onChange(emitValue);
    setIsOpen(false);
    setSearch('');
    setHighlightIndex(-1);
    setCustomMode(false);
  }, [onChange, valueFormat]);

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onChange(trimmed);
    }
    setIsOpen(false);
    setSearch('');
    setCustomMode(false);
    setCustomValue('');
  }, [customValue, onChange]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (customMode) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomSubmit();
      } else if (e.key === 'Escape') {
        setCustomMode(false);
        setCustomValue('');
      }
      return;
    }

    const totalItems = filtered.length + (allowCustom ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      if (highlightIndex < filtered.length) {
        handleSelect(filtered[highlightIndex]);
      } else if (allowCustom) {
        setCustomMode(true);
        setCustomValue('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
      setHighlightIndex(-1);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-select-item]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setCustomMode(false);
        setCustomValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, customMode]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { if (!disabled) { setIsOpen(!isOpen); setHighlightIndex(-1); } }}
        disabled={disabled}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left text-sm transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'
        } ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlag && displayFlag && (
          <span className="text-base leading-none">{displayFlag}</span>
        )}
        <span className={`flex-1 truncate ${displayText ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
          {displayText || placeholder}
        </span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {customMode ? (
            /* Custom country entry */
            <div className="p-3">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Enter country name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Colombia"
                className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setCustomMode(false); setCustomValue(''); }}
                  className="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  disabled={!customValue.trim()}
                  className="flex-1 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search input */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search countries..."
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Country list */}
              <div ref={listRef} className="max-h-52 overflow-y-auto" role="listbox">
                {filtered.length === 0 && !allowCustom ? (
                  <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No countries found
                  </div>
                ) : (
                  <>
                    {filtered.map((country, index) => (
                      <button
                        key={country.iso}
                        type="button"
                        data-select-item
                        role="option"
                        aria-selected={resolvedCountry?.iso === country.iso}
                        onClick={() => handleSelect(country)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                          index === highlightIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : resolvedCountry?.iso === country.iso
                              ? 'bg-gray-50 dark:bg-gray-700/50'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {showFlag && (
                          <span className="text-base leading-none">{country.flag}</span>
                        )}
                        <span className="flex-1 text-gray-900 dark:text-white truncate">{country.name}</span>
                      </button>
                    ))}

                    {/* "Other" option */}
                    {allowCustom && (
                      <button
                        type="button"
                        data-select-item
                        onClick={() => { setCustomMode(true); setCustomValue(''); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left border-t border-gray-200 dark:border-gray-700 transition-colors ${
                          highlightIndex === filtered.length
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Globe size={16} className="text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">Other (enter manually)</span>
                      </button>
                    )}

                    {filtered.length === 0 && allowCustom && (
                      <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        No matches. Use "Other" to enter manually.
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CountrySelect;
