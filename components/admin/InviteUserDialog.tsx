'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import InviteUserForm from '@/components/admin/InviteUserForm';

export default function InviteUserDialog({ groups, action }: { groups: any[], action: any }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4" />
                    Invite New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700">
                <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Send an invitation email with a secure registration token.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <InviteUserForm groups={groups} action={action} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
