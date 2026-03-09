/**
 * Formats a number or numeric string as Indian currency (en-IN).
 * Example: 15811951.54 -> 1,58,11,951.54
 */
export const formatCurrency = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return '0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0';

    return numValue.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};
