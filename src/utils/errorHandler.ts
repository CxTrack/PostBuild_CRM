
/**
 * Sanitizes error messages for user display.
 * Logs full error details for debugging while showing safe messages to users.
 */

// Known safe error messages that can be shown to users
const SAFE_ERROR_PATTERNS: Record<string, string> = {
    'duplicate key': 'This record already exists',
    'violates foreign key': 'Cannot delete: this item is linked to other records',
    'violates unique constraint': 'A record with this value already exists',
    'network': 'Network error. Please check your connection',
    'timeout': 'Request timed out. Please try again',
    'unauthorized': 'You are not authorized to perform this action',
    'not found': 'The requested item was not found',
    'invalid input': 'Please check your input and try again',
    'rate limit': 'Too many requests. Please wait a moment',
};

// Default fallback messages by operation type
const FALLBACK_MESSAGES: Record<string, string> = {
    fetch: 'Failed to load data. Please refresh and try again',
    create: 'Failed to create record. Please try again',
    update: 'Failed to update record. Please try again',
    delete: 'Failed to delete record. Please try again',
    auth: 'Authentication failed. Please sign in again',
    default: 'An error occurred. Please try again',
};

export function getSafeErrorMessage(
    error: unknown,
    operation: 'fetch' | 'create' | 'update' | 'delete' | 'auth' | 'default' = 'default'
): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Check for known safe patterns
    for (const [pattern, safeMessage] of Object.entries(SAFE_ERROR_PATTERNS)) {
        if (lowerMessage.includes(pattern)) {
            return safeMessage;
        }
    }

    // Log full error for debugging (only in development)
    if (import.meta.env.DEV) {
        console.error(`[${operation}] Full error:`, error);
    }

    // Return safe fallback message
    return FALLBACK_MESSAGES[operation];
}

export function logError(context: string, error: unknown): void {
    if (import.meta.env.DEV) {
        console.error(`[${context}]`, error);
    }
    // In production, you could send to error tracking service here
}
