/**
 * Validation utilities for form inputs
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian phone number (10 digits)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, '')); // Remove non-digits
}

/**
 * Validate GST number format (15 characters: 2 state + 10 PAN + 3 entity + Z + check digit)
 */
export function isValidGST(gst: string): boolean {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
}

/**
 * Validate date is not in the future
 */
export function isNotFutureDate(date: string | Date): boolean {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return inputDate <= today;
}

/**
 * Validate date is not too old (e.g., not more than 10 years ago)
 */
export function isNotTooOldDate(date: string | Date, maxYears: number = 10): boolean {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - maxYears);
  return inputDate >= maxDate;
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: number | string): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
}

/**
 * Validate non-negative number
 */
export function isNonNegativeNumber(value: number | string): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= 0;
}

/**
 * Format phone number (Indian format)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned;
  }
  return cleaned.slice(0, 10);
}

/**
 * Format GST number (uppercase, remove spaces)
 */
export function formatGSTNumber(gst: string): string {
  return gst.toUpperCase().replace(/\s/g, '');
}

/**
 * Format currency (Indian format)
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Validate manifest number format (basic check)
 */
export function isValidManifestNumber(manifest: string): boolean {
  return manifest.trim().length >= 3; // At least 3 characters
}

/**
 * Validate lot number format (basic check)
 */
export function isValidLotNumber(lot: string): boolean {
  return lot.trim().length >= 2; // At least 2 characters
}

