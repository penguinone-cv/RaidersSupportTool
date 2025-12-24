'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Wrench, Target, Package, ChevronRight } from 'lucide-react';

interface Item {
    id: string;
    name: string;
    nameEn: string;
    category: string | null;
    rarity: string | null;
}

interface RecipeUsage {
    recipeId: number;
    outputName: string;
    count: number;
}

interface QuestUsage {
    questId: string;
    questName: string;
    count: number;
}

interface MaterialLookupClientProps {
    items: Item[];
    itemToRecipes: Record<string, RecipeUsage[]>;
    itemToQuests: Record<string, QuestUsage[]>;
}

export function MaterialLookupClient({ items, itemToRecipes, itemToQuests }: MaterialLookupClientProps) {
    const [search, setSearch] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Filter items by search
    const filteredItems = useMemo(() => {
        if (!search) return items.slice(0, 50); // Show first 50 items initially
        const searchLower = search.toLowerCase();
        return items.filter(item =>
            item.name.toLowerCase().includes(searchLower) ||
            item.nameEn.toLowerCase().includes(searchLower)
        ).slice(0, 50);
    }, [items, search]);

    const selectedItem = items.find(i => i.id === selectedItemId);
    const recipes = selectedItemId ? (itemToRecipes[selectedItemId] || []) : [];
    const quests = selectedItemId ? (itemToQuests[selectedItemId] || []) : [];

    // Get items that have usages
    const itemsWithUsage = useMemo(() => {
        return items.filter(i =>
            (itemToRecipes[i.id]?.length || 0) > 0 ||
            (itemToQuests[i.id]?.length || 0) > 0
        );
    }, [items, itemToRecipes, itemToQuests]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Item List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        素材を選択
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="素材名で検索..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1 max-h-[500px] overflow-y-auto">
                        {filteredItems.map((item) => {
                            const recipeCount = itemToRecipes[item.id]?.length || 0;
                            const questCount = itemToQuests[item.id]?.length || 0;
                            const hasUsage = recipeCount > 0 || questCount > 0;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedItemId(item.id)}
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors flex items-center justify-between ${selectedItemId === item.id
                                            ? 'border-green-500 bg-green-50'
                                            : hasUsage
                                                ? 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                                                : 'border-gray-100 hover:border-gray-200 opacity-60'
                                        }`}
                                >
                                    <div>
                                        <div className="font-medium text-gray-900 text-sm">
                                            {item.name}
                                        </div>
                                        {item.category && (
                                            <div className="text-xs text-gray-500">
                                                {item.category}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs shrink-0">
                                        {recipeCount > 0 && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                レシピ {recipeCount}
                                            </span>
                                        )}
                                        {questCount > 0 && (
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                                クエスト {questCount}
                                            </span>
                                        )}
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </button>
                            );
                        })}
                        {filteredItems.length === 0 && (
                            <p className="text-center text-gray-500 py-4">
                                アイテムが見つかりません
                            </p>
                        )}
                        {!search && filteredItems.length === 50 && (
                            <p className="text-center text-gray-400 text-sm py-2">
                                検索して絞り込んでください（{items.length}件中50件表示）
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Usage Details */}
            <div className="space-y-4">
                {selectedItem ? (
                    <>
                        {/* Selected Item Info */}
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6">
                                <h3 className="font-bold text-lg text-green-900">
                                    {selectedItem.name}
                                </h3>
                                {selectedItem.name !== selectedItem.nameEn && (
                                    <p className="text-sm text-green-700">{selectedItem.nameEn}</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                    {selectedItem.category && (
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                            {selectedItem.category}
                                        </span>
                                    )}
                                    {selectedItem.rarity && (
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                            {selectedItem.rarity}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recipes */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-blue-600" />
                                    使用するレシピ ({recipes.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recipes.length > 0 ? (
                                    <ul className="space-y-2">
                                        {recipes.map((recipe, idx) => (
                                            <li
                                                key={idx}
                                                className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg"
                                            >
                                                <span className="font-medium text-blue-900">
                                                    {recipe.outputName}
                                                </span>
                                                <span className="text-blue-700 text-sm">
                                                    x{recipe.count} 必要
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-sm text-center py-4">
                                        この素材を使うレシピは登録されていません
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quests */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Target className="h-4 w-4 text-orange-600" />
                                    必要なクエスト ({quests.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {quests.length > 0 ? (
                                    <ul className="space-y-2">
                                        {quests.map((quest, idx) => (
                                            <li
                                                key={idx}
                                                className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg"
                                            >
                                                <span className="font-medium text-orange-900">
                                                    {quest.questName}
                                                </span>
                                                <span className="text-orange-700 text-sm">
                                                    x{quest.count} 納品
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-sm text-center py-4">
                                        この素材を必要とするクエストはありません
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">
                                左の一覧から素材を選択してください
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
