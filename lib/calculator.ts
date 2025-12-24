export interface RecipeIngredient {
    itemId: string;
    itemName: string;
    count: number;
}

export interface Recipe {
    outputItemId: string;
    station: string;
    ingredients: RecipeIngredient[];
}

export interface MaterialRequirement {
    itemId: string;
    itemName: string;
    totalCount: number;
    isBaseMaterial: boolean;
}

export interface RecipeMap {
    [itemId: string]: Recipe;
}

export interface ItemNameMap {
    [itemId: string]: string;
}

/**
 * Calculate all materials needed for crafting an item
 * Recursively breaks down recipes to find base materials
 * 
 * @param targetItemId - The item to craft
 * @param quantity - How many to craft
 * @param recipeMap - Map of itemId to Recipe
 * @param itemNameMap - Map of itemId to item name
 * @param visited - Set of visited items to detect circular references
 * @returns Array of material requirements
 */
export function calculateMaterials(
    targetItemId: string,
    quantity: number,
    recipeMap: RecipeMap,
    itemNameMap: ItemNameMap,
    visited: Set<string> = new Set()
): MaterialRequirement[] {
    // Check for circular reference
    if (visited.has(targetItemId)) {
        console.warn(`Circular recipe detected for item: ${targetItemId}`);
        return [];
    }

    const recipe = recipeMap[targetItemId];

    // No recipe found = this is a base material
    if (!recipe) {
        return [{
            itemId: targetItemId,
            itemName: itemNameMap[targetItemId] || targetItemId,
            totalCount: quantity,
            isBaseMaterial: true,
        }];
    }

    visited.add(targetItemId);
    const materialsMap = new Map<string, MaterialRequirement>();

    for (const ingredient of recipe.ingredients) {
        const neededCount = ingredient.count * quantity;

        // Recursively calculate materials for this ingredient
        const subMaterials = calculateMaterials(
            ingredient.itemId,
            neededCount,
            recipeMap,
            itemNameMap,
            new Set(visited) // Create a copy to allow parallel branches
        );

        // Aggregate materials
        for (const material of subMaterials) {
            const existing = materialsMap.get(material.itemId);
            if (existing) {
                existing.totalCount += material.totalCount;
            } else {
                materialsMap.set(material.itemId, { ...material });
            }
        }
    }

    visited.delete(targetItemId);

    return Array.from(materialsMap.values());
}

/**
 * Get the immediate ingredients for a recipe (not recursive)
 */
export function getDirectIngredients(
    itemId: string,
    recipeMap: RecipeMap
): RecipeIngredient[] {
    const recipe = recipeMap[itemId];
    return recipe ? recipe.ingredients : [];
}

/**
 * Calculate total materials for multiple items at once
 */
export function calculateBatchMaterials(
    items: { itemId: string; quantity: number }[],
    recipeMap: RecipeMap,
    itemNameMap: ItemNameMap
): MaterialRequirement[] {
    const materialsMap = new Map<string, MaterialRequirement>();

    for (const { itemId, quantity } of items) {
        const materials = calculateMaterials(itemId, quantity, recipeMap, itemNameMap);

        for (const material of materials) {
            const existing = materialsMap.get(material.itemId);
            if (existing) {
                existing.totalCount += material.totalCount;
            } else {
                materialsMap.set(material.itemId, { ...material });
            }
        }
    }

    return Array.from(materialsMap.values()).sort((a, b) =>
        b.totalCount - a.totalCount
    );
}

/**
 * Build a recipe tree structure for visualization
 */
export interface RecipeTreeNode {
    itemId: string;
    itemName: string;
    count: number;
    children: RecipeTreeNode[];
    depth: number;
}

export function buildRecipeTree(
    itemId: string,
    quantity: number,
    recipeMap: RecipeMap,
    itemNameMap: ItemNameMap,
    depth: number = 0,
    visited: Set<string> = new Set()
): RecipeTreeNode {
    const node: RecipeTreeNode = {
        itemId,
        itemName: itemNameMap[itemId] || itemId,
        count: quantity,
        children: [],
        depth,
    };

    if (visited.has(itemId)) {
        return node; // Circular reference, return without children
    }

    const recipe = recipeMap[itemId];
    if (!recipe) {
        return node; // Base material
    }

    visited.add(itemId);

    for (const ingredient of recipe.ingredients) {
        const childNode = buildRecipeTree(
            ingredient.itemId,
            ingredient.count * quantity,
            recipeMap,
            itemNameMap,
            depth + 1,
            new Set(visited)
        );
        node.children.push(childNode);
    }

    return node;
}
