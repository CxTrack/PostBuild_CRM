
/**
 * Centralized validation utilities for consistent form validation across the app.
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Phone validation regex (supports international formats)
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export function validateEmail(email: string | undefined | null): ValidationResult {
    if (!email || email.trim() === '') {
        return { isValid: true }; // Empty is valid (use required separately)
    }

    const trimmed = email.trim().toLowerCase();

    if (trimmed.length > 254) {
        return { isValid: false, error: 'Email address is too long' };
    }

    if (!EMAIL_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
}

export function validatePhone(phone: string | undefined | null): ValidationResult {
    if (!phone || phone.trim() === '') {
        return { isValid: true }; // Empty is valid (use required separately)
    }

    // Remove common formatting characters for validation
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

    if (cleaned.length < 7) {
        return { isValid: false, error: 'Phone number is too short' };
    }

    if (cleaned.length > 15) {
        return { isValid: false, error: 'Phone number is too long' };
    }

    if (!PHONE_REGEX.test(phone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
    }

    return { isValid: true };
}

export function validateRequired(value: string | undefined | null, fieldName: string = 'This field'): ValidationResult {
    if (!value || value.trim() === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
}

export function validateMinLength(value: string | undefined | null, minLength: number, fieldName: string = 'This field'): ValidationResult {
    if (!value) {
        return { isValid: true }; // Empty is valid (use required separately)
    }

    if (value.trim().length < minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    return { isValid: true };
}

export function validateMaxLength(value: string | undefined | null, maxLength: number, fieldName: string = 'This field'): ValidationResult {
    if (!value) {
        return { isValid: true };
    }

    if (value.length > maxLength) {
        return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters` };
    }

    return { isValid: true };
}

export function validateUrl(url: string | undefined | null): ValidationResult {
    if (!url || url.trim() === '') {
        return { isValid: true };
    }

    if (!URL_REGEX.test(url)) {
        return { isValid: false, error: 'Please enter a valid URL' };
    }

    return { isValid: true };
}

export function validatePositiveNumber(value: number | string | undefined | null, fieldName: string = 'Value'): ValidationResult {
    if (value === undefined || value === null || value === '') {
        return { isValid: true };
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
        return { isValid: false, error: `${fieldName} must be a number` };
    }

    if (num < 0) {
        return { isValid: false, error: `${fieldName} must be a positive number` };
    }

    return { isValid: true };
}

// Utility to run multiple validations
export function validateAll(...results: ValidationResult[]): ValidationResult {
    for (const result of results) {
        if (!result.isValid) {
            return result;
        }
    }
    return { isValid: true };
}
