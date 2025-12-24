import { z } from 'zod';

// Schema for API item response
export const ApiItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string().optional().nullable(),
    item_type: z.string().optional().nullable(),  // Use as category
    rarity: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
});

export const ApiRecipeSchema = z.object({
    id: z.string().or(z.number()).optional(),
    outputItemId: z.string(),
    station: z.string().optional().default('Workbench'),
    ingredients: z.array(z.object({
        itemId: z.string(),
        count: z.number().int().positive(),
    })).optional().default([]),
});

export type ApiItem = z.infer<typeof ApiItemSchema>;
export type ApiRecipe = z.infer<typeof ApiRecipeSchema>;

const BASE_URL = 'https://metaforge.app/api/arc-raiders';
const IMAGE_BASE_URL = 'https://metaforge.app';

/**
 * Complete image URL if it's a relative path
 */
export function completeImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) return null;

    // Already complete URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // Relative path starting with /
    if (imageUrl.startsWith('/')) {
        return `${IMAGE_BASE_URL}${imageUrl}`;
    }

    // Path without leading slash
    return `${IMAGE_BASE_URL}/${imageUrl}`;
}

/**
 * Fetch items from MetaForge API with pagination support
 */
export async function fetchItems(): Promise<ApiItem[]> {
    const allItems: ApiItem[] = [];
    let page = 1;
    let hasNextPage = true;

    console.log('Fetching items with pagination...');

    while (hasNextPage) {
        const response = await fetch(`${BASE_URL}/items?page=${page}&limit=100`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ARC-Raiders-Support-Tool/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Handle both array response and object with data property
        const items = Array.isArray(data) ? data : (data.data || data.items || []);
        const pagination = data.pagination;

        const parsedItems = items.map((item: unknown) => {
            try {
                return ApiItemSchema.parse(item);
            } catch (e) {
                console.warn('Failed to parse item:', item, e);
                return null;
            }
        }).filter((item: ApiItem | null): item is ApiItem => item !== null);

        allItems.push(...parsedItems);

        // Check if there are more pages
        if (pagination?.hasNextPage) {
            page++;
            console.log(`  Page ${page - 1} fetched (${parsedItems.length} items), fetching next...`);
            // Small delay to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 100));
        } else {
            hasNextPage = false;
        }
    }

    console.log(`Total items fetched: ${allItems.length}`);
    return allItems;
}

/**
 * Parse API items into database format
 */
export function parseItemForDb(item: ApiItem): {
    id: string;
    nameEn: string;
    category: string | null;
    rarity: string | null;
    imageUrl: string | null;
    description: string | null;
} {
    return {
        id: item.id,
        nameEn: item.name,
        // Use item_type as category, fallback to category if not available
        category: item.item_type || item.category || null,
        rarity: item.rarity || null,
        imageUrl: completeImageUrl(item.image || item.imageUrl),
        description: item.description || null,
    };
}

/**
 * Check if cache is still valid (within 24 hours)
 */
export function isCacheValid(lastSyncedAt: Date | null): boolean {
    if (!lastSyncedAt) return false;

    const now = new Date();
    const cacheAge = now.getTime() - lastSyncedAt.getTime();
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return cacheAge < CACHE_DURATION;
}
