import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const formData = await request.formData();
    const itemId = formData.get('itemId') as string;
    const itemName = formData.get('itemName') as string;
    const quantity = parseInt(formData.get('quantity') as string, 10) || 1;

    await prisma.wishlistItem.create({
        data: { itemId, itemName, quantity },
    });

    return NextResponse.json({ success: true });
}
