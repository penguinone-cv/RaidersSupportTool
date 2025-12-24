'use client';

import { cn, getRarityBgColor } from '@/lib/utils';
import type { RecipeTreeNode } from '@/lib/calculator';
import Image from 'next/image';

interface RecipeTreeProps {
    node: RecipeTreeNode;
    itemImages?: Record<string, string | null>;
}

export function RecipeTree({ node, itemImages = {} }: RecipeTreeProps) {
    return (
        <div className="space-y-2">
            <RecipeNodeComponent node={node} itemImages={itemImages} isRoot />
        </div>
    );
}

function RecipeNodeComponent({
    node,
    itemImages,
    isRoot = false,
}: {
    node: RecipeTreeNode;
    itemImages: Record<string, string | null>;
    isRoot?: boolean;
}) {
    const imageUrl = itemImages[node.itemId];
    const isBaseMaterial = node.children.length === 0;

    return (
        <div className={cn('relative', !isRoot && 'ml-6')}>
            {/* Connection line */}
            {!isRoot && (
                <div className="absolute left-[-20px] top-3 w-4 h-px bg-hud-border" />
            )}
            {!isRoot && (
                <div className="absolute left-[-20px] top-0 w-px h-3 bg-hud-border" />
            )}

            {/* Node content */}
            <div
                className={cn(
                    'flex items-center gap-3 rounded-md p-2',
                    isBaseMaterial
                        ? 'bg-tactical-900/30 border border-tactical-700/50'
                        : 'bg-hud-card border border-hud-border',
                    isRoot && 'border-2 border-tactical-500'
                )}
            >
                {/* Thumbnail */}
                <div
                    className={cn(
                        'relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-hud-border',
                        getRarityBgColor(null)
                    )}
                >
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={node.itemName}
                            fill
                            className="object-contain p-0.5"
                            sizes="40px"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                            ?
                        </div>
                    )}
                </div>

                {/* Name and count */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{node.itemName}</span>
                        {isBaseMaterial && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-tactical-600 text-white">
                                素材
                            </span>
                        )}
                    </div>
                </div>

                {/* Count */}
                <div className="flex-shrink-0 text-right">
                    <span className="text-lg font-bold text-tactical-400">
                        ×{node.count}
                    </span>
                </div>
            </div>

            {/* Children */}
            {node.children.length > 0 && (
                <div className="relative mt-2 space-y-2">
                    {/* Vertical connector line */}
                    <div
                        className="absolute left-4 top-0 w-px bg-hud-border"
                        style={{
                            height: `calc(100% - 1rem)`,
                        }}
                    />
                    {node.children.map((child, index) => (
                        <RecipeNodeComponent
                            key={`${child.itemId}-${index}`}
                            node={child}
                            itemImages={itemImages}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
