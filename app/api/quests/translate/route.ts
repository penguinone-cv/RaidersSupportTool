import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { questId, nameJp } = await request.json();

        if (!questId) {
            return NextResponse.json(
                { success: false, error: 'Quest ID is required' },
                { status: 400 }
            );
        }

        await prisma.quest.update({
            where: { id: questId },
            data: { nameJp },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update quest translation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update translation' },
            { status: 500 }
        );
    }
}
