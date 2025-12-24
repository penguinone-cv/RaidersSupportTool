'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

interface IngredientInput {
    itemId: string;
    count: number;
}

export async function saveRecipe(formData: FormData) {
    const outputItemId = formData.get('outputItemId') as string;
    const station = formData.get('station') as string;
    const ingredientsJson = formData.get('ingredients') as string;
    const ingredients: IngredientInput[] = JSON.parse(ingredientsJson);

    // Check if recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
        where: { outputItemId },
    });

    if (existingRecipe) {
        // Update existing recipe
        // First delete old ingredients
        await prisma.recipeIngredient.deleteMany({
            where: { recipeId: existingRecipe.id },
        });

        // Update recipe and add new ingredients
        await prisma.recipe.update({
            where: { id: existingRecipe.id },
            data: {
                station,
                ingredients: {
                    create: ingredients.map((ing) => ({
                        itemId: ing.itemId,
                        count: ing.count,
                    })),
                },
            },
        });
    } else {
        // Create new recipe
        await prisma.recipe.create({
            data: {
                outputItemId,
                station,
                ingredients: {
                    create: ingredients.map((ing) => ({
                        itemId: ing.itemId,
                        count: ing.count,
                    })),
                },
            },
        });
    }

    revalidatePath('/recipes');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteRecipe(recipeId: number) {
    await prisma.recipe.delete({
        where: { id: recipeId },
    });

    revalidatePath('/recipes');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function getRecipeForItem(itemId: string) {
    return await prisma.recipe.findUnique({
        where: { outputItemId: itemId },
        include: {
            outputItem: true,
            ingredients: {
                include: {
                    item: true,
                },
            },
        },
    });
}

// Calculate required materials for making an item
export async function calculateMaterials(itemId: string, quantity: number = 1): Promise<Map<string, number>> {
    const materials = new Map<string, number>();

    const recipe = await prisma.recipe.findUnique({
        where: { outputItemId: itemId },
        include: {
            ingredients: true,
        },
    });

    if (!recipe) {
        // No recipe - this item is a base material
        materials.set(itemId, quantity);
        return materials;
    }

    // For each ingredient, recursively calculate
    for (const ingredient of recipe.ingredients) {
        const subMaterials = await calculateMaterials(ingredient.itemId, ingredient.count * quantity);

        for (const [matId, count] of subMaterials) {
            materials.set(matId, (materials.get(matId) || 0) + count);
        }
    }

    return materials;
}
