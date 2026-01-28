'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { updateUser } from '@/lib/actions/admin';
import { AlertCircle, Check, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const initialState: { message: string | null; error: string | null; success?: boolean } = {
    message: null,
    error: null,
    success: false
};

interface StatusConfirmationDialogProps {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function StatusConfirmationDialog({ user, open, onOpenChange }: StatusConfirmationDialogProps) {
    const router = useRouter();
    const [confirmationText, setConfirmationText] = useState('');

    // Determine target status
    const targetStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const isDeactivating = targetStatus === 'INACTIVE';

    // Wrapper for the action to include other form data if needed (though we only need status here)
    // We reuse updateUser but need to respect its formData requirement
    const [state, formAction, isPending] = useActionState(
        async (prev: any, formData: FormData) => {
            // Append missing fields to satisfy the backend validation or partial update logic
            // The backend updateUser expects 'role' and 'groups' too, otherwise they might get wiped?
            // Wait, look at updateUser implementation:
            // "const role = formData.get('role')... const groupIds = formData.getAll('groups')..."
            // "await tx.user.update... data: { role, status }"
            // "await tx.userGroupMapping.deleteMany..."
            // CRITICAL: The current updateUser implementation is destructive if fields are missing!
            // It will set role to undefined (or 'USER') and wipe groups if not provided.
            // I need to fetch the existing data or inject it hideously here.

            // Better approach: Since we are in a client component and have the 'user' object with groups,
            // we can re-populate the formData with existing values to ensure we only change the status.
            formData.append('role', user.role);
            user.userGroups.forEach((ug: any) => {
                formData.append('groups', ug.groupId);
            });
            formData.set('status', targetStatus); // OVERRIDE status

            return updateUser(user.id, formData);
        },
        initialState as any
    );

    useEffect(() => {
        if (state?.success) {
            setTimeout(() => {
                onOpenChange(false);
                setConfirmationText('');
                router.refresh();
            }, 1500);
        }
    }, [state?.success, onOpenChange, router]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${isDeactivating ? 'text-red-500' : 'text-green-500'}`} />
                        Confirm {isDeactivating ? 'Deactivation' : 'Activation'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        You are about to <strong>{isDeactivating ? 'DISABLE' : 'ENABLE'}</strong> access for
                        <span className="font-medium text-gray-900 dark:text-white"> {user.name || user.email}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        To confirm, please type <strong>{targetStatus}</strong> in the box below.
                    </p>
                    <Input
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder={`Type ${targetStatus} to confirm`}
                        className="dark:bg-gray-900"
                    />
                </div>

                {state?.error && (
                    <div className="rounded-md bg-red-50 p-4 flex gap-2 text-red-800 text-sm mb-4">
                        <AlertCircle className="w-5 h-5" /> {state.error}
                    </div>
                )}
                {state?.success && (
                    <div className="rounded-md bg-green-50 p-4 flex gap-2 text-green-800 text-sm mb-4">
                        <Check className="w-5 h-5" /> Status updated to {targetStatus}
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <form action={formAction}>
                        <Button
                            type="submit"
                            disabled={isPending || confirmationText !== targetStatus}
                            variant={isDeactivating ? "destructive" : "default"}
                            className={!isDeactivating ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {isPending ? 'Updating...' : `Confirm ${isDeactivating ? 'Deactivate' : 'Activate'}`}
                        </Button>
                    </form>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
