/**
 * CategoryCombobox - Creatable combobox for product categories
 * Shows previously used categories as dropdown suggestions,
 * allows typing new ones, and has a clear button.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useProductStore } from '@/stores/productStore';

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  /** Exclude this product ID when deriving categories (for edit mode) */
  excludeProductId?: string;
}

export default function CategoryCombobox({
  value,
  onChange,
  className,
  placeholder = 'e.g., Consulting, Design',
  excludeProductId,
}: CategoryComboboxProps) {
  const { products } = useProductStore();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Derive unique categories from existing products
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Filter categories based on current input
  const filtered = useMemo(() => {
    if (!value.trim()) return allCategories;
    const lower = value.toLowerCase().trim();
    return allCategories.filter((cat) => cat.toLowerCase().includes(lower));
  }, [value, allCategories]);

  // Check if current value exactly matches an existing category
  const exactMatch = allCategories.some(
    (cat) => cat.toLowerCase() === value.toLowerCase().trim()
  );

  // Close dropdown on outside click
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

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const selectCategory = (cat: string) => {
    onChange(cat);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (filtered.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      if (e.key === 'ArrowDown') e.preventDefault();
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectCategory(filtered[highlightedIndex]);
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setHighlightedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    if (allCategories.length > 0) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && filtered.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              tabIndex={-1}
              aria-label="Clear category"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {allCategories.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              tabIndex={-1}
              aria-label="Toggle category suggestions"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg py-1"
        >
          {filtered.map((cat, idx) => (
            <li
              key={cat}
              role="option"
              aria-selected={highlightedIndex === idx}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                highlightedIndex === idx
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
              } ${
                cat.toLowerCase() === value.toLowerCase().trim()
                  ? 'font-medium'
                  : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur before selection
                selectCategory(cat);
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {cat}
            </li>
          ))}
          {value.trim() && !exactMatch && (
            <li
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-600"
            >
              Press Enter to use "<span className="font-medium text-gray-700 dark:text-gray-200">{value.trim()}</span>"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
