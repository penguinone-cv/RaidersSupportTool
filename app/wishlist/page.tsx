import { prisma } from '@/lib/prisma';
import { WishlistClient } from './wishlist-client';

export const dynamic = 'force-dynamic';

async function getWishlistItems() {
    return await prisma.wishlistItem.findMany({
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
        ],
    });
}

async function getItems() {
    return await prisma.item.findMany({
        orderBy: { nameEn: 'asc' },
    });
}

export default async function WishlistPage() {
    const [wishlistItems, items] = await Promise.all([
        getWishlistItems(),
        getItems(),
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ウィッシュリスト</h1>
                <p className="text-gray-600">
                    {wishlistItems.length} アイテム登録中
                </p>
            </div>

            <WishlistClient
                wishlistItems={wishlistItems.map(w => ({
                    id: w.id,
                    itemId: w.itemId,
                    itemName: w.itemName,
                    quantity: w.quantity,
                    priority: w.priority,
                }))}
                items={items.map(i => ({
                    id: i.id,
                    name: i.nameJp || i.nameEn,
                    nameEn: i.nameEn,
                }))}
            />
        </div>
    );
}
