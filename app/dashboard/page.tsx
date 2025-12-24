import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ClipboardList, Target, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Calculate all required materials from wishlist items
async function calculateWishlistMaterials() {
    const wishlistItems = await prisma.wishlistItem.findMany();
    const materials = new Map<string, { name: string; count: number }>();

    for (const wishItem of wishlistItems) {
        const recipe = await prisma.recipe.findUnique({
            where: { outputItemId: wishItem.itemId },
            include: {
                ingredients: {
                    include: { item: true },
                },
            },
        });

        if (recipe) {
            for (const ingredient of recipe.ingredients) {
                const existing = materials.get(ingredient.itemId);
                const count = ingredient.count * wishItem.quantity;
                if (existing) {
                    existing.count += count;
                } else {
                    materials.set(ingredient.itemId, {
                        name: ingredient.item.nameJp || ingredient.item.nameEn,
                        count,
                    });
                }
            }
        }
    }

    return materials;
}

// Get quest requirements that are not yet delivered
async function getQuestRequirements() {
    const quests = await prisma.quest.findMany({
        where: { isCompleted: false },
        include: {
            requirements: true,
        },
    });

    const materials = new Map<string, { name: string; count: number }>();

    for (const quest of quests) {
        for (const req of quest.requirements) {
            const remaining = req.requiredCount - req.deliveredCount;
            if (remaining > 0) {
                const existing = materials.get(req.itemId);
                if (existing) {
                    existing.count += remaining;
                } else {
                    // Try to get item name from database
                    const item = await prisma.item.findUnique({ where: { id: req.itemId } });
                    materials.set(req.itemId, {
                        name: item?.nameJp || item?.nameEn || req.itemId,
                        count: remaining,
                    });
                }
            }
        }
    }

    return materials;
}

// Merge all materials
function mergeMaterials(...maps: Map<string, { name: string; count: number }>[]) {
    const result = new Map<string, { name: string; count: number }>();

    for (const map of maps) {
        for (const [id, data] of map) {
            const existing = result.get(id);
            if (existing) {
                existing.count += data.count;
            } else {
                result.set(id, { ...data });
            }
        }
    }

    return result;
}

export default async function DashboardPage() {
    const [wishlistMaterials, questMaterials] = await Promise.all([
        calculateWishlistMaterials(),
        getQuestRequirements(),
    ]);

    const totalMaterials = mergeMaterials(wishlistMaterials, questMaterials);

    // Convert to sorted array
    const materialsArray = Array.from(totalMaterials.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count);

    const wishlistArray = Array.from(wishlistMaterials.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count);

    const questArray = Array.from(questMaterials.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
                <p className="text-gray-600">
                    必要な素材の合計を確認できます
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <ClipboardList className="h-6 w-6 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm text-green-700">ウィッシュリスト</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {wishlistMaterials.size} 種類
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Target className="h-6 w-6 text-blue-700" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-700">クエスト納品</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {questMaterials.size} 種類
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Package className="h-6 w-6 text-orange-700" />
                            </div>
                            <div>
                                <p className="text-sm text-orange-700">合計必要素材</p>
                                <p className="text-2xl font-bold text-orange-900">
                                    {totalMaterials.size} 種類
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Materials Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        残すべき素材一覧
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {materialsArray.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">素材名</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">ウィッシュリスト</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">クエスト</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">合計</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materialsArray.map((mat) => {
                                        const wishCount = wishlistMaterials.get(mat.id)?.count || 0;
                                        const questCount = questMaterials.get(mat.id)?.count || 0;
                                        return (
                                            <tr key={mat.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium text-gray-900">{mat.name}</td>
                                                <td className="py-3 px-4 text-right text-green-700">
                                                    {wishCount > 0 ? wishCount : '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right text-blue-700">
                                                    {questCount > 0 ? questCount : '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-orange-700">
                                                    {mat.count}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>必要な素材がありません</p>
                            <p className="text-sm mt-2">
                                ウィッシュリストにアイテムを追加するか、クエストを同期してください
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Individual Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wishlist Materials */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-green-600" />
                            ウィッシュリスト用素材
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {wishlistArray.length > 0 ? (
                            <div className="space-y-2">
                                {wishlistArray.map((mat) => (
                                    <div key={mat.id} className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-700">{mat.name}</span>
                                        <span className="font-medium text-green-700">x{mat.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">
                                ウィッシュリストが空です
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Quest Materials */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            クエスト納品用素材
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {questArray.length > 0 ? (
                            <div className="space-y-2">
                                {questArray.map((mat) => (
                                    <div key={mat.id} className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-700">{mat.name}</span>
                                        <span className="font-medium text-blue-700">x{mat.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">
                                クエスト納品アイテムがありません
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
