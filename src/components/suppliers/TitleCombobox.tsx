/**
 * TitleCombobox - Creatable combobox for supplier contact job titles.
 * Derives suggestions from existing supplier_contacts across the org.
 * Follows the proven CategoryCombobox / FieldCombobox pattern with
 * THREE required local states: sessionValues, dismissedValues, isSearching.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface TitleComboboxProps {
    value: string;
    onChange: (value: string) => void;
    /** All known titles fetched from the DB (via fetchAllContactTitles). */
    existingTitles: string[];
    className?: string;
    placeholder?: string;
}

export default function TitleCombobox({
    value,
    onChange,
    existingTitles,
    className,
    placeholder = 'e.g., Sales Manager, CEO',
}: TitleComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [justSelected, setJustSelected] = useState(false);

    // ── Three critical local states ───────────────────────────────────
    const [sessionValues, setSessionValues] = useState<string[]>([]);
    const [dismissedValues, setDismissedValues] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Merge DB titles + session-created, minus dismissed
    const allTitles = useMemo(() => {
        const set = new Set<string>();
        existingTitles.forEach(t => { if (t.trim()) set.add(t.trim()); });
        sessionValues.forEach(t => set.add(t));
        return Array.from(set)
            .filter(t => !dismissedValues.has(t))
            .sort((a, b) => a.localeCompare(b));
    }, [existingTitles, sessionValues, dismissedValues]);

    // Only filter when user is actively typing; otherwise show all
    const filtered = useMemo(() => {
        if (!isSearching || !value.trim()) return allTitles;
        const lower = value.toLowerCase().trim();
        return allTitles.filter(t => t.toLowerCase().includes(lower));
    }, [value, allTitles, isSearching]);

    const exactMatch = allTitles.some(
        t => t.toLowerCase() === value.toLowerCase().trim()
    );
    const showCreateRow = !!(value.trim() && !exactMatch);
    const totalItems = filtered.length + (showCreateRow ? 1 : 0);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
                setIsSearching(false);
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

    const selectTitle = (title: string) => {
        const isNew = !allTitles.some(t => t.toLowerCase() === title.toLowerCase().trim());
        if (isNew) {
            setSessionValues(prev => [...prev, title.trim()]);
        }
        onChange(title);
        setIsOpen(false);
        setHighlightedIndex(-1);
        setIsSearching(false);
        inputRef.current?.blur();

        setJustSelected(true);
        setTimeout(() => setJustSelected(false), 800);

        if (isNew) {
            toast.success(`New title "${title}" added`, { duration: 2000 });
        }
    };

    const dismissTitle = (title: string) => {
        setDismissedValues(prev => new Set(prev).add(title));
        setSessionValues(prev => prev.filter(t => t !== title));
        if (value.trim().toLowerCase() === title.toLowerCase()) {
            onChange('');
        }
        toast.success(`"${title}" removed from suggestions`, { duration: 2000 });
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
                setHighlightedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
                    selectTitle(filtered[highlightedIndex]);
                } else if (highlightedIndex === filtered.length && showCreateRow) {
                    selectTitle(value.trim());
                } else {
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                setIsSearching(false);
                break;
            case 'Tab':
                setIsOpen(false);
                setHighlightedIndex(-1);
                setIsSearching(false);
                break;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setHighlightedIndex(-1);
        setIsSearching(true);
        if (!isOpen) setIsOpen(true);
    };

    const handleFocus = () => {
        setIsSearching(false);
        if (allTitles.length > 0 || showCreateRow) {
            setIsOpen(true);
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
                    className={`${className || ''} ${justSelected ? 'ring-2 ring-green-500 border-green-500' : ''}`}
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
                            onClick={() => { onChange(''); inputRef.current?.focus(); }}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            tabIndex={-1}
                            aria-label="Clear title"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {allTitles.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsSearching(false);
                                setIsOpen(!isOpen);
                                inputRef.current?.focus();
                            }}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            tabIndex={-1}
                            aria-label="Toggle title suggestions"
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
                    {filtered.map((title, idx) => (
                        <li
                            key={title}
                            role="option"
                            aria-selected={highlightedIndex === idx}
                            className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between group ${
                                highlightedIndex === idx
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                            } ${title.toLowerCase() === value.toLowerCase().trim() ? 'font-medium' : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); selectTitle(title); }}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                            <span>{title}</span>
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    dismissTitle(title);
                                }}
                                className="p-0.5 rounded text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                tabIndex={-1}
                                aria-label={`Remove ${title}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
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
                            onMouseDown={(e) => { e.preventDefault(); selectTitle(value.trim()); }}
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
