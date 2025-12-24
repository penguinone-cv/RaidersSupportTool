'use client';

import { useState } from 'react';
import { ItemGrid } from '@/components/item-grid';
import { DictionaryEditor } from '@/components/dictionary-editor';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn, getRarityColor, getRarityBgColor } from '@/lib/utils';

interface Item {
    id: string;
    nameEn: string;
    nameJp: string | null;
    category: string | null;
    rarity: string | null;
    imageUrl: string | null;
}

interface ItemGridClientProps {
    items: Item[];
    categories: string[];
    rarities: string[];
}

export function ItemGridClient({ items, categories, rarities }: ItemGridClientProps) {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    return (
        <>
            <ItemGrid
                items={items}
                categories={categories}
                rarities={rarities}
                onItemClick={setSelectedItem}
            />

            {/* Item Detail Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-md">
                    {selectedItem && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    {/* Thumbnail */}
                                    <div
                                        className={cn(
                                            'relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden',
                                            'border-2',
                                            getRarityColor(selectedItem.rarity),
                                            getRarityBgColor(selectedItem.rarity)
                                        )}
                                    >
                                        {selectedItem.imageUrl ? (
                                            <Image
                                                src={selectedItem.imageUrl}
                                                alt={selectedItem.nameEn}
                                                fill
                                                className="object-contain p-1"
                                                sizes="48px"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                                ?
                                            </div>
                                        )}
                                    </div>
                                    <span>{selectedItem.nameJp || selectedItem.nameEn}</span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 pt-2">
                                {/* English name */}
                                <div>
                                    <label className="text-xs text-muted-foreground">英語名</label>
                                    <p className="text-sm">{selectedItem.nameEn}</p>
                                </div>

                                {/* Japanese name editor */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                        日本語名（クリックで編集）
                                    </label>
                                    <DictionaryEditor
                                        itemId={selectedItem.id}
                                        nameEn={selectedItem.nameEn}
                                        nameJp={selectedItem.nameJp}
                                    />
                                </div>

                                {/* Metadata */}
                                <div className="flex flex-wrap gap-3 pt-2">
                                    {selectedItem.category && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">カテゴリー</label>
                                            <p className="text-sm">{selectedItem.category}</p>
                                        </div>
                                    )}
                                    {selectedItem.rarity && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">レアリティ</label>
                                            <p className={cn('text-sm font-medium', getRarityColor(selectedItem.rarity))}>
                                                {selectedItem.rarity}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ID for reference */}
                                <div className="pt-2 border-t border-hud-border">
                                    <label className="text-xs text-muted-foreground">ID</label>
                                    <p className="text-xs font-mono text-muted-foreground">{selectedItem.id}</p>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
