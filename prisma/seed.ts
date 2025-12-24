import { PrismaClient } from '@prisma/client';
import { fetchItems, parseItemForDb, isCacheValid } from '../lib/api-client';

const prisma = new PrismaClient();

// Dynamic import for google-translate-api-x to handle ESM module
async function translateText(text: string, targetLang: string = 'ja'): Promise<string> {
    try {
        const { translate } = await import('google-translate-api-x');
        const result = await translate(text, { to: targetLang });
        return result.text;
    } catch (error) {
        console.warn(`Translation failed for "${text}":`, error);
        return text; // Fallback to original text
    }
}

async function translateWithRetry(text: string, retries: number = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
        try {
            const translated = await translateText(text);
            if (translated && translated !== text) {
                return translated;
            }
        } catch (error) {
            console.warn(`Translation attempt ${i + 1} failed:`, error);
        }

        // Wait before retry (exponential backoff)
        if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }

    // Fallback: return original text
    return text;
}

async function shouldSync(force: boolean): Promise<boolean> {
    if (force) {
        console.log('Force flag enabled, will sync regardless of cache');
        return true;
    }

    const metadata = await prisma.syncMetadata.findUnique({
        where: { id: 'singleton' },
    });

    if (!metadata) {
        console.log('No previous sync found, will perform initial sync');
        return true;
    }

    if (isCacheValid(metadata.lastSyncedAt)) {
        console.log(`Cache is still valid (last synced: ${metadata.lastSyncedAt.toISOString()})`);
        console.log('Use --force to sync anyway');
        return false;
    }

    console.log('Cache expired, will sync');
    return true;
}

async function main() {
    const force = process.argv.includes('--force');

    console.log('🎮 ARC Raiders Support Tool - Database Seeding');
    console.log('================================================');

    // Check if we should sync
    if (!(await shouldSync(force))) {
        console.log('✅ Skipping sync (cache is valid)');
        return;
    }

    console.log('\n📡 Fetching items from MetaForge API...');

    let items;
    try {
        items = await fetchItems();
        console.log(`✅ Fetched ${items.length} items from API`);
    } catch (error) {
        console.error('❌ Failed to fetch items from API:', error);
        throw error;
    }

    console.log('\n📝 Processing and translating items...');

    let successCount = 0;
    let translatedCount = 0;
    const batchSize = 10;

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        await Promise.all(batch.map(async (apiItem) => {
            try {
                const dbItem = parseItemForDb(apiItem);

                // Try to translate name to Japanese
                let nameJp = dbItem.nameEn;
                try {
                    nameJp = await translateWithRetry(dbItem.nameEn);
                    if (nameJp !== dbItem.nameEn) {
                        translatedCount++;
                    }
                } catch {
                    // Fallback already applied in translateWithRetry
                }

                await prisma.item.upsert({
                    where: { id: dbItem.id },
                    update: {
                        nameEn: dbItem.nameEn,
                        nameJp: nameJp,
                        category: dbItem.category,
                        rarity: dbItem.rarity,
                        imageUrl: dbItem.imageUrl,
                        description: dbItem.description,
                        lastFetched: new Date(),
                    },
                    create: {
                        id: dbItem.id,
                        nameEn: dbItem.nameEn,
                        nameJp: nameJp,
                        category: dbItem.category,
                        rarity: dbItem.rarity,
                        imageUrl: dbItem.imageUrl,
                        description: dbItem.description,
                        lastFetched: new Date(),
                    },
                });

                successCount++;
            } catch (error) {
                console.warn(`Failed to process item ${apiItem.id}:`, error);
            }
        }));

        // Progress indicator
        const progress = Math.min(100, Math.round(((i + batch.length) / items.length) * 100));
        process.stdout.write(`\r  Progress: ${progress}% (${successCount}/${items.length})`);

        // Rate limiting: small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n');

    // Update sync metadata
    await prisma.syncMetadata.upsert({
        where: { id: 'singleton' },
        update: {
            lastSyncedAt: new Date(),
            itemCount: successCount,
        },
        create: {
            id: 'singleton',
            lastSyncedAt: new Date(),
            itemCount: successCount,
            recipeCount: 0,
        },
    });

    console.log('================================================');
    console.log(`✅ Sync complete!`);
    console.log(`   Items processed: ${successCount}`);
    console.log(`   Translations: ${translatedCount}`);
    console.log('================================================');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
