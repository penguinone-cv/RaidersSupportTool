import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialLookupClient } from './material-lookup-client';

export const dynamic = 'force-dynamic';

async function getItems() {
    return await prisma.item.findMany({
        orderBy: { nameEn: 'asc' },
    });
}

async function getRecipesUsingMaterial() {
    return await prisma.recipeIngredient.findMany({
        include: {
            recipe: {
                include: {
                    outputItem: true,
                }
            },
            item: true,
        },
    });
}

async function getQuestRequirements() {
    return await prisma.questRequirement.findMany({
        include: {
            quest: true,
        },
    });
}

export default async function MaterialsPage() {
    const [items, recipeIngredients, questRequirements] = await Promise.all([
        getItems(),
        getRecipesUsingMaterial(),
        getQuestRequirements(),
    ]);

    // Build lookup maps
    // Map: itemId -> recipes that use this item
    const itemToRecipes = new Map<string, { recipeId: number; outputName: string; count: number }[]>();
    for (const ing of recipeIngredients) {
        const existing = itemToRecipes.get(ing.itemId) || [];
        existing.push({
            recipeId: ing.recipe.id,
            outputName: ing.recipe.outputItem.nameJp || ing.recipe.outputItem.nameEn,
            count: ing.count,
        });
        itemToRecipes.set(ing.itemId, existing);
    }

    // Map: itemId -> quests that need this item
    const itemToQuests = new Map<string, { questId: string; questName: string; count: number }[]>();
    for (const req of questRequirements) {
        const existing = itemToQuests.get(req.itemId) || [];
        existing.push({
            questId: req.quest.id,
            questName: req.quest.nameJp || req.quest.nameEn,
            count: req.requiredCount,
        });
        itemToQuests.set(req.itemId, existing);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">素材逆引き検索</h1>
                <p className="text-gray-600">
                    素材を選択して、どのレシピやクエストで使われるか確認できます
                </p>
            </div>

            <MaterialLookupClient
                items={items.map(i => ({
                    id: i.id,
                    name: i.nameJp || i.nameEn,
                    nameEn: i.nameEn,
                    category: i.category,
                    rarity: i.rarity,
                }))}
                itemToRecipes={Object.fromEntries(itemToRecipes)}
                itemToQuests={Object.fromEntries(itemToQuests)}
            />
        </div>
    );
}
