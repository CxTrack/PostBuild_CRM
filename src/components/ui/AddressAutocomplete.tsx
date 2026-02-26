/**
 * AddressAutocomplete - Google Places API (New) address input with autocomplete
 * Uses AutocompleteSuggestion.fetchAutocompleteSuggestions() + Place.fetchFields()
 * Requires "Places API (New)" + "Maps JavaScript API" enabled in GCP
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

// Types for address components — exported for consumers
export interface AddressComponents {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onAddressSelect?: (components: AddressComponents) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    disabled?: boolean;
    /** Google Places search types - defaults to ['address'] for street-level.
     *  Use ['(cities)'] for city-level search (mapped to 'locality' internally) */
    searchTypes?: string[];
}

// Internal prediction type matching new API shape
interface PlacePrediction {
    placeId: string;
    text: string;
    mainText: string;
    secondaryText: string;
    // Keep raw reference so we can call toPlace()
    _raw?: any;
}

// Simple cache for API responses
const predictionCache = new Map<string, PlacePrediction[]>();

// Map legacy searchTypes to new API includedPrimaryTypes
// Valid types: Table A (e.g. 'locality') + Table B (e.g. 'street_address', 'geocode')
// Note: 'address' is NOT a valid type — use 'street_address' instead
function mapSearchTypes(searchTypes: string[]): string[] | undefined {
    const mapped: string[] = [];
    for (const t of searchTypes) {
        switch (t) {
            case '(cities)':
                mapped.push('locality');
                break;
            case 'geocode':
                mapped.push('geocode');
                break;
            case 'address':
                mapped.push('street_address');
                break;
            default:
                mapped.push(t);
        }
    }
    return mapped.length > 0 ? mapped : undefined;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value,
    onChange,
    onAddressSelect,
    placeholder = 'Start typing an address...',
    className = '',
    label,
    disabled = false,
    searchTypes = ['address'],
}) => {
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [apiReady, setApiReady] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionTokenRef = useRef<any>(null);

    // Check if Google Places API (New) is loaded — poll until ready
    const isGoogleLoaded = useCallback(() => {
        return !!(window as any).google?.maps?.places?.AutocompleteSuggestion;
    }, []);

    // Poll for Google Maps API readiness (loads async)
    useEffect(() => {
        if (isGoogleLoaded()) {
            setApiReady(true);
            return;
        }
        const interval = setInterval(() => {
            if (isGoogleLoaded()) {
                setApiReady(true);
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [isGoogleLoaded]);

    // Get or create a session token for billing optimization
    const getSessionToken = useCallback(() => {
        if (!sessionTokenRef.current && apiReady) {
            try {
                sessionTokenRef.current = new (window as any).google.maps.places.AutocompleteSessionToken();
            } catch {
                // Silently fail if token creation fails
            }
        }
        return sessionTokenRef.current;
    }, [apiReady]);

    // Reset session token after a place is selected (starts new billing session)
    const resetSessionToken = useCallback(() => {
        sessionTokenRef.current = null;
    }, []);

    // Fetch predictions from Google Places API (New)
    const fetchPredictions = useCallback(async (input: string) => {
        if (!input || input.length < 3) {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        // Check cache first
        const cacheKey = input.toLowerCase();
        if (predictionCache.has(cacheKey)) {
            setPredictions(predictionCache.get(cacheKey) || []);
            setShowDropdown(true);
            return;
        }

        if (!apiReady) {
            return;
        }

        setLoading(true);

        try {
            const { AutocompleteSuggestion } = (window as any).google.maps.places;

            const request: any = {
                input,
                includedRegionCodes: ['ca', 'us'],
                sessionToken: getSessionToken(),
            };

            // Map searchTypes to includedPrimaryTypes
            const primaryTypes = mapSearchTypes(searchTypes);
            if (primaryTypes) {
                request.includedPrimaryTypes = primaryTypes;
            }

            const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

            const mapped: PlacePrediction[] = (response.suggestions || [])
                .filter((s: any) => s.placePrediction)
                .map((s: any) => {
                    const p = s.placePrediction;
                    return {
                        placeId: p.placeId,
                        text: p.text?.text || '',
                        mainText: p.mainText?.text || '',
                        secondaryText: p.secondaryText?.text || '',
                        _raw: p,
                    };
                });

            predictionCache.set(cacheKey, mapped);
            setPredictions(mapped);
            setShowDropdown(mapped.length > 0);
        } catch (error) {
            console.warn('Places autocomplete error:', error);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    }, [apiReady, searchTypes, getSessionToken]);

    // Get place details using the new Place.fetchFields() API
    const getPlaceDetails = useCallback(async (prediction: PlacePrediction) => {
        if (!apiReady || !prediction._raw) {
            onChange(prediction.text || prediction.mainText);
            setShowDropdown(false);
            return;
        }

        try {
            // Convert prediction to Place and fetch address fields
            const place = prediction._raw.toPlace();
            await place.fetchFields({
                fields: ['addressComponents', 'formattedAddress', 'displayName'],
            });

            // Parse address components
            const components: AddressComponents = {
                address: '',
                city: '',
                state: '',
                postal_code: '',
                country: '',
            };

            let streetNumber = '';
            let route = '';

            if (place.addressComponents) {
                for (const component of place.addressComponents) {
                    const types = component.types || [];

                    if (types.includes('street_number')) {
                        streetNumber = component.longText || component.long_name || '';
                    }
                    if (types.includes('route')) {
                        route = component.longText || component.long_name || '';
                    }
                    if (types.includes('locality') || types.includes('sublocality')) {
                        components.city = component.longText || component.long_name || '';
                    }
                    if (types.includes('administrative_area_level_1')) {
                        components.state = component.shortText || component.short_name || '';
                    }
                    if (types.includes('postal_code')) {
                        components.postal_code = component.longText || component.long_name || '';
                    }
                    if (types.includes('country')) {
                        components.country = component.longText || component.long_name || '';
                    }
                }
            }

            // Construct street address
            components.address = streetNumber ? `${streetNumber} ${route}` : route;

            // Update all fields via callback
            onChange(components.address);
            onAddressSelect?.(components);

        } catch (error) {
            console.warn('Place details fetch error:', error);
            // Fallback to just setting the description
            onChange(prediction.text || prediction.mainText);
        }

        // Reset session token after selection (new billing session on next search)
        resetSessionToken();
        setShowDropdown(false);
        setPredictions([]);
    }, [apiReady, onChange, onAddressSelect, resetSessionToken]);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setSelectedIndex(-1);

        // Debounce API calls
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchPredictions(newValue);
        }, 300);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || predictions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, predictions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    getPlaceDetails(predictions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Handle prediction selection
    const handleSelect = (prediction: PlacePrediction) => {
        getPlaceDetails(prediction);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className={`relative ${showDropdown ? 'z-40' : ''}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                <MapPin
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400"
                />

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                        } ${className}`}
                />

                {loading && (
                    <Loader2
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 animate-spin"
                    />
                )}

                {value && !loading && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('');
                            setPredictions([]);
                            setShowDropdown(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && predictions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                    {predictions.map((prediction, index) => (
                        <button
                            key={prediction.placeId}
                            type="button"
                            onClick={() => handleSelect(prediction)}
                            className={`w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                                } ${index === 0 ? 'rounded-t-lg' : ''} ${index === predictions.length - 1 ? 'rounded-b-lg' : ''
                                }`}
                        >
                            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                    {prediction.mainText}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {prediction.secondaryText}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Fallback message when Google API is not loaded */}
            {showDropdown && predictions.length === 0 && value.length >= 3 && !loading && !apiReady && (
                <div className="absolute z-50 w-full mt-1 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        Address autocomplete requires Google Places API. Add your API key to enable this feature.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AddressAutocomplete;
