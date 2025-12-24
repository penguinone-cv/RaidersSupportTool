'use client';

import { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';

interface BlueprintItem {
    id: string;
    nameEn: string;
    nameJp: string | null;
}

interface Member {
    id: string;
    name: string;
    inventoryData: string | null;
}

interface BlueprintMatrixProps {
    blueprints: BlueprintItem[];
    members: Member[];
    onToggle: (memberId: string, itemId: string, hasItem: boolean) => void;
}

export function BlueprintMatrix({ blueprints, members, onToggle }: BlueprintMatrixProps) {
    const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());
    const [expandedBlueprints, setExpandedBlueprints] = useState<Set<string>>(new Set());

    // Parse inventory data for each member
    const memberInventories = new Map<string, Set<string>>();
    for (const member of members) {
        try {
            const inventory: string[] = member.inventoryData
                ? JSON.parse(member.inventoryData)
                : [];
            memberInventories.set(member.id, new Set(inventory));
        } catch {
            memberInventories.set(member.id, new Set());
        }
    }

    const handleToggle = async (memberId: string, itemId: string) => {
        const cellKey = `${memberId}-${itemId}`;
        const inventory = memberInventories.get(memberId) || new Set();
        const hasItem = inventory.has(itemId);

        setLoadingCells((prev) => new Set(prev).add(cellKey));

        try {
            await onToggle(memberId, itemId, !hasItem);
        } finally {
            setLoadingCells((prev) => {
                const next = new Set(prev);
                next.delete(cellKey);
                return next;
            });
        }
    };

    const toggleExpanded = (blueprintId: string) => {
        setExpandedBlueprints((prev) => {
            const next = new Set(prev);
            if (next.has(blueprintId)) {
                next.delete(blueprintId);
            } else {
                next.add(blueprintId);
            }
            return next;
        });
    };

    if (blueprints.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                設計図アイテムがありません
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                メンバーを追加してください
            </div>
        );
    }

    // Count how many members have each blueprint
    const getBlueprintOwnerCount = (blueprintId: string) => {
        return members.filter(m => memberInventories.get(m.id)?.has(blueprintId)).length;
    };

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border-2 border-gray-200 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-gray-50 z-10 whitespace-nowrap">
                                設計図
                            </TableHead>
                            {members.map((member) => (
                                <TableHead key={member.id} className="text-center min-w-[80px]">
                                    {member.name}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {blueprints.map((blueprint) => {
                            const someoneHasIt = members.some((member) =>
                                memberInventories.get(member.id)?.has(blueprint.id)
                            );

                            return (
                                <TableRow
                                    key={blueprint.id}
                                    className={cn(
                                        someoneHasIt && 'bg-green-50'
                                    )}
                                >
                                    <TableCell className="sticky left-0 bg-white z-10 font-medium border-r border-gray-100 whitespace-nowrap">
                                        <span className="text-gray-900">
                                            {blueprint.nameJp || blueprint.nameEn}
                                        </span>
                                    </TableCell>
                                    {members.map((member) => {
                                        const cellKey = `${member.id}-${blueprint.id}`;
                                        const inventory = memberInventories.get(member.id) || new Set();
                                        const hasItem = inventory.has(blueprint.id);
                                        const isLoading = loadingCells.has(cellKey);

                                        return (
                                            <TableCell key={member.id} className="text-center">
                                                <div className="flex justify-center">
                                                    <Checkbox
                                                        checked={hasItem}
                                                        onCheckedChange={() =>
                                                            handleToggle(member.id, blueprint.id)
                                                        }
                                                        disabled={isLoading}
                                                        className={cn(
                                                            isLoading && 'opacity-50 animate-pulse'
                                                        )}
                                                    />
                                                </div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2">
                {blueprints.map((blueprint) => {
                    const ownerCount = getBlueprintOwnerCount(blueprint.id);
                    const isExpanded = expandedBlueprints.has(blueprint.id);
                    const someoneHasIt = ownerCount > 0;

                    return (
                        <div
                            key={blueprint.id}
                            className={cn(
                                "border-2 rounded-lg overflow-hidden",
                                someoneHasIt ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
                            )}
                        >
                            {/* Blueprint Header - Always visible */}
                            <button
                                onClick={() => toggleExpanded(blueprint.id)}
                                className="w-full flex items-center justify-between p-3 text-left"
                            >
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-gray-900 text-sm block truncate">
                                        {blueprint.nameJp || blueprint.nameEn}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full font-medium",
                                        ownerCount > 0
                                            ? "bg-green-200 text-green-800"
                                            : "bg-gray-200 text-gray-600"
                                    )}>
                                        {ownerCount}/{members.length}
                                    </span>
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Expanded Member List */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 bg-white">
                                    {members.map((member) => {
                                        const cellKey = `${member.id}-${blueprint.id}`;
                                        const inventory = memberInventories.get(member.id) || new Set();
                                        const hasItem = inventory.has(blueprint.id);
                                        const isLoading = loadingCells.has(cellKey);

                                        return (
                                            <button
                                                key={member.id}
                                                onClick={() => handleToggle(member.id, blueprint.id)}
                                                disabled={isLoading}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-3 text-left border-b border-gray-100 last:border-b-0",
                                                    hasItem ? "bg-green-50" : "hover:bg-gray-50",
                                                    isLoading && "opacity-50"
                                                )}
                                            >
                                                <span className="text-sm text-gray-700">
                                                    {member.name}
                                                </span>
                                                {hasItem ? (
                                                    <Check className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <X className="h-5 w-5 text-gray-300" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
