import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPartyById, getItems } from '@/lib/actions';
import { MemberManager } from '@/components/party-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, ClipboardList } from 'lucide-react';
import { BlueprintMatrixClient } from './blueprint-matrix-client';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PartyDetailPage({ params }: PageProps) {
    const { id } = await params;
    const [party, items] = await Promise.all([
        getPartyById(id),
        getItems({ limit: 1000 }),
    ]);

    if (!party) {
        notFound();
    }

    // Filter items that are blueprints (name ends with "Blueprint")
    const blueprints = items.filter(
        (item) => item.nameEn.endsWith('Blueprint') || item.nameEn.includes('Blueprint')
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/party">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{party.name}</h1>
                    <p className="text-muted-foreground text-sm">
                        {party.members.length} メンバー
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="members" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="members" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        メンバー
                    </TabsTrigger>
                    <TabsTrigger value="blueprints" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        設計図マトリクス
                    </TabsTrigger>
                </TabsList>

                {/* Members Tab */}
                <TabsContent value="members">
                    <Card>
                        <CardContent className="pt-6">
                            <MemberManager partyId={party.id} members={party.members} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Blueprint Matrix Tab */}
                <TabsContent value="blueprints">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-tactical-400" />
                                設計図所持状況
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BlueprintMatrixClient
                                blueprints={blueprints}
                                members={party.members}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
