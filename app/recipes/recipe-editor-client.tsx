'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, Search, Wrench, ChevronDown, X } from 'lucide-react';
import { saveRecipe, deleteRecipe } from '@/lib/recipe-actions';
import { useRouter } from 'next/navigation';

interface Ingredient {
    id?: number;
    itemId: string;
    itemName: string;
    count: number;
}

interface Recipe {
    id: number;
    outputItemId: string;
    outputItemName: string;
    station: string;
    ingredients: Ingredient[];
}

interface Item {
    id: string;
    name: string;
    nameEn: string;
}

interface RecipeEditorClientProps {
    recipes: Recipe[];
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

    // Close on outside click
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

export function RecipeEditorClient({ recipes, items }: RecipeEditorClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [station, setStation] = useState('Workbench');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [saving, setSaving] = useState(false);

    // Filter recipes by search
    const filteredRecipes = recipes.filter(r =>
        r.outputItemName.toLowerCase().includes(search.toLowerCase())
    );

    // Find existing recipe for selected item
    const existingRecipe = recipes.find(r => r.outputItemId === selectedItemId);

    // Load existing recipe when selecting an item
    const handleSelectItem = (itemId: string) => {
        setSelectedItemId(itemId);
        const existing = recipes.find(r => r.outputItemId === itemId);
        if (existing) {
            setStation(existing.station);
            setIngredients(existing.ingredients.map(ing => ({ ...ing })));
        } else {
            setStation('Workbench');
            setIngredients([]);
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { itemId: '', itemName: '', count: 1 }]);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredientItem = (index: number, itemId: string, itemName: string) => {
        const updated = [...ingredients];
        updated[index] = { ...updated[index], itemId, itemName };
        setIngredients(updated);
    };

    const updateIngredientCount = (index: number, count: number) => {
        const updated = [...ingredients];
        updated[index] = { ...updated[index], count: Math.max(1, count) };
        setIngredients(updated);
    };

    const handleSave = async () => {
        if (!selectedItemId || ingredients.length === 0) return;

        setSaving(true);
        try {
            const formData = new FormData();
            formData.set('outputItemId', selectedItemId);
            formData.set('station', station);
            formData.set('ingredients', JSON.stringify(ingredients.map(ing => ({
                itemId: ing.itemId,
                count: ing.count,
            }))));

            await saveRecipe(formData);
            router.refresh();
        } catch (error) {
            console.error('Failed to save recipe:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingRecipe) return;
        if (!confirm('このレシピを削除しますか？')) return;

        try {
            await deleteRecipe(existingRecipe.id);
            setSelectedItemId('');
            setIngredients([]);
            router.refresh();
        } catch (error) {
            console.error('Failed to delete recipe:', error);
        }
    };

    const selectedItemName = items.find(i => i.id === selectedItemId)?.name || '';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recipe List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">登録済みレシピ</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="レシピを検索..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {filteredRecipes.length > 0 ? (
                            filteredRecipes.map((recipe) => (
                                <button
                                    key={recipe.id}
                                    onClick={() => handleSelectItem(recipe.outputItemId)}
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${selectedItemId === recipe.outputItemId
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-medium text-gray-900">{recipe.outputItemName}</div>
                                    <div className="text-sm text-gray-500">
                                        {recipe.station} | {recipe.ingredients.length} 素材
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">
                                レシピがありません
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recipe Editor */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        レシピ編集
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Output Item Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                作成するアイテム
                            </label>
                            <SearchableSelect
                                items={items}
                                value={selectedItemId}
                                onChange={(id) => handleSelectItem(id)}
                                placeholder="アイテムを選択..."
                            />
                        </div>

                        {selectedItemId && (
                            <>
                                {/* Station */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        製作設備
                                    </label>
                                    <select
                                        value={station}
                                        onChange={(e) => setStation(e.target.value)}
                                        className="w-full p-2 border-2 border-gray-300 rounded-md bg-white text-gray-900"
                                    >
                                        <option value="Workbench">Workbench</option>
                                        <option value="Gunsmith">Gunsmith</option>
                                        <option value="Refiner">Refiner</option>
                                        <option value="Armory">Armory</option>
                                        <option value="Crafting">Crafting (手持ち)</option>
                                    </select>
                                </div>

                                {/* Ingredients */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            必要素材
                                        </label>
                                        <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            追加
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {ingredients.map((ing, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <div className="flex-1">
                                                    <SearchableSelect
                                                        items={items}
                                                        value={ing.itemId}
                                                        onChange={(id, name) => updateIngredientItem(index, id, name)}
                                                        placeholder="素材を選択..."
                                                    />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={ing.count}
                                                    onChange={(e) => updateIngredientCount(index, parseInt(e.target.value) || 1)}
                                                    min={1}
                                                    className="w-20 p-2 border-2 border-gray-300 rounded-md bg-white text-gray-900 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeIngredient(index)}
                                                    className="p-2 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        ))}
                                        {ingredients.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-2">
                                                素材を追加してください
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="tactical"
                                        onClick={handleSave}
                                        disabled={saving || ingredients.length === 0 || ingredients.some(i => !i.itemId)}
                                        className="flex-1"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? '保存中...' : '保存'}
                                    </Button>
                                    {existingRecipe && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
