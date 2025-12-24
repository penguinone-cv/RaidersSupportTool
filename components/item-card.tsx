'use client';

import Image from 'next/image';
import { cn, getRarityColor, getRarityBgColor } from '@/lib/utils';
import { Card, CardContent } from './ui/card';

interface ItemCardProps {
    id: string;
    nameEn: string;
    nameJp: string | null;
    category: string | null;
    rarity: string | null;
    imageUrl: string | null;
    onClick?: () => void;
}

export function ItemCard({
    id,
    nameEn,
    nameJp,
    category,
    rarity,
    imageUrl,
    onClick,
}: ItemCardProps) {
    const rarityColor = getRarityColor(rarity);
    const rarityBg = getRarityBgColor(rarity);

    return (
        <Card
            className={cn(
                'cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
                'border-l-4 border-2 border-gray-300',
                rarityColor,
                'overflow-hidden bg-white'
            )}
            onClick={onClick}
        >
            <CardContent className="p-0">
                <div className="flex items-start gap-3 p-4">
                    {/* Thumbnail */}
                    <div
                        className={cn(
                            'relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden',
                            'border-2 border-gray-300',
                            rarityBg
                        )}
                    >
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={nameEn}
                                fill
                                className="object-contain p-1"
                                sizes="64px"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400 bg-gray-100">
                                <svg
                                    className="h-8 w-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                            {nameJp || nameEn}
                        </h3>
                        {nameJp && nameJp !== nameEn && (
                            <p className="text-xs text-gray-500 truncate">{nameEn}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                            {rarity && (
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                        rarityBg,
                                        rarityColor
                                    )}
                                >
                                    {rarity}
                                </span>
                            )}
                            {category && (
                                <span className="text-xs text-gray-500">{category}</span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
