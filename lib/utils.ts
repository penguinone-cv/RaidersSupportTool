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
 * Rarity color definitions
 * Legendary #FFC600, Epic #CC3099, Rare #00A8F2, Uncommon #26BF57, Common #6C6C6C
 */
const RARITY_COLORS: Record<string, string> = {
    legendary: '#FFC600',
    epic: '#CC3099',
    rare: '#00A8F2',
    uncommon: '#26BF57',
    common: '#6C6C6C',
};

/**
 * Get rarity border color (for inline style)
 */
export function getRarityBorderStyle(rarity: string | null): React.CSSProperties {
    const rarityLower = (rarity || '').toLowerCase();
    const color = RARITY_COLORS[rarityLower] || '#9CA3AF';
    return { borderLeftColor: color };
}

/**
 * Get rarity background style (for inline style)
 */
export function getRarityBgStyle(rarity: string | null): React.CSSProperties {
    const rarityLower = (rarity || '').toLowerCase();
    const color = RARITY_COLORS[rarityLower] || '#9CA3AF';
    return { backgroundColor: `${color}20` }; // 20 = ~12% opacity in hex
}

/**
 * Get rarity text color (inline style)
 */
export function getRarityTextStyle(rarity: string | null): React.CSSProperties {
    const rarityLower = (rarity || '').toLowerCase();
    const color = RARITY_COLORS[rarityLower] || '#9CA3AF';
    return {
        color: color,
        backgroundColor: `${color}25` // ~15% opacity
    };
}

// Keep old functions for backward compatibility (returns empty string now)
export function getRarityColor(_rarity: string | null): string {
    return '';
}

export function getRarityBgColor(_rarity: string | null): string {
    return '';
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

/**
 * Rarity Japanese translations
 */
const RARITY_JP: Record<string, string> = {
    legendary: 'レジェンダリー',
    epic: 'エピック',
    rare: 'レア',
    uncommon: 'アンコモン',
    common: 'コモン',
};

/**
 * Get Japanese rarity name
 */
export function getRarityJp(rarity: string | null): string {
    const rarityLower = (rarity || '').toLowerCase();
    return RARITY_JP[rarityLower] || rarity || '';
}

/**
 * Category Japanese translations
 */
const CATEGORY_JP: Record<string, string> = {
    // Weapons
    'assault rifle': 'アサルトライフル',
    'submachine gun': 'サブマシンガン',
    'sniper rifle': 'スナイパーライフル',
    'shotgun': 'ショットガン',
    'pistol': 'ピストル',
    'light machine gun': 'ライトマシンガン',
    'lmg': 'ライトマシンガン',
    'smg': 'サブマシンガン',
    'rifle': 'ライフル',
    'weapons': '武器',
    'weapon': '武器',
    // Equipment
    'equipment': '装備',
    'armor': 'アーマー',
    'helmet': 'ヘルメット',
    'vest': 'ベスト',
    'backpack': 'バックパック',
    'bag': 'バッグ',
    // Resources
    'resource': '素材',
    'resources': '素材',
    'material': '素材',
    'materials': '素材',
    'component': 'コンポーネント',
    'components': 'コンポーネント',
    // Consumables
    'consumable': '消耗品',
    'consumables': '消耗品',
    'medicine': '医薬品',
    'food': '食料',
    'drink': '飲料',
    // Others
    'blueprint': '設計図',
    'blueprints': '設計図',
    'attachment': 'アタッチメント',
    'attachments': 'アタッチメント',
    'mod': 'MOD',
    'mods': 'MOD',
    'ammo': '弾薬',
    'ammunition': '弾薬',
    'tool': 'ツール',
    'tools': 'ツール',
    'key': '鍵',
    'keys': '鍵',
    'quest item': 'クエストアイテム',
    'misc': 'その他',
    'miscellaneous': 'その他',
    'other': 'その他',
};

/**
 * Get Japanese category name
 */
export function getCategoryJp(category: string | null): string {
    const categoryLower = (category || '').toLowerCase();
    return CATEGORY_JP[categoryLower] || category || '';
}
