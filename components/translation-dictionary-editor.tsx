'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Languages, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BASE_PATH = '/arc-raiders-tool';

export function TranslationDictionaryEditor() {
    const router = useRouter();
    const [rarityTranslations, setRarityTranslations] = useState<Record<string, string>>({});
    const [categoryTranslations, setCategoryTranslations] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Load translations from API
    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_PATH}/api/translations`);
            const data = await res.json();
            if (data.success) {
                setRarityTranslations(data.rarity || {});
                setCategoryTranslations(data.category || {});
            }
        } catch (error) {
            console.error('Failed to fetch translations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Save all rarity translations
            for (const [key, value] of Object.entries(rarityTranslations)) {
                await fetch(`${BASE_PATH}/api/translations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'rarity', keyEn: key, valueJp: value }),
                });
            }
            // Save all category translations
            for (const [key, value] of Object.entries(categoryTranslations)) {
                await fetch(`${BASE_PATH}/api/translations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'category', keyEn: key, valueJp: value }),
                });
            }
            setMessage('保存しました！');
            router.refresh();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const updateRarity = (key: string, value: string) => {
        setRarityTranslations(prev => ({ ...prev, [key]: value }));
    };

    const updateCategory = (key: string, value: string) => {
        setCategoryTranslations(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-gray-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                読み込み中...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Languages className="h-5 w-5" />
                        翻訳辞書エディタ
                    </h2>
                    <p className="text-sm text-gray-500">
                        レアリティとカテゴリの日本語翻訳を編集（データベースから取得した項目のみ表示）
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {message && (
                        <span className="text-sm text-green-600">{message}</span>
                    )}
                    <Button onClick={fetchTranslations} variant="outline" size="sm" disabled={saving}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        リロード
                    </Button>
                    <Button onClick={handleSaveAll} variant="tactical" size="sm" disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? '保存中...' : '全て保存'}
                    </Button>
                </div>
            </div>

            {/* Rarity Translations */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        レアリティ翻訳 ({Object.keys(rarityTranslations).length}件)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {Object.keys(rarityTranslations).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(rarityTranslations)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className="w-28 text-sm text-gray-500 capitalize truncate" title={key}>
                                            {key}
                                        </span>
                                        <Input
                                            value={value}
                                            onChange={(e) => updateRarity(key, e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            アイテムを同期するとレアリティが表示されます
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Category Translations */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        カテゴリ翻訳 ({Object.keys(categoryTranslations).length}件)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {Object.keys(categoryTranslations).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                            {Object.entries(categoryTranslations)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                        <span className="w-40 text-xs text-gray-500 truncate" title={key}>
                                            {key}
                                        </span>
                                        <Input
                                            value={value}
                                            onChange={(e) => updateCategory(key, e.target.value)}
                                            className="flex-1 h-8 text-sm"
                                        />
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            アイテムを同期するとカテゴリが表示されます
                        </p>
                    )}
                </CardContent>
            </Card>

            <p className="text-sm text-gray-500 text-center">
                ※ 翻訳データはサーバーに保存されます。項目はアイテムデータから自動取得されます。
            </p>
        </div>
    );
}
