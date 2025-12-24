import { prisma } from '@/lib/prisma';
import { RecipeEditorClient } from './recipe-editor-client';

export const dynamic = 'force-dynamic';

async function getRecipes() {
    return await prisma.recipe.findMany({
        include: {
            outputItem: true,
            ingredients: {
                include: {
                    item: true,
                },
            },
        },
        orderBy: { outputItem: { nameEn: 'asc' } },
    });
}

async function getItems() {
    return await prisma.item.findMany({
        orderBy: { nameEn: 'asc' },
    });
}

export default async function RecipesPage() {
    const [recipes, items] = await Promise.all([
        getRecipes(),
        getItems(),
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">レシピ管理</h1>
                <p className="text-gray-600">
                    {recipes.length} レシピ登録済み | アイテムを選択してレシピを編集できます
                </p>
            </div>

            <RecipeEditorClient
                recipes={recipes.map(r => ({
                    id: r.id,
                    outputItemId: r.outputItemId,
                    outputItemName: r.outputItem.nameJp || r.outputItem.nameEn,
                    station: r.station,
                    ingredients: r.ingredients.map(ing => ({
                        id: ing.id,
                        itemId: ing.itemId,
                        itemName: ing.item.nameJp || ing.item.nameEn,
                        count: ing.count,
                    })),
                }))}
                items={items.map(i => ({
                    id: i.id,
                    name: i.nameJp || i.nameEn,
                    nameEn: i.nameEn,
                }))}
            />
        </div>
    );
}
