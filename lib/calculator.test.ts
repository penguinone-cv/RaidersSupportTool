import { describe, it, expect } from 'vitest';
import {
    calculateMaterials,
    calculateBatchMaterials,
    buildRecipeTree,
    getDirectIngredients,
    RecipeMap,
    ItemNameMap
} from './calculator';

// Mock data setup
const mockItemNames: ItemNameMap = {
    'sword': 'Steel Sword',
    'blade': 'Steel Blade',
    'handle': 'Wooden Handle',
    'steel': 'Steel Ingot',
    'iron': 'Iron Ore',
    'coal': 'Coal',
    'wood': 'Wood',
    'leather': 'Leather',
    'armor': 'Steel Armor',
    'plate': 'Steel Plate',
};

const mockRecipes: RecipeMap = {
    // Steel Sword requires blade + handle
    'sword': {
        outputItemId: 'sword',
        station: 'Forge',
        ingredients: [
            { itemId: 'blade', itemName: 'Steel Blade', count: 1 },
            { itemId: 'handle', itemName: 'Wooden Handle', count: 1 },
        ],
    },
    // Steel Blade requires steel ingots
    'blade': {
        outputItemId: 'blade',
        station: 'Forge',
        ingredients: [
            { itemId: 'steel', itemName: 'Steel Ingot', count: 2 },
        ],
    },
    // Wooden Handle requires wood + leather
    'handle': {
        outputItemId: 'handle',
        station: 'Workbench',
        ingredients: [
            { itemId: 'wood', itemName: 'Wood', count: 3 },
            { itemId: 'leather', itemName: 'Leather', count: 1 },
        ],
    },
    // Steel Ingot requires iron + coal
    'steel': {
        outputItemId: 'steel',
        station: 'Smelter',
        ingredients: [
            { itemId: 'iron', itemName: 'Iron Ore', count: 2 },
            { itemId: 'coal', itemName: 'Coal', count: 1 },
        ],
    },
    // Steel Armor requires plates + leather
    'armor': {
        outputItemId: 'armor',
        station: 'Forge',
        ingredients: [
            { itemId: 'plate', itemName: 'Steel Plate', count: 4 },
            { itemId: 'leather', itemName: 'Leather', count: 2 },
        ],
    },
    // Steel Plate requires steel
    'plate': {
        outputItemId: 'plate',
        station: 'Forge',
        ingredients: [
            { itemId: 'steel', itemName: 'Steel Ingot', count: 3 },
        ],
    },
};

describe('calculateMaterials', () => {
    it('should return base material for item without recipe', () => {
        const result = calculateMaterials('iron', 5, mockRecipes, mockItemNames);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            itemId: 'iron',
            itemName: 'Iron Ore',
            totalCount: 5,
            isBaseMaterial: true,
        });
    });

    it('should calculate simple one-level recipe', () => {
        const result = calculateMaterials('steel', 1, mockRecipes, mockItemNames);

        expect(result).toHaveLength(2);

        const iron = result.find(m => m.itemId === 'iron');
        const coal = result.find(m => m.itemId === 'coal');

        expect(iron?.totalCount).toBe(2);
        expect(coal?.totalCount).toBe(1);
    });

    it('should calculate nested recipe (sword)', () => {
        // Sword = blade + handle
        // Blade = 2 steel
        // Handle = 3 wood + 1 leather
        // Steel = 2 iron + 1 coal
        // Total for 1 sword: 4 iron, 2 coal, 3 wood, 1 leather

        const result = calculateMaterials('sword', 1, mockRecipes, mockItemNames);

        const iron = result.find(m => m.itemId === 'iron');
        const coal = result.find(m => m.itemId === 'coal');
        const wood = result.find(m => m.itemId === 'wood');
        const leather = result.find(m => m.itemId === 'leather');

        expect(iron?.totalCount).toBe(4);
        expect(coal?.totalCount).toBe(2);
        expect(wood?.totalCount).toBe(3);
        expect(leather?.totalCount).toBe(1);
    });

    it('should multiply correctly for quantity > 1', () => {
        const result = calculateMaterials('sword', 3, mockRecipes, mockItemNames);

        const iron = result.find(m => m.itemId === 'iron');
        const coal = result.find(m => m.itemId === 'coal');
        const wood = result.find(m => m.itemId === 'wood');
        const leather = result.find(m => m.itemId === 'leather');

        expect(iron?.totalCount).toBe(12); // 4 * 3
        expect(coal?.totalCount).toBe(6);  // 2 * 3
        expect(wood?.totalCount).toBe(9);  // 3 * 3
        expect(leather?.totalCount).toBe(3); // 1 * 3
    });

    it('should handle deeply nested recipe (armor)', () => {
        // Armor = 4 plates + 2 leather
        // Plate = 3 steel
        // Steel = 2 iron + 1 coal
        // Total: 4*3 = 12 steel = 24 iron + 12 coal, plus 2 leather

        const result = calculateMaterials('armor', 1, mockRecipes, mockItemNames);

        const iron = result.find(m => m.itemId === 'iron');
        const coal = result.find(m => m.itemId === 'coal');
        const leather = result.find(m => m.itemId === 'leather');

        expect(iron?.totalCount).toBe(24);
        expect(coal?.totalCount).toBe(12);
        expect(leather?.totalCount).toBe(2);
    });

    it('should handle circular reference gracefully', () => {
        const circularRecipes: RecipeMap = {
            'item-a': {
                outputItemId: 'item-a',
                station: 'Test',
                ingredients: [{ itemId: 'item-b', itemName: 'Item B', count: 1 }],
            },
            'item-b': {
                outputItemId: 'item-b',
                station: 'Test',
                ingredients: [{ itemId: 'item-a', itemName: 'Item A', count: 1 }],
            },
        };

        // Should not throw or infinite loop
        const result = calculateMaterials('item-a', 1, circularRecipes, {});
        expect(Array.isArray(result)).toBe(true);
    });
});

describe('getDirectIngredients', () => {
    it('should return immediate ingredients', () => {
        const result = getDirectIngredients('sword', mockRecipes);

        expect(result).toHaveLength(2);
        expect(result.map(i => i.itemId)).toContain('blade');
        expect(result.map(i => i.itemId)).toContain('handle');
    });

    it('should return empty array for base material', () => {
        const result = getDirectIngredients('iron', mockRecipes);
        expect(result).toHaveLength(0);
    });
});

describe('calculateBatchMaterials', () => {
    it('should calculate materials for multiple items', () => {
        const items = [
            { itemId: 'sword', quantity: 1 },
            { itemId: 'armor', quantity: 1 },
        ];

        const result = calculateBatchMaterials(items, mockRecipes, mockItemNames);

        // Sword: 4 iron + 2 coal + 3 wood + 1 leather
        // Armor: 24 iron + 12 coal + 2 leather
        // Total: 28 iron + 14 coal + 3 wood + 3 leather

        const iron = result.find(m => m.itemId === 'iron');
        const coal = result.find(m => m.itemId === 'coal');
        const wood = result.find(m => m.itemId === 'wood');
        const leather = result.find(m => m.itemId === 'leather');

        expect(iron?.totalCount).toBe(28);
        expect(coal?.totalCount).toBe(14);
        expect(wood?.totalCount).toBe(3);
        expect(leather?.totalCount).toBe(3);
    });

    it('should sort by totalCount descending', () => {
        const items = [{ itemId: 'armor', quantity: 1 }];
        const result = calculateBatchMaterials(items, mockRecipes, mockItemNames);

        // Should be sorted: iron (24), coal (12), leather (2)
        expect(result[0].itemId).toBe('iron');
        expect(result[1].itemId).toBe('coal');
        expect(result[2].itemId).toBe('leather');
    });
});

describe('buildRecipeTree', () => {
    it('should build tree for base material', () => {
        const tree = buildRecipeTree('iron', 5, mockRecipes, mockItemNames);

        expect(tree.itemId).toBe('iron');
        expect(tree.count).toBe(5);
        expect(tree.children).toHaveLength(0);
        expect(tree.depth).toBe(0);
    });

    it('should build tree with children', () => {
        const tree = buildRecipeTree('sword', 1, mockRecipes, mockItemNames);

        expect(tree.itemId).toBe('sword');
        expect(tree.children).toHaveLength(2);

        const bladeChild = tree.children.find(c => c.itemId === 'blade');
        expect(bladeChild).toBeDefined();
        expect(bladeChild?.depth).toBe(1);
        expect(bladeChild?.children).toHaveLength(1); // steel

        const steelChild = bladeChild?.children[0];
        expect(steelChild?.itemId).toBe('steel');
        expect(steelChild?.depth).toBe(2);
        expect(steelChild?.children).toHaveLength(2); // iron + coal
    });
});
