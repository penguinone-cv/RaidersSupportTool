import { prisma } from '@/lib/prisma';
import { WishlistClient } from './wishlist-client';

export const dynamic = 'force-dynamic';

async function getItems() {
    return await prisma.item.findMany({
        orderBy: { nameEn: 'asc' },
    });
}

export default async function WishlistPage() {
    const items = await getItems();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ウィッシュリスト</h1>
                <p className="text-gray-600">
                    欲しいアイテムを登録（ブラウザに保存されます）
                </p>
            </div>

            <WishlistClient
                items={items.map(i => ({
                    id: i.id,
                    name: i.nameJp || i.nameEn,
                    nameEn: i.nameEn,
                }))}
            />
        </div>
    );
}
