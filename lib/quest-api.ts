import { prisma } from './prisma';

const API_BASE_URL = 'https://metaforge.app/api/arc-raiders';

interface ApiQuest {
    id: string;
    name: string;
    objectives: string[];
    image?: string | null;
    required_items?: {
        item_id: string;
        quantity: number;
    }[];
    rewards?: {
        item: {
            id: string;
            name: string;
        };
        quantity: string | number;
    }[];
}

interface ApiResponse {
    data: ApiQuest[];
    pagination: {
        page: number;
        totalPages: number;
        hasNextPage: boolean;
    };
}

export async function fetchAllQuests(): Promise<ApiQuest[]> {
    const allQuests: ApiQuest[] = [];
    let page = 1;
    let hasNextPage = true;

    console.log('Fetching quests with pagination...');

    while (hasNextPage) {
        const response = await fetch(`${API_BASE_URL}/quests?page=${page}&limit=50`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ARC-Raiders-Support-Tool/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data: ApiResponse = await response.json();
        allQuests.push(...data.data);

        if (data.pagination?.hasNextPage) {
            page++;
            console.log(`  Page ${page - 1} fetched (${data.data.length} quests), fetching next...`);
            await new Promise(resolve => setTimeout(resolve, 100));
        } else {
            hasNextPage = false;
        }
    }

    console.log(`Total quests fetched: ${allQuests.length}`);
    return allQuests;
}

export async function seedQuests(force = false): Promise<number> {
    // Check cache
    const syncMetadata = await prisma.syncMetadata.findUnique({ where: { id: 'singleton' } });

    if (!force && syncMetadata && syncMetadata.questCount > 0) {
        console.log('Quests already seeded, skipping...');
        return syncMetadata.questCount;
    }

    const quests = await fetchAllQuests();

    for (const quest of quests) {
        await prisma.quest.upsert({
            where: { id: quest.id },
            update: {
                nameEn: quest.name,
                objectives: JSON.stringify(quest.objectives || []),
                imageUrl: quest.image || null,
            },
            create: {
                id: quest.id,
                nameEn: quest.name,
                objectives: JSON.stringify(quest.objectives || []),
                imageUrl: quest.image || null,
                requirements: {
                    create: (quest.required_items || []).map((item) => ({
                        itemId: item.item_id,
                        requiredCount: item.quantity,
                    })),
                },
                rewards: {
                    create: (quest.rewards || []).map((reward) => ({
                        itemId: reward.item.id,
                        itemName: reward.item.name,
                        quantity: typeof reward.quantity === 'string' ? parseInt(reward.quantity, 10) : reward.quantity,
                    })),
                },
            },
        });
    }

    // Update metadata
    await prisma.syncMetadata.upsert({
        where: { id: 'singleton' },
        update: { questCount: quests.length },
        create: { id: 'singleton', questCount: quests.length },
    });

    return quests.length;
}
