'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SyncButton() {
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSync = async () => {
        setSyncing(true);
        setMessage(null);

        try {
            const response = await fetch('/api/sync/items', {
                method: 'POST',
            });
            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                router.refresh();
            } else {
                setMessage('同期に失敗しました');
            }
        } catch (error) {
            setMessage('同期に失敗しました');
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                size="sm"
            >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? '同期中...' : 'APIから同期'}
            </Button>
            {message && (
                <span className="text-sm text-green-600">{message}</span>
            )}
        </div>
    );
}
