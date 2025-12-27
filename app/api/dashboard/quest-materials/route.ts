import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Get completed quest IDs from query parameter (comma-separated)
        const searchParams = request.nextUrl.searchParams;
        const completedIdsParam = searchParams.get('completedIds');
        const completedIds = completedIdsParam ? completedIdsParam.split(',').filter(Boolean) : [];

        // Get quests (either not marked as completed in DB or not in completed cookie list)
        const quests = await prisma.quest.findMany({
            include: {
                requirements: true,
            },
        });

        // Filter out completed quests (both from DB and from cookie)
        const activeQuests = quests.filter(q => !q.isCompleted && !completedIds.includes(q.id));

        // Group by material with quest name details
        const materials: Record<string, { name: string; count: number; questName: string; questId: string }[]> = {};
        const questDetails: Record<string, { requirements: { itemName: string; count: number }[] }> = {};

        for (const quest of activeQuests) {
            const questName = quest.nameJp || quest.nameEn;
            const questRequirements: { itemName: string; count: number }[] = [];

            for (const req of quest.requirements) {
                const remaining = req.requiredCount - req.deliveredCount;
                if (remaining > 0) {
                    // Get item name
                    const item = await prisma.item.findUnique({ where: { id: req.itemId } });
                    const itemName = item?.nameJp || item?.nameEn || req.itemId;

                    if (!materials[req.itemId]) {
                        materials[req.itemId] = [];
                    }

                    materials[req.itemId].push({
                        name: itemName,
                        count: remaining,
                        questName,
                        questId: quest.id,
                    });

                    questRequirements.push({
                        itemName,
                        count: remaining,
                    });
                }
            }

            if (questRequirements.length > 0) {
                questDetails[quest.id] = { requirements: questRequirements };
            }
        }

        return NextResponse.json({ materials, questDetails });
    } catch (error) {
        console.error('Failed to get quest materials:', error);
        return NextResponse.json({ error: 'Failed to get quest materials' }, { status: 500 });
    }
}
