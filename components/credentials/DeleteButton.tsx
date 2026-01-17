'use client';

import { useState, useTransition } from 'react';
import { deleteCredential } from '@/lib/actions/credentials';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteCredentialButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
            return;
        }

        startTransition(async () => {
            const result = await deleteCredential(id);
            if (result.success) {
                router.push('/credentials');
                router.refresh();
            } else {
                alert(result.error || 'Failed to delete');
            }
        });
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
        >
            <Trash2 className="w-4 h-4 mr-2" />
            {isPending ? 'Deleting...' : 'Delete'}
        </Button>
    );
}
