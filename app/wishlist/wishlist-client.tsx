'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowUp, ArrowDown, ClipboardList, Search, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WishlistItem {
    id: number;
    itemId: string;
    itemName: string;
    quantity: number;
    priority: number;
}

interface Item {
    id: string;
    name: string;
    nameEn: string;
}

interface WishlistClientProps {
    wishlistItems: WishlistItem[];
    items: Item[];
}

// Searchable Select Component
function SearchableSelect({
    items,
    value,
    onChange,
    placeholder = '選択してください',
}: {
    items: Item[];
    value: string;
    onChange: (id: string, name: string) => void;
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    // Ensure items is always an array
    const safeItems = items || [];

    const selectedItem = safeItems.find(i => i.id === value);

    const filteredItems = useMemo(() => {
        if (!safeItems.length) return [];
        if (!search) return safeItems.slice(0, 100);
        const searchLower = search.toLowerCase();
        return safeItems.filter(item =>
            item.name.toLowerCase().includes(searchLower) ||
            item.nameEn.toLowerCase().includes(searchLower)
        ).slice(0, 100);
    }, [safeItems, search]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 border-2 border-gray-300 rounded-md bg-white text-gray-900 text-left flex items-center justify-between"
            >
                <span className={selectedItem ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedItem ? selectedItem.name : placeholder}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-md shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="検索..."
                                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                autoFocus
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                >
                                    <X className="h-3 w-3 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(item.id, item.name);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 ${value === item.id ? 'bg-green-100 text-green-800' : 'text-gray-700'
                                        }`}
                                >
                                    <div>{item.name}</div>
                                    {item.name !== item.nameEn && (
                                        <div className="text-xs text-gray-400">{item.nameEn}</div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                見つかりません
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Server actions called via fetch
async function addToWishlist(itemId: string, itemName: string, quantity: number) {
    const formData = new FormData();
    formData.set('itemId', itemId);
    formData.set('itemName', itemName);
    formData.set('quantity', String(quantity));

    await fetch('/api/wishlist/add', {
        method: 'POST',
        body: formData,
    });
}

async function removeFromWishlist(id: number) {
    await fetch('/api/wishlist/remove', {
        method: 'POST',
        body: JSON.stringify({ id }),
        headers: { 'Content-Type': 'application/json' },
    });
}

async function updatePriority(id: number, priority: number) {
    await fetch('/api/wishlist/priority', {
        method: 'POST',
        body: JSON.stringify({ id, priority }),
        headers: { 'Content-Type': 'application/json' },
    });
}

export function WishlistClient({ wishlistItems, items }: WishlistClientProps) {
    const router = useRouter();
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedItemName, setSelectedItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!selectedItemId) return;
        setLoading(true);
        try {
            await addToWishlist(selectedItemId, selectedItemName, quantity);
            setSelectedItemId('');
            setSelectedItemName('');
            setQuantity(1);
            router.refresh();
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id: number) => {
        await removeFromWishlist(id);
        router.refresh();
    };

    const handlePriorityUp = async (item: WishlistItem) => {
        await updatePriority(item.id, item.priority + 1);
        router.refresh();
    };

    const handlePriorityDown = async (item: WishlistItem) => {
        await updatePriority(item.id, Math.max(0, item.priority - 1));
        router.refresh();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Item Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        アイテムを追加
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                アイテム
                            </label>
                            <SearchableSelect
                                items={items}
                                value={selectedItemId}
                                onChange={(id, name) => {
                                    setSelectedItemId(id);
                                    setSelectedItemName(name);
                                }}
                                placeholder="アイテムを検索..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                必要数
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                                className="w-full p-2 border-2 border-gray-300 rounded-md bg-white text-gray-900"
                            />
                        </div>
                        <Button
                            onClick={handleAdd}
                            disabled={!selectedItemId || loading}
                            variant="tactical"
                            className="w-full"
                        >
                            {loading ? '追加中...' : 'ウィッシュリストに追加'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Wishlist Items */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            登録アイテム ({wishlistItems.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {wishlistItems.length > 0 ? (
                            <div className="space-y-2">
                                {wishlistItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900">
                                                {item.itemName || item.itemId}
                                            </span>
                                            <span className="ml-2 text-sm text-gray-500">
                                                x{item.quantity}
                                            </span>
                                            {item.priority > 0 && (
                                                <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                                    優先度 {item.priority}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handlePriorityUp(item)}
                                                className="p-1.5 hover:bg-gray-100 rounded"
                                                title="優先度を上げる"
                                            >
                                                <ArrowUp className="h-4 w-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => handlePriorityDown(item)}
                                                className="p-1.5 hover:bg-gray-100 rounded"
                                                title="優先度を下げる"
                                            >
                                                <ArrowDown className="h-4 w-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="p-1.5 hover:bg-red-50 rounded"
                                                title="削除"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                ウィッシュリストが空です。アイテムを追加してください。
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
