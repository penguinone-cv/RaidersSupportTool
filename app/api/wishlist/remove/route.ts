import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { id } = await request.json();

    await prisma.wishlistItem.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}
