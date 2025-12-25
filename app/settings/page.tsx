import { TranslationDictionaryEditor } from '@/components/translation-dictionary-editor';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">設定</h1>
                <p className="text-gray-600">
                    アプリケーションの設定を変更できます
                </p>
            </div>

            {/* Translation Dictionary Editor */}
            <TranslationDictionaryEditor />
        </div>
    );
}
