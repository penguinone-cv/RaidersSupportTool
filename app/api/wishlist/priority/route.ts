import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { id, priority } = await request.json();

    await prisma.wishlistItem.update({
        where: { id },
        data: { priority: Math.max(0, priority) },
    });

    return NextResponse.json({ success: true });
}
