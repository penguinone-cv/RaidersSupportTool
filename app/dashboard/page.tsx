'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ClipboardList, Target, AlertTriangle, RefreshCw, ChevronDown, ChevronRight, X } from 'lucide-react';

const WISHLIST_COOKIE_NAME = 'wishlist_items';
const BASE_PATH = '/arc-raiders-tool';

interface WishlistItem {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    priority: number;
}

interface MaterialUsage {
    sourceName: string;
    sourceType: 'wishlist' | 'quest';
    sourceId: string; // itemId for wishlist, questId for quest
    count: number;
}

interface MaterialData {
    id: string;
    name: string;
    wishlistCount: number;
    questCount: number;
    usages: MaterialUsage[];
}

interface PopupData {
    type: 'wishlist' | 'quest';
    name: string;
    ingredients: { itemName: string; count: number }[];
}

// Cookie utilities
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function getWishlistItems(): WishlistItem[] {
    const cookie = getCookie(WISHLIST_COOKIE_NAME);
    if (!cookie) return [];
    try {
        return JSON.parse(cookie);
    } catch {
        return [];
    }
}

const QUEST_PROGRESS_COOKIE = 'quest_progress';

function getCompletedQuestIds(): string[] {
    const cookie = getCookie(QUEST_PROGRESS_COOKIE);
    if (!cookie) return [];
    try {
        return JSON.parse(cookie);
    } catch {
        return [];
    }
}

export default function DashboardPage() {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [recipes, setRecipes] = useState<Record<string, { ingredients: { itemId: string; itemName: string; count: number }[] }>>({});
    const [questMaterialsData, setQuestMaterialsData] = useState<{ materials: Record<string, { name: string; count: number; questName: string; questId: string }[]> }>({ materials: {} });
    const [questDetails, setQuestDetails] = useState<Record<string, { requirements: { itemName: string; count: number }[] }>>({});
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [popup, setPopup] = useState<PopupData | null>(null);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            // Load wishlist from cookies
            const items = getWishlistItems();
            setWishlistItems(items);

            // Fetch recipes for wishlist items
            const recipeMap: Record<string, { ingredients: { itemId: string; itemName: string; count: number }[] }> = {};
            for (const item of items) {
                try {
                    const res = await fetch(`${BASE_PATH}/api/recipes/${item.itemId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.recipe) {
                            recipeMap[item.itemId] = data.recipe;
                        }
                    }
                } catch (e) {
                    // Recipe not found, skip
                }
            }
            setRecipes(recipeMap);

            // Get completed quest IDs from cookie
            const completedIds = getCompletedQuestIds();
            const completedParam = completedIds.length > 0 ? `?completedIds=${completedIds.join(',')}` : '';

            // Fetch quest materials with details (excluding completed quests)
            try {
                const res = await fetch(`${BASE_PATH}/api/dashboard/quest-materials${completedParam}`);
                if (res.ok) {
                    const data = await res.json();
                    setQuestMaterialsData(data);

                    // Store quest details for popup
                    if (data.questDetails) {
                        setQuestDetails(data.questDetails);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch quest materials:', e);
            }

            setLoading(false);
        };

        loadData();
    }, []);

    // Show popup for wishlist item
    const showWishlistPopup = (itemId: string, itemName: string) => {
        const recipe = recipes[itemId];
        if (recipe) {
            setPopup({
                type: 'wishlist',
                name: itemName,
                ingredients: recipe.ingredients.map(ing => ({
                    itemName: ing.itemName,
                    count: ing.count,
                })),
            });
        }
    };

    // Show popup for quest
    const showQuestPopup = async (questId: string, questName: string) => {
        // Check if we already have quest details
        if (questDetails[questId]) {
            setPopup({
                type: 'quest',
                name: questName,
                ingredients: questDetails[questId].requirements,
            });
        } else {
            // Fetch quest requirements
            try {
                const res = await fetch(`${BASE_PATH}/api/quests/${questId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.requirements) {
                        setPopup({
                            type: 'quest',
                            name: questName,
                            ingredients: data.requirements.map((r: { itemName: string; count: number }) => ({
                                itemName: r.itemName,
                                count: r.count,
                            })),
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to fetch quest details:', e);
            }
        }
    };

    // Calculate materials with usage details
    const { wishlistMaterials, totalMaterials } = useMemo(() => {
        const wishlistMats = new Map<string, { name: string; count: number; usages: MaterialUsage[] }>();
        const questMats = new Map<string, { name: string; count: number; usages: MaterialUsage[] }>();

        // Process wishlist items
        for (const wishItem of wishlistItems) {
            const recipe = recipes[wishItem.itemId];
            if (recipe) {
                for (const ingredient of recipe.ingredients) {
                    const count = ingredient.count * wishItem.quantity;
                    const existing = wishlistMats.get(ingredient.itemId);
                    const usage: MaterialUsage = {
                        sourceName: wishItem.itemName,
                        sourceType: 'wishlist',
                        sourceId: wishItem.itemId,
                        count,
                    };
                    if (existing) {
                        existing.count += count;
                        existing.usages.push(usage);
                    } else {
                        wishlistMats.set(ingredient.itemId, {
                            name: ingredient.itemName,
                            count,
                            usages: [usage],
                        });
                    }
                }
            }
        }

        // Process quest materials
        const questMaterialsMap = questMaterialsData.materials || {};
        for (const [itemId, usages] of Object.entries(questMaterialsMap)) {
            const totalCount = usages.reduce((sum, u) => sum + u.count, 0);
            if (totalCount > 0) {
                questMats.set(itemId, {
                    name: usages[0]?.name || itemId,
                    count: totalCount,
                    usages: usages.map(u => ({
                        sourceName: u.questName,
                        sourceType: 'quest' as const,
                        sourceId: u.questId,
                        count: u.count,
                    })),
                });
            }
        }

        // Merge all materials
        const total = new Map<string, MaterialData>();

        for (const [id, data] of wishlistMats) {
            total.set(id, {
                id,
                name: data.name,
                wishlistCount: data.count,
                questCount: 0,
                usages: data.usages,
            });
        }

        for (const [id, data] of questMats) {
            const existing = total.get(id);
            if (existing) {
                existing.questCount = data.count;
                existing.usages.push(...data.usages);
            } else {
                total.set(id, {
                    id,
                    name: data.name,
                    wishlistCount: 0,
                    questCount: data.count,
                    usages: data.usages,
                });
            }
        }

        return { wishlistMaterials: wishlistMats, totalMaterials: total };
    }, [wishlistItems, recipes, questMaterialsData]);

    const materialsArray = Array.from(totalMaterials.values())
        .sort((a, b) => (b.wishlistCount + b.questCount) - (a.wishlistCount + a.questCount));

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Popup Modal */}
            {popup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPopup(null)}>
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                            <div className="flex items-center gap-2">
                                {popup.type === 'wishlist' ? (
                                    <ClipboardList className="h-5 w-5 text-green-600" />
                                ) : (
                                    <Target className="h-5 w-5 text-blue-600" />
                                )}
                                <h3 className="font-semibold text-gray-900">{popup.name}</h3>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setPopup(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            <p className="text-sm text-gray-500 mb-3">必要素材一覧</p>
                            {popup.ingredients.length > 0 ? (
                                <div className="space-y-2">
                                    {popup.ingredients.map((ing, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-700">{ing.itemName}</span>
                                            <span className="font-medium text-orange-600">x{ing.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">素材情報がありません</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                    {Array.from(totalMaterials.values()).filter(m => m.questCount > 0).length} 種類
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
                    <p className="text-sm text-gray-500">
                        行をクリックで展開、アイテム/クエスト名をクリックで詳細表示
                    </p>
                </CardHeader>
                <CardContent>
                    {materialsArray.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 w-8"></th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">素材名</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">ウィッシュリスト</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">クエスト</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">合計</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materialsArray.map((mat) => {
                                        const isExpanded = expandedRows.has(mat.id);
                                        return (
                                            <React.Fragment key={mat.id}>
                                                <tr
                                                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => toggleRow(mat.id)}
                                                >
                                                    <td className="py-3 px-4">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-gray-900">{mat.name}</td>
                                                    <td className="py-3 px-4 text-right text-green-700">
                                                        {mat.wishlistCount > 0 ? mat.wishlistCount : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-blue-700">
                                                        {mat.questCount > 0 ? mat.questCount : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-orange-700">
                                                        {mat.wishlistCount + mat.questCount}
                                                    </td>
                                                </tr>
                                                {isExpanded && mat.usages.length > 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="bg-gray-50 px-8 py-3">
                                                            <div className="space-y-1">
                                                                {mat.usages.map((usage, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="flex justify-between text-sm"
                                                                    >
                                                                        <button
                                                                            className="flex items-center gap-2 hover:underline text-left"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (usage.sourceType === 'wishlist') {
                                                                                    showWishlistPopup(usage.sourceId, usage.sourceName);
                                                                                } else {
                                                                                    showQuestPopup(usage.sourceId, usage.sourceName);
                                                                                }
                                                                            }}
                                                                        >
                                                                            {usage.sourceType === 'wishlist' ? (
                                                                                <ClipboardList className="h-3 w-3 text-green-600" />
                                                                            ) : (
                                                                                <Target className="h-3 w-3 text-blue-600" />
                                                                            )}
                                                                            <span className={`${usage.sourceType === 'wishlist' ? 'text-green-700' : 'text-blue-700'} hover:text-opacity-80`}>
                                                                                {usage.sourceName}
                                                                            </span>
                                                                        </button>
                                                                        <span className="font-medium text-gray-700">
                                                                            x{usage.count}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
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
        </div>
    );
}
