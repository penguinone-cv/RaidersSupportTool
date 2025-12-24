'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Plus, Users, Trash2, UserPlus } from 'lucide-react';
import { createParty, deleteParty, addMember, removeMember } from '@/lib/actions';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Member {
    id: string;
    name: string;
}

interface Party {
    id: string;
    name: string;
    members: Member[];
    updatedAt: Date;
}

interface PartyManagerProps {
    parties: Party[];
}

export function PartyManager({ parties }: PartyManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newPartyName, setNewPartyName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateParty = async () => {
        if (!newPartyName.trim()) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.set('name', newPartyName.trim());

        try {
            await createParty(formData);
            setNewPartyName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create party:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteParty = async (partyId: string) => {
        if (!confirm('このパーティーを削除しますか？')) return;

        try {
            await deleteParty(partyId);
        } catch (error) {
            console.error('Failed to delete party:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                    <Users className="h-5 w-5 text-green-600" />
                    パーティー管理
                </h2>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <Button variant="tactical">
                            <Plus className="h-4 w-4 mr-2" />
                            新規パーティー
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>新規パーティー作成</DialogTitle>
                            <DialogDescription>
                                パーティー名を入力してください。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="partyName">パーティー名</Label>
                            <Input
                                id="partyName"
                                value={newPartyName}
                                onChange={(e) => setNewPartyName(e.target.value)}
                                placeholder="例: 探索隊Alpha"
                                className="mt-2"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateParty();
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setIsCreating(false)}>
                                キャンセル
                            </Button>
                            <Button
                                variant="tactical"
                                onClick={handleCreateParty}
                                disabled={isLoading || !newPartyName.trim()}
                            >
                                作成
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Party List */}
            {parties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parties.map((party) => (
                        <Card key={party.id} className="group">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{party.name}</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeleteParty(party.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Users className="h-4 w-4" />
                                        <span>{party.members.length} メンバー</span>
                                    </div>
                                    {party.members.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {party.members.slice(0, 3).map((member) => (
                                                <span
                                                    key={member.id}
                                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200"
                                                >
                                                    {member.name}
                                                </span>
                                            ))}
                                            {party.members.length > 3 && (
                                                <span className="px-2 py-1 text-xs text-gray-500">
                                                    +{party.members.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <Link href={`/party/${party.id}`}>
                                        <Button variant="secondary" className="w-full mt-2">
                                            詳細を見る
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-4">
                            パーティーがありません
                        </p>
                        <Button variant="tactical" onClick={() => setIsCreating(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            最初のパーティーを作成
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Member management component for party detail page
interface MemberManagerProps {
    partyId: string;
    members: Member[];
}

export function MemberManager({ partyId, members }: MemberManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddMember = async () => {
        if (!newMemberName.trim()) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.set('partyId', partyId);
        formData.set('name', newMemberName.trim());

        try {
            await addMember(formData);
            setNewMemberName('');
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to add member:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('このメンバーを削除しますか？')) return;

        try {
            await removeMember(memberId);
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">メンバー ({members.length})</h3>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            メンバー追加
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>メンバー追加</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="memberName">メンバー名</Label>
                            <Input
                                id="memberName"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                placeholder="プレイヤー名"
                                className="mt-2"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddMember();
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setIsAdding(false)}>
                                キャンセル
                            </Button>
                            <Button
                                variant="tactical"
                                onClick={handleAddMember}
                                disabled={isLoading || !newMemberName.trim()}
                            >
                                追加
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg group"
                    >
                        <span className="font-medium text-gray-900">{member.name}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveMember(member.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
