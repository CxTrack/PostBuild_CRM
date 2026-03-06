/**
 * Currency configuration for international supplier support.
 */

export interface CurrencyOption {
    code: string;
    name: string;
    symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '\u20AC' },
    { code: 'GBP', name: 'British Pound', symbol: '\u00A3' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5' },
    { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'KRW', name: 'South Korean Won', symbol: '\u20A9' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
];

/** Get display label for a currency code: "CAD - Canadian Dollar ($)" */
export function getCurrencyLabel(code: string): string {
    const match = CURRENCIES.find(c => c.code === code);
    return match ? `${match.code} - ${match.name} (${match.symbol})` : code;
}
