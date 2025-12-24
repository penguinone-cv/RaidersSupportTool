import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format number with commas
 */
export function formatNumber(n: number): string {
    return n.toLocaleString();
}

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: string | null): string {
    const rarityLower = (rarity || '').toLowerCase();
    switch (rarityLower) {
        case 'common':
            return 'text-gray-400 border-gray-500';
        case 'uncommon':
            return 'text-green-400 border-green-500';
        case 'rare':
            return 'text-blue-400 border-blue-500';
        case 'epic':
            return 'text-purple-400 border-purple-500';
        case 'legendary':
            return 'text-amber-400 border-amber-500';
        default:
            return 'text-gray-400 border-gray-600';
    }
}

/**
 * Get rarity background class
 */
export function getRarityBgColor(rarity: string | null): string {
    const rarityLower = (rarity || '').toLowerCase();
    switch (rarityLower) {
        case 'common':
            return 'bg-gray-500/20';
        case 'uncommon':
            return 'bg-green-500/20';
        case 'rare':
            return 'bg-blue-500/20';
        case 'epic':
            return 'bg-purple-500/20';
        case 'legendary':
            return 'bg-amber-500/20';
        default:
            return 'bg-gray-500/20';
    }
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
