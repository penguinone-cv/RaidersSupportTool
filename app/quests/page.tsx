import { prisma } from '@/lib/prisma';
import { seedQuests } from '@/lib/quest-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { QuestListClient } from './quest-list-client';

export const dynamic = 'force-dynamic';

async function getQuests() {
    return await prisma.quest.findMany({
        include: {
            requirements: true,
            rewards: true,
        },
        orderBy: { nameEn: 'asc' },
    });
}

// Get item dictionary for translations
async function getItemDictionary() {
    const items = await prisma.item.findMany({
        select: {
            id: true,
            nameEn: true,
            nameJp: true,
        },
    });
    // Create map: id -> { nameEn, nameJp }
    const dict: Record<string, { nameEn: string; nameJp: string | null }> = {};
    for (const item of items) {
        dict[item.id] = { nameEn: item.nameEn, nameJp: item.nameJp };
    }
    return dict;
}

async function syncQuests() {
    'use server';
    await seedQuests(true);
    revalidatePath('/quests');
}

export default async function QuestsPage() {
    const [quests, itemDict] = await Promise.all([
        getQuests(),
        getItemDictionary(),
    ]);

    // Helper to get item name (JP preferred)
    const getItemName = (itemId: string) => {
        const item = itemDict[itemId];
        if (item) {
            return item.nameJp || item.nameEn;
        }
        return itemId; // fallback to ID if not found
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">クエスト管理</h1>
                    <p className="text-gray-600">
                        {quests.length} クエスト
                    </p>
                </div>
                <form action={syncQuests}>
                    <Button type="submit" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        APIから同期
                    </Button>
                </form>
            </div>

            {/* Quest List */}
            {quests.length > 0 ? (
                <QuestListClient
                    quests={quests.map(q => ({
                        id: q.id,
                        nameEn: q.nameEn,
                        nameJp: q.nameJp,
                        requirements: q.requirements.map(r => ({
                            id: r.id,
                            itemId: r.itemId,
                            itemName: getItemName(r.itemId), // Use translated name
                            requiredCount: r.requiredCount,
                            deliveredCount: r.deliveredCount,
                        })),
                        rewards: q.rewards.map(r => ({
                            id: r.id,
                            itemId: r.itemId,
                            itemName: getItemName(r.itemId), // Use translated name
                            quantity: r.quantity,
                        })),
                    }))}
                />
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-600 mb-4">
                            クエストがありません。APIから同期してください。
                        </p>
                        <form action={syncQuests}>
                            <Button type="submit" variant="tactical">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                クエストを同期
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
