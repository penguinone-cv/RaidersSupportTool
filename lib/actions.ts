'use server';

import { revalidatePath } from 'next/cache';
import prisma from './prisma';
import { z } from 'zod';

// Schema validation
const UpdateTranslationSchema = z.object({
    itemId: z.string().min(1),
    newName: z.string().min(1),
});

const CreatePartySchema = z.object({
    name: z.string().min(1).max(100),
});

const UpdatePartySchema = z.object({
    partyId: z.string().min(1),
    name: z.string().min(1).max(100),
});

const AddMemberSchema = z.object({
    partyId: z.string().min(1),
    name: z.string().min(1).max(100),
});

const UpdateMemberInventorySchema = z.object({
    memberId: z.string().min(1),
    inventoryData: z.string(), // JSON string
});

// ============================================
// Translation Actions
// ============================================

export async function updateTranslation(formData: FormData) {
    const itemId = formData.get('itemId') as string;
    const newName = formData.get('newName') as string;
    const ipAddress = formData.get('ipAddress') as string | null;

    const validated = UpdateTranslationSchema.safeParse({ itemId, newName });
    if (!validated.success) {
        return { success: false, error: 'Invalid input' };
    }

    try {
        // Get current name for logging
        const currentItem = await prisma.item.findUnique({
            where: { id: itemId },
            select: { nameJp: true },
        });

        // Update the translation
        await prisma.item.update({
            where: { id: itemId },
            data: { nameJp: newName },
        });

        // Log the change
        await prisma.translationLog.create({
            data: {
                itemId,
                oldName: currentItem?.nameJp,
                newName,
                ipAddress,
            },
        });

        revalidatePath('/');
        revalidatePath('/items');

        return { success: true };
    } catch (error) {
        console.error('Failed to update translation:', error);
        return { success: false, error: 'Database error' };
    }
}

// ============================================
// Party Actions
// ============================================

export async function createParty(formData: FormData) {
    const name = formData.get('name') as string;

    const validated = CreatePartySchema.safeParse({ name });
    if (!validated.success) {
        return { success: false, error: 'Invalid party name' };
    }

    try {
        const party = await prisma.party.create({
            data: { name },
        });

        revalidatePath('/');
        revalidatePath('/party');

        return { success: true, partyId: party.id };
    } catch (error) {
        console.error('Failed to create party:', error);
        return { success: false, error: 'Database error' };
    }
}

export async function updateParty(formData: FormData) {
    const partyId = formData.get('partyId') as string;
    const name = formData.get('name') as string;

    const validated = UpdatePartySchema.safeParse({ partyId, name });
    if (!validated.success) {
        return { success: false, error: 'Invalid input' };
    }

    try {
        await prisma.party.update({
            where: { id: partyId },
            data: { name },
        });

        revalidatePath('/');
        revalidatePath(`/party/${partyId}`);

        return { success: true };
    } catch (error) {
        console.error('Failed to update party:', error);
        return { success: false, error: 'Database error' };
    }
}

export async function deleteParty(partyId: string) {
    try {
        await prisma.party.delete({
            where: { id: partyId },
        });

        revalidatePath('/');
        revalidatePath('/party');

        return { success: true };
    } catch (error) {
        console.error('Failed to delete party:', error);
        return { success: false, error: 'Database error' };
    }
}

// ============================================
// Member Actions
// ============================================

export async function addMember(formData: FormData) {
    const partyId = formData.get('partyId') as string;
    const name = formData.get('name') as string;

    const validated = AddMemberSchema.safeParse({ partyId, name });
    if (!validated.success) {
        return { success: false, error: 'Invalid input' };
    }

    try {
        const member = await prisma.member.create({
            data: { partyId, name },
        });

        revalidatePath(`/party/${partyId}`);

        return { success: true, memberId: member.id };
    } catch (error) {
        console.error('Failed to add member:', error);
        return { success: false, error: 'Database error' };
    }
}

export async function updateMemberName(memberId: string, name: string) {
    try {
        const member = await prisma.member.update({
            where: { id: memberId },
            data: { name },
        });

        revalidatePath(`/party/${member.partyId}`);

        return { success: true };
    } catch (error) {
        console.error('Failed to update member:', error);
        return { success: false, error: 'Database error' };
    }
}

export async function updateMemberInventory(formData: FormData) {
    const memberId = formData.get('memberId') as string;
    const inventoryData = formData.get('inventoryData') as string;

    const validated = UpdateMemberInventorySchema.safeParse({ memberId, inventoryData });
    if (!validated.success) {
        return { success: false, error: 'Invalid input' };
    }

    try {
        const member = await prisma.member.update({
            where: { id: memberId },
            data: { inventoryData },
        });

        revalidatePath(`/party/${member.partyId}`);

        return { success: true };
    } catch (error) {
        console.error('Failed to update inventory:', error);
        return { success: false, error: 'Database error' };
    }
}

export async function removeMember(memberId: string) {
    try {
        const member = await prisma.member.delete({
            where: { id: memberId },
        });

        revalidatePath(`/party/${member.partyId}`);

        return { success: true };
    } catch (error) {
        console.error('Failed to remove member:', error);
        return { success: false, error: 'Database error' };
    }
}

// ============================================
// Sync Actions
// ============================================

export async function getSyncStatus() {
    try {
        const metadata = await prisma.syncMetadata.findUnique({
            where: { id: 'singleton' },
        });

        const itemCount = await prisma.item.count();

        return {
            lastSyncedAt: metadata?.lastSyncedAt || null,
            itemCount,
            recipeCount: metadata?.recipeCount || 0,
        };
    } catch (error) {
        console.error('Failed to get sync status:', error);
        return {
            lastSyncedAt: null,
            itemCount: 0,
            recipeCount: 0,
        };
    }
}

// ============================================
// Item Query Actions
// ============================================

export async function getItems(options?: {
    category?: string;
    rarity?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (options?.category) {
            where.category = options.category;
        }
        if (options?.rarity) {
            where.rarity = options.rarity;
        }
        if (options?.search) {
            where.OR = [
                { nameEn: { contains: options.search } },
                { nameJp: { contains: options.search } },
            ];
        }

        const items = await prisma.item.findMany({
            where,
            take: options?.limit || 50,
            skip: options?.offset || 0,
            orderBy: { nameEn: 'asc' },
        });

        return items;
    } catch (error) {
        console.error('Failed to get items:', error);
        return [];
    }
}

export async function getItemById(id: string) {
    try {
        return await prisma.item.findUnique({
            where: { id },
            include: {
                recipes: {
                    include: {
                        ingredients: {
                            include: {
                                item: true,
                            },
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error('Failed to get item:', error);
        return null;
    }
}

export async function getCategories() {
    try {
        const categories = await prisma.item.findMany({
            where: { category: { not: null } },
            select: { category: true },
            distinct: ['category'],
        });
        return categories.map(c => c.category).filter(Boolean) as string[];
    } catch (error) {
        console.error('Failed to get categories:', error);
        return [];
    }
}

export async function getRarities() {
    try {
        const rarities = await prisma.item.findMany({
            where: { rarity: { not: null } },
            select: { rarity: true },
            distinct: ['rarity'],
        });
        return rarities.map(r => r.rarity).filter(Boolean) as string[];
    } catch (error) {
        console.error('Failed to get rarities:', error);
        return [];
    }
}

// ============================================
// Party Query Actions
// ============================================

export async function getParties() {
    try {
        return await prisma.party.findMany({
            include: {
                members: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
    } catch (error) {
        console.error('Failed to get parties:', error);
        return [];
    }
}

export async function getPartyById(id: string) {
    try {
        return await prisma.party.findUnique({
            where: { id },
            include: {
                members: true,
            },
        });
    } catch (error) {
        console.error('Failed to get party:', error);
        return null;
    }
}
