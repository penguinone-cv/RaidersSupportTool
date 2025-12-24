import { prisma } from '@/lib/prisma';
import { fetchItems, parseItemForDb } from '@/lib/api-client';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        console.log('Starting item sync...');

        // Fetch items from API
        const apiItems = await fetchItems();
        console.log(`Fetched ${apiItems.length} items from API`);

        // Upsert each item
        let updated = 0;
        for (const apiItem of apiItems) {
            const dbItem = parseItemForDb(apiItem);
            await prisma.item.upsert({
                where: { id: dbItem.id },
                update: {
                    nameEn: dbItem.nameEn,
                    category: dbItem.category,
                    rarity: dbItem.rarity,
                    imageUrl: dbItem.imageUrl,
                    description: dbItem.description,
                    lastFetched: new Date(),
                },
                create: {
                    id: dbItem.id,
                    nameEn: dbItem.nameEn,
                    category: dbItem.category,
                    rarity: dbItem.rarity,
                    imageUrl: dbItem.imageUrl,
                    description: dbItem.description,
                },
            });
            updated++;
        }

        // Update sync metadata
        await prisma.syncMetadata.upsert({
            where: { id: 'singleton' },
            update: {
                lastSyncedAt: new Date(),
                itemCount: updated,
            },
            create: {
                id: 'singleton',
                lastSyncedAt: new Date(),
                itemCount: updated,
            },
        });

        console.log(`Sync complete: ${updated} items updated`);
        return NextResponse.json({
            success: true,
            itemCount: updated,
            message: `${updated} アイテムを同期しました`
        });
    } catch (error) {
        console.error('Sync failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Sync failed'
        }, { status: 500 });
    }
}
