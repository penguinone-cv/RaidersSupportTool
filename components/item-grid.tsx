'use client';

import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ItemCard } from './item-card';
import { Search, Filter, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';

interface Item {
    id: string;
    nameEn: string;
    nameJp: string | null;
    category: string | null;
    rarity: string | null;
    imageUrl: string | null;
}

interface ItemGridProps {
    items: Item[];
    categories: string[];
    rarities: string[];
    onItemClick?: (item: Item) => void;
}

export function ItemGrid({
    items,
    categories,
    rarities,
    onItemClick,
}: ItemGridProps) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [rarityFilter, setRarityFilter] = useState<string>('all');

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // Search filter
            const searchLower = search.toLowerCase();
            const matchesSearch =
                !search ||
                item.nameEn.toLowerCase().includes(searchLower) ||
                (item.nameJp && item.nameJp.toLowerCase().includes(searchLower));

            // Category filter
            const matchesCategory =
                categoryFilter === 'all' || item.category === categoryFilter;

            // Rarity filter
            const matchesRarity =
                rarityFilter === 'all' || item.rarity === rarityFilter;

            return matchesSearch && matchesCategory && matchesRarity;
        });
    }, [items, search, categoryFilter, rarityFilter]);

    const hasActiveFilters =
        search || categoryFilter !== 'all' || rarityFilter !== 'all';

    const clearFilters = () => {
        setSearch('');
        setCategoryFilter('all');
        setRarityFilter('all');
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 items-center p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="アイテムを検索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="カテゴリー" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべてのカテゴリー</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Rarity Filter */}
                <Select value={rarityFilter} onValueChange={setRarityFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="レアリティ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべてのレア度</SelectItem>
                        {rarities.map((rar) => (
                            <SelectItem key={rar} value={rar}>
                                {rar}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        クリア
                    </Button>
                )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
                {filteredItems.length} / {items.length} アイテム
            </div>

            {/* Item Grid */}
            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                        <ItemCard
                            key={item.id}
                            {...item}
                            onClick={() => onItemClick?.(item)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>アイテムが見つかりません</p>
                    {hasActiveFilters && (
                        <Button
                            variant="link"
                            onClick={clearFilters}
                            className="mt-2 text-green-600"
                        >
                            フィルターをクリア
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
