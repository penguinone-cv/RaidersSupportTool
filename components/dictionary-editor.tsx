'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Check, Pencil, X } from 'lucide-react';
import { updateTranslation } from '@/lib/actions';

interface DictionaryEditorProps {
    itemId: string;
    nameEn: string;
    nameJp: string | null;
}

export function DictionaryEditor({ itemId, nameEn, nameJp }: DictionaryEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(nameJp || nameEn);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (value.trim() === '' || value === nameJp) {
            setIsEditing(false);
            setValue(nameJp || nameEn);
            return;
        }

        setIsSaving(true);
        const formData = new FormData();
        formData.set('itemId', itemId);
        formData.set('newName', value.trim());

        try {
            const result = await updateTranslation(formData);
            if (result.success) {
                setIsEditing(false);
            } else {
                console.error('Failed to save:', result.error);
                setValue(nameJp || nameEn);
            }
        } catch (error) {
            console.error('Failed to save:', error);
            setValue(nameJp || nameEn);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setValue(nameJp || nameEn);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className="h-8"
                />
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 w-8 text-tactical-400 hover:text-tactical-300"
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="h-8 w-8 text-red-400 hover:text-red-300"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group">
            <span className="text-lg font-medium">{nameJp || nameEn}</span>
            <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Pencil className="h-3 w-3" />
            </Button>
        </div>
    );
}
