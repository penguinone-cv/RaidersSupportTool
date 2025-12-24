import { getParties } from '@/lib/actions';
import { PartyManager } from '@/components/party-manager';

export const dynamic = 'force-dynamic';

export default async function PartyPage() {
    const parties = await getParties();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">パーティー管理</h1>
                <p className="text-muted-foreground mt-1">
                    パーティーを作成し、メンバーの設計図所持状況を管理できます。
                </p>
            </div>

            <PartyManager parties={parties} />
        </div>
    );
}
