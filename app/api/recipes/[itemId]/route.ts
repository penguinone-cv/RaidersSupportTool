import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;

        const recipe = await prisma.recipe.findUnique({
            where: { outputItemId: itemId },
            include: {
                ingredients: {
                    include: { item: true },
                },
            },
        });

        if (!recipe) {
            return NextResponse.json({ recipe: null });
        }

        return NextResponse.json({
            recipe: {
                ingredients: recipe.ingredients.map(ing => ({
                    itemId: ing.itemId,
                    itemName: ing.item.nameJp || ing.item.nameEn,
                    count: ing.count,
                })),
            },
        });
    } catch (error) {
        console.error('Failed to get recipe:', error);
        return NextResponse.json({ error: 'Failed to get recipe' }, { status: 500 });
    }
}
