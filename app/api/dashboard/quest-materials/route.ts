import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get incomplete quests with requirements
        const quests = await prisma.quest.findMany({
            where: { isCompleted: false },
            include: {
                requirements: true,
            },
        });

        // Group by material with quest name details
        const materials: Record<string, { name: string; count: number; questName: string; questId: string }[]> = {};
        const questDetails: Record<string, { requirements: { itemName: string; count: number }[] }> = {};

        for (const quest of quests) {
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
