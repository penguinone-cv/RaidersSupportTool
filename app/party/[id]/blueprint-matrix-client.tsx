'use client';

import { useState, useTransition } from 'react';
import { BlueprintMatrix } from '@/components/blueprint-matrix';
import { updateMemberInventory } from '@/lib/actions';
import { useRouter } from 'next/navigation';

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

interface BlueprintMatrixClientProps {
    blueprints: BlueprintItem[];
    members: Member[];
}

export function BlueprintMatrixClient({
    blueprints,
    members: initialMembers,
}: BlueprintMatrixClientProps) {
    const [isPending, startTransition] = useTransition();
    const [members, setMembers] = useState(initialMembers);
    const router = useRouter();

    const handleToggle = async (memberId: string, itemId: string, hasItem: boolean) => {
        // Optimistic update - update local state immediately
        setMembers((prevMembers) =>
            prevMembers.map((member) => {
                if (member.id !== memberId) return member;

                let inventory: string[] = [];
                try {
                    inventory = member.inventoryData ? JSON.parse(member.inventoryData) : [];
                } catch {
                    inventory = [];
                }

                // Update inventory
                if (hasItem) {
                    inventory = [...new Set([...inventory, itemId])];
                } else {
                    inventory = inventory.filter((id) => id !== itemId);
                }

                return {
                    ...member,
                    inventoryData: JSON.stringify(inventory),
                };
            })
        );

        // Save to database
        startTransition(async () => {
            const member = members.find((m) => m.id === memberId);
            if (!member) return;

            let inventory: string[] = [];
            try {
                inventory = member.inventoryData ? JSON.parse(member.inventoryData) : [];
            } catch {
                inventory = [];
            }

            // Update inventory
            if (hasItem) {
                inventory = [...new Set([...inventory, itemId])];
            } else {
                inventory = inventory.filter((id) => id !== itemId);
            }

            const formData = new FormData();
            formData.set('memberId', memberId);
            formData.set('inventoryData', JSON.stringify(inventory));

            const result = await updateMemberInventory(formData);

            if (!result.success) {
                console.error('Failed to save:', result.error);
                // Revert on error
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
                {blueprints.length} 件の設計図 | チェックボックスをクリックして所持状況を設定
            </div>
            <BlueprintMatrix
                blueprints={blueprints}
                members={members}
                onToggle={handleToggle}
            />
        </div>
    );
}
