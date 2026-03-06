/**
 * CategoryCombobox - Creatable combobox for product categories
 * Shows previously used categories as dropdown suggestions,
 * allows typing new ones, and has a clear button.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Plus } from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import toast from 'react-hot-toast';

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
  const [justSelected, setJustSelected] = useState(false);
  const [sessionCategories, setSessionCategories] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Derive unique categories from existing products + session-created categories
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    sessionCategories.forEach((c) => cats.add(c));
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [products, sessionCategories]);

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

  // Whether the "Create new" row is visible
  const showCreateRow = !!(value.trim() && !exactMatch);
  // Total navigable items (filtered items + optional create row)
  const totalItems = filtered.length + (showCreateRow ? 1 : 0);

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
    const isNew = !allCategories.some(c => c.toLowerCase() === cat.toLowerCase().trim());
    // Persist new categories locally so they appear in future dropdown opens
    if (isNew) {
      setSessionCategories((prev) => [...prev, cat.trim()]);
    }
    onChange(cat);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();

    // Visual feedback: green ring flash
    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 800);

    // Toast only for genuinely new categories
    if (isNew) {
      toast.success(`New category "${cat}" added`, { duration: 2000 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (totalItems > 0) {
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
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectCategory(filtered[highlightedIndex]);
        } else if (highlightedIndex === filtered.length && showCreateRow) {
          selectCategory(value.trim());
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
    const prev = value;
    onChange('');
    inputRef.current?.focus();

    if (prev.trim()) {
      toast((t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">Cleared &ldquo;{prev}&rdquo;</span>
          <button
            onClick={() => { onChange(prev); toast.dismiss(t.id); }}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Undo
          </button>
        </div>
      ), { duration: 4000 });
    }
  };

  const showDropdown = isOpen && totalItems > 0;

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
          className={`${className} ${justSelected ? 'ring-2 ring-green-500 border-green-500' : ''}`}
          style={justSelected ? { transition: 'box-shadow 0.3s, border-color 0.3s' } : undefined}
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
          {showCreateRow && (
            <li
              role="option"
              aria-selected={highlightedIndex === filtered.length}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors border-t border-gray-100 dark:border-gray-600 flex items-center gap-2 ${
                highlightedIndex === filtered.length
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectCategory(value.trim());
              }}
              onMouseEnter={() => setHighlightedIndex(filtered.length)}
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Create &ldquo;<span className="font-semibold">{value.trim()}</span>&rdquo;
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
