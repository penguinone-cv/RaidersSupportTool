import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Default translations for known rarity values
const DEFAULT_RARITY: Record<string, string> = {
    legendary: 'レジェンダリー',
    epic: 'エピック',
    rare: 'レア',
    uncommon: 'アンコモン',
    common: 'コモン',
};

// GET - 翻訳一覧を取得（実際のカテゴリ/レアリティと一緒に）
export async function GET() {
    try {
        // Get saved translations
        const translations = await prisma.translation.findMany({
            orderBy: [{ type: 'asc' }, { keyEn: 'asc' }],
        });

        // Get actual categories and rarities from items
        const items = await prisma.item.findMany({
            select: { category: true, rarity: true },
        });

        // Extract unique categories and rarities
        const actualCategories = new Set<string>();
        const actualRarities = new Set<string>();

        for (const item of items) {
            if (item.category) {
                actualCategories.add(item.category.toLowerCase());
            }
            if (item.rarity) {
                actualRarities.add(item.rarity.toLowerCase());
            }
        }

        // Build translation maps
        const rarityMap: Record<string, string> = {};
        const categoryMap: Record<string, string> = {};

        // Add all actual rarities with defaults
        for (const rarity of actualRarities) {
            rarityMap[rarity] = DEFAULT_RARITY[rarity] || rarity;
        }

        // Add all actual categories (no default translation, just the original)
        for (const category of actualCategories) {
            categoryMap[category] = category; // Default to original
        }

        // Override with saved translations
        for (const t of translations) {
            if (t.type === 'rarity') {
                rarityMap[t.keyEn] = t.valueJp;
            } else if (t.type === 'category') {
                categoryMap[t.keyEn] = t.valueJp;
            }
        }

        return NextResponse.json({
            success: true,
            rarity: rarityMap,
            category: categoryMap,
            actualCategories: Array.from(actualCategories).sort(),
            actualRarities: Array.from(actualRarities).sort(),
        });
    } catch (error) {
        console.error('Failed to get translations:', error);
        return NextResponse.json({ success: false, error: 'Failed to get translations' }, { status: 500 });
    }
}

// POST - 翻訳を更新
export async function POST(request: NextRequest) {
    try {
        const { type, keyEn, valueJp } = await request.json();

        if (!type || !keyEn || !valueJp) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const translation = await prisma.translation.upsert({
            where: {
                type_keyEn: {
                    type,
                    keyEn: keyEn.toLowerCase(),
                },
            },
            update: {
                valueJp,
            },
            create: {
                type,
                keyEn: keyEn.toLowerCase(),
                valueJp,
            },
        });

        return NextResponse.json({ success: true, translation });
    } catch (error) {
        console.error('Failed to update translation:', error);
        return NextResponse.json({ success: false, error: 'Failed to update translation' }, { status: 500 });
    }
}

// DELETE - 翻訳を削除
export async function DELETE(request: NextRequest) {
    try {
        const { type, keyEn } = await request.json();

        if (!type || !keyEn) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        await prisma.translation.delete({
            where: {
                type_keyEn: {
                    type,
                    keyEn: keyEn.toLowerCase(),
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete translation:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete translation' }, { status: 500 });
    }
}
