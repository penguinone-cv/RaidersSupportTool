import { Suspense } from 'react';
import { getItems, getCategories, getRarities, getSyncStatus } from '@/lib/actions';
import { ItemGridClient } from './item-grid-client';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Clock, Package } from 'lucide-react';
import { SyncButton } from '@/components/sync-button';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const [items, categories, rarities, syncStatus] = await Promise.all([
        getItems({ limit: 1000 }),
        getCategories(),
        getRarities(),
        getSyncStatus(),
    ]);

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <Card className="border-tactical-700/50">
                <CardContent className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-sm">
                                <Package className="h-4 w-4 text-tactical-400" />
                                <span className="text-muted-foreground">アイテム:</span>
                                <span className="font-medium text-foreground">{syncStatus.itemCount}</span>
                            </div>
                            {syncStatus.lastSyncedAt && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-tactical-400" />
                                    <span className="text-muted-foreground">最終同期:</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(syncStatus.lastSyncedAt).toLocaleString('ja-JP')}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Database className="h-3 w-3" />
                                <span>Powered by MetaForge API</span>
                            </div>
                            <SyncButton />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Item Grid */}
            <Suspense fallback={<ItemGridSkeleton />}>
                <ItemGridClient
                    items={items}
                    categories={categories}
                    rarities={rarities}
                />
            </Suspense>
        </div>
    );
}

function ItemGridSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-14 bg-hud-card border border-hud-border rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-24 bg-hud-card border border-hud-border rounded-lg animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}
