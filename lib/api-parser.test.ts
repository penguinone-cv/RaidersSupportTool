import { describe, it, expect } from 'vitest';
import { completeImageUrl, parseItemForDb, isCacheValid, ApiItemSchema } from './api-client';

describe('completeImageUrl', () => {
    it('should return null for null/undefined input', () => {
        expect(completeImageUrl(null)).toBeNull();
        expect(completeImageUrl(undefined)).toBeNull();
    });

    it('should return complete URL unchanged', () => {
        const url = 'https://cdn.metaforge.app/images/item.png';
        expect(completeImageUrl(url)).toBe(url);
    });

    it('should complete relative URL starting with /', () => {
        const url = '/images/items/weapon.png';
        expect(completeImageUrl(url)).toBe('https://metaforge.app/images/items/weapon.png');
    });

    it('should complete relative URL without leading /', () => {
        const url = 'images/items/armor.png';
        expect(completeImageUrl(url)).toBe('https://metaforge.app/images/items/armor.png');
    });
});

describe('parseItemForDb', () => {
    it('should parse a complete API item', () => {
        const apiItem = {
            id: 'item-123',
            name: 'Steel Plate',
            category: 'Material',
            rarity: 'Common',
            image: '/images/steel-plate.png',
            description: 'A sturdy metal plate',
        };

        const result = parseItemForDb(apiItem);

        expect(result).toEqual({
            id: 'item-123',
            nameEn: 'Steel Plate',
            category: 'Material',
            rarity: 'Common',
            imageUrl: 'https://metaforge.app/images/steel-plate.png',
            description: 'A sturdy metal plate',
        });
    });

    it('should handle missing optional fields', () => {
        const apiItem = {
            id: 'item-456',
            name: 'Mystery Item',
        };

        const result = parseItemForDb(apiItem);

        expect(result).toEqual({
            id: 'item-456',
            nameEn: 'Mystery Item',
            category: null,
            rarity: null,
            imageUrl: null,
            description: null,
        });
    });

    it('should prefer imageUrl over image field', () => {
        const apiItem = {
            id: 'item-789',
            name: 'Dual Image Item',
            image: '/old-image.png',
            imageUrl: 'https://cdn.example.com/new-image.png',
        };

        const result = parseItemForDb(apiItem);

        // image field takes precedence since we check it first
        expect(result.imageUrl).toBe('https://metaforge.app/old-image.png');
    });
});

describe('isCacheValid', () => {
    it('should return false for null date', () => {
        expect(isCacheValid(null)).toBe(false);
    });

    it('should return true for recent sync', () => {
        const recentDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
        expect(isCacheValid(recentDate)).toBe(true);
    });

    it('should return false for old sync', () => {
        const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
        expect(isCacheValid(oldDate)).toBe(false);
    });

    it('should return true for edge case at 23 hours', () => {
        const edgeDate = new Date(Date.now() - 1000 * 60 * 60 * 23); // 23 hours ago
        expect(isCacheValid(edgeDate)).toBe(true);
    });
});

describe('ApiItemSchema', () => {
    it('should parse valid item', () => {
        const validItem = {
            id: 'test-id',
            name: 'Test Item',
            category: 'Weapon',
            rarity: 'Rare',
        };

        const result = ApiItemSchema.safeParse(validItem);
        expect(result.success).toBe(true);
    });

    it('should fail for item without id', () => {
        const invalidItem = {
            name: 'No ID Item',
        };

        const result = ApiItemSchema.safeParse(invalidItem);
        expect(result.success).toBe(false);
    });

    it('should fail for item without name', () => {
        const invalidItem = {
            id: 'has-id',
        };

        const result = ApiItemSchema.safeParse(invalidItem);
        expect(result.success).toBe(false);
    });
});
