import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY_ISO, parseE164Country, formatE164 } from '@/constants/countries';
import type { CountryData } from '@/constants/countries';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  countryCode?: string;
  onCountryChange?: (iso: string) => void;
}

/** Format national digits for +1 (North American) display */
const formatNorthAmerican = (digits: string): string => {
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

/** Format national digits for international display (space-grouped) */
const formatInternational = (digits: string): string => {
  if (digits.length === 0) return '';
  // Group in chunks of 3-4 for readability
  const parts: string[] = [];
  let i = 0;
  while (i < digits.length) {
    const remaining = digits.length - i;
    const chunk = remaining > 4 ? 3 : remaining;
    parts.push(digits.slice(i, i + chunk));
    i += chunk;
  }
  return parts.join(' ');
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, countryCode, onCountryChange, className = '', ...props }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState<CountryData>(
      COUNTRIES.find(c => c.iso === (countryCode || DEFAULT_COUNTRY_ISO)) || COUNTRIES[0]
    );
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Auto-detect country from E.164 value on mount / value change
    useEffect(() => {
      if (!value) return;
      const { country } = parseE164Country(value, countryCode || selectedCountry.iso);
      if (country && country.iso !== selectedCountry.iso) {
        setSelectedCountry(country);
      }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync with external countryCode prop
    useEffect(() => {
      if (countryCode) {
        const match = COUNTRIES.find(c => c.iso === countryCode.toUpperCase());
        if (match && match.iso !== selectedCountry.iso) {
          setSelectedCountry(match);
        }
      }
    }, [countryCode]); // eslint-disable-line react-hooks/exhaustive-deps

    // Extract national number from current value
    const getNationalDigits = useCallback((): string => {
      if (!value) return '';
      const { nationalNumber } = parseE164Country(value, selectedCountry.iso);
      return nationalNumber;
    }, [value, selectedCountry.iso]);

    // Display value based on selected country
    const displayValue = selectedCountry.dialCode === '+1'
      ? formatNorthAmerican(getNationalDigits())
      : formatInternational(getNationalDigits());

    // Emit synthetic event with full E.164 value
    const emitChange = useCallback((nationalDigits: string, country: CountryData, originalEvent: React.ChangeEvent<HTMLInputElement>) => {
      const e164 = nationalDigits ? formatE164(country.dialCode, nationalDigits) : '';
      const syntheticEvent = {
        ...originalEvent,
        target: { ...originalEvent.target, value: e164 },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    }, [onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '');
      emitChange(digits, selectedCountry, e);
    };

    const handleCountrySelect = (country: CountryData) => {
      setSelectedCountry(country);
      setDropdownOpen(false);
      setSearch('');
      setHighlightIndex(-1);
      onCountryChange?.(country.iso);

      // Re-emit current national number with new dial code
      const nationalDigits = getNationalDigits();
      if (nationalDigits && onChange) {
        const e164 = formatE164(country.dialCode, nationalDigits);
        const fakeEvent = {
          target: { value: e164 },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(fakeEvent);
      }
    };

    // Filter countries by search
    const filtered = search
      ? COUNTRIES.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search) ||
          c.iso.toLowerCase().includes(search.toLowerCase())
        )
      : COUNTRIES;

    // Keyboard navigation in dropdown
    const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && highlightIndex >= 0 && filtered[highlightIndex]) {
        e.preventDefault();
        handleCountrySelect(filtered[highlightIndex]);
      } else if (e.key === 'Escape') {
        setDropdownOpen(false);
        setSearch('');
      }
    };

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightIndex >= 0 && dropdownRef.current) {
        const items = dropdownRef.current.querySelectorAll('[data-country-item]');
        items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
      }
    }, [highlightIndex]);

    // Close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setDropdownOpen(false);
          setSearch('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (dropdownOpen && searchRef.current) {
        searchRef.current.focus();
      }
    }, [dropdownOpen]);

    return (
      <div ref={containerRef} className="relative">
        <div className="flex">
          {/* Country selector button */}
          <button
            type="button"
            onClick={() => { setDropdownOpen(!dropdownOpen); setHighlightIndex(-1); }}
            className="flex items-center gap-1 px-2.5 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors shrink-0"
            aria-label="Select country code"
            aria-expanded={dropdownOpen}
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span>{selectedCountry.dialCode}</span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Phone number input */}
          <input
            ref={ref}
            type="tel"
            value={displayValue}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
            placeholder={selectedCountry.dialCode === '+1' ? '(555) 123-4567' : '123 456 7890'}
            {...props}
          />
        </div>

        {/* Country dropdown */}
        {dropdownOpen && (
          <div
            className="absolute z-50 left-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            onKeyDown={handleDropdownKeyDown}
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0); }}
                  onKeyDown={handleDropdownKeyDown}
                  placeholder="Search countries..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Country list */}
            <div ref={dropdownRef} className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No countries found
                </div>
              ) : (
                filtered.map((country, index) => (
                  <button
                    key={country.iso}
                    type="button"
                    data-country-item
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      index === highlightIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : country.iso === selectedCountry.iso
                          ? 'bg-gray-50 dark:bg-gray-700/50'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="flex-1 text-gray-900 dark:text-white truncate">{country.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 tabular-nums">{country.dialCode}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
