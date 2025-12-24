'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Circle, Package, Gift, Search, Edit2, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuestRequirement {
    id: number;
    itemId: string;
    itemName: string; // Translated item name
    requiredCount: number;
    deliveredCount: number;
}

interface QuestReward {
    id: number;
    itemId: string;
    itemName: string; // Translated item name
    quantity: number;
}

interface Quest {
    id: string;
    nameEn: string;
    nameJp: string | null;
    requirements: QuestRequirement[];
    rewards: QuestReward[];
}

interface QuestListClientProps {
    quests: Quest[];
}

const COOKIE_NAME = 'quest_progress';
const DELIVERY_COOKIE_NAME = 'quest_delivery';

// Cookie utilities
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCompletedQuests(): Set<string> {
    const cookie = getCookie(COOKIE_NAME);
    if (!cookie) return new Set();
    try {
        return new Set(JSON.parse(cookie));
    } catch {
        return new Set();
    }
}

function saveCompletedQuests(completed: Set<string>) {
    setCookie(COOKIE_NAME, JSON.stringify(Array.from(completed)));
}

function getDeliveryProgress(): Record<string, Record<string, number>> {
    const cookie = getCookie(DELIVERY_COOKIE_NAME);
    if (!cookie) return {};
    try {
        return JSON.parse(cookie);
    } catch {
        return {};
    }
}

function saveDeliveryProgress(progress: Record<string, Record<string, number>>) {
    setCookie(DELIVERY_COOKIE_NAME, JSON.stringify(progress));
}

export function QuestListClient({ quests }: QuestListClientProps) {
    const router = useRouter();
    const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
    const [deliveryProgress, setDeliveryProgress] = useState<Record<string, Record<string, number>>>({});
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
    const [mounted, setMounted] = useState(false);

    // Translation editing state
    const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [saving, setSaving] = useState(false);

    // Load from cookies on mount
    useEffect(() => {
        setCompletedQuests(getCompletedQuests());
        setDeliveryProgress(getDeliveryProgress());
        setMounted(true);
    }, []);

    // Filter quests
    const filteredQuests = quests.filter(quest => {
        const matchesSearch = quest.nameEn.toLowerCase().includes(search.toLowerCase()) ||
            (quest.nameJp && quest.nameJp.toLowerCase().includes(search.toLowerCase()));

        const isCompleted = completedQuests.has(quest.id);
        const matchesFilter = filter === 'all' ||
            (filter === 'completed' && isCompleted) ||
            (filter === 'incomplete' && !isCompleted);

        return matchesSearch && matchesFilter;
    });

    const toggleComplete = (questId: string) => {
        const newCompleted = new Set(completedQuests);
        if (newCompleted.has(questId)) {
            newCompleted.delete(questId);
        } else {
            newCompleted.add(questId);
        }
        setCompletedQuests(newCompleted);
        saveCompletedQuests(newCompleted);
    };

    const updateDelivery = (questId: string, itemId: string, delta: number) => {
        const newProgress = { ...deliveryProgress };
        if (!newProgress[questId]) {
            newProgress[questId] = {};
        }
        const current = newProgress[questId][itemId] || 0;
        const quest = quests.find(q => q.id === questId);
        const req = quest?.requirements.find(r => r.itemId === itemId);
        const maxCount = req?.requiredCount || 999;

        newProgress[questId][itemId] = Math.max(0, Math.min(maxCount, current + delta));
        setDeliveryProgress(newProgress);
        saveDeliveryProgress(newProgress);
    };

    const getDeliveredCount = (questId: string, itemId: string): number => {
        return deliveryProgress[questId]?.[itemId] || 0;
    };

    const startEditing = (quest: Quest) => {
        setEditingQuestId(quest.id);
        setEditingName(quest.nameJp || '');
    };

    const cancelEditing = () => {
        setEditingQuestId(null);
        setEditingName('');
    };

    const saveTranslation = async () => {
        if (!editingQuestId) return;

        setSaving(true);
        try {
            await fetch('/api/quests/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questId: editingQuestId,
                    nameJp: editingName || null,
                }),
            });
            setEditingQuestId(null);
            setEditingName('');
            router.refresh();
        } catch (error) {
            console.error('Failed to save translation:', error);
        } finally {
            setSaving(false);
        }
    };

    const completedCount = quests.filter(q => completedQuests.has(q.id)).length;

    if (!mounted) {
        return (
            <div className="text-center py-12 text-gray-500">
                読み込み中...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{completedCount} / {quests.length} 完了</span>
                <span className="text-gray-300">|</span>
                <span>進捗はブラウザに保存されます</span>
                <span className="text-gray-300">|</span>
                <span className="text-blue-600">クエスト名クリックで翻訳編集</span>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-wrap gap-3 items-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="クエストを検索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'tactical' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        すべて
                    </Button>
                    <Button
                        variant={filter === 'incomplete' ? 'tactical' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('incomplete')}
                    >
                        未完了
                    </Button>
                    <Button
                        variant={filter === 'completed' ? 'tactical' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('completed')}
                    >
                        完了
                    </Button>
                </div>
            </div>

            {/* Quest List */}
            {filteredQuests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredQuests.map((quest) => {
                        const isCompleted = completedQuests.has(quest.id);
                        const isEditing = editingQuestId === quest.id;

                        return (
                            <Card
                                key={quest.id}
                                className={isCompleted ? 'bg-green-50 border-green-200' : ''}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        {isEditing ? (
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    placeholder="日本語名を入力..."
                                                    className="text-sm"
                                                    autoFocus
                                                />
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="tactical"
                                                        onClick={saveTranslation}
                                                        disabled={saving}
                                                    >
                                                        <Save className="h-3 w-3 mr-1" />
                                                        {saving ? '保存中' : '保存'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={cancelEditing}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEditing(quest)}
                                                className="text-left group flex-1"
                                            >
                                                <CardTitle className="text-base leading-tight group-hover:text-blue-600 transition-colors">
                                                    {quest.nameJp || quest.nameEn}
                                                    <Edit2 className="h-3 w-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </CardTitle>
                                                {quest.nameJp && (
                                                    <p className="text-xs text-gray-500 mt-1">{quest.nameEn}</p>
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => toggleComplete(quest.id)}
                                            className="p-1 hover:bg-gray-100 rounded shrink-0"
                                        >
                                            {isCompleted ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 text-sm">
                                        {/* Requirements */}
                                        {quest.requirements.length > 0 && (
                                            <div>
                                                <p className="font-medium text-gray-700 flex items-center gap-1 mb-2">
                                                    <Package className="h-4 w-4" />
                                                    必要アイテム
                                                </p>
                                                <ul className="space-y-2">
                                                    {quest.requirements.map((req) => {
                                                        const delivered = getDeliveredCount(quest.id, req.itemId);
                                                        const isReqComplete = delivered >= req.requiredCount;
                                                        return (
                                                            <li key={req.id} className="flex items-center justify-between gap-2">
                                                                <span className={`truncate ${isReqComplete ? 'text-green-600 line-through' : 'text-gray-600'}`}>
                                                                    {req.itemName}
                                                                </span>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button
                                                                        onClick={() => updateDelivery(quest.id, req.itemId, -1)}
                                                                        className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className={`w-12 text-center ${isReqComplete ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                                                        {delivered}/{req.requiredCount}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => updateDelivery(quest.id, req.itemId, 1)}
                                                                        className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Rewards */}
                                        {quest.rewards.length > 0 && (
                                            <div>
                                                <p className="font-medium text-gray-700 flex items-center gap-1 mb-1">
                                                    <Gift className="h-4 w-4" />
                                                    報酬
                                                </p>
                                                <ul className="space-y-1">
                                                    {quest.rewards.slice(0, 3).map((reward) => (
                                                        <li key={reward.id} className="text-gray-600 flex justify-between">
                                                            <span className="truncate mr-2">{reward.itemName}</span>
                                                            <span className="text-gray-500 shrink-0">x{reward.quantity}</span>
                                                        </li>
                                                    ))}
                                                    {quest.rewards.length > 3 && (
                                                        <li className="text-gray-400">
                                                            +{quest.rewards.length - 3} more
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>クエストが見つかりません</p>
                </div>
            )}
        </div>
    );
}
