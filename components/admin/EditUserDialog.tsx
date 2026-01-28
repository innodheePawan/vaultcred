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
import { updateUser } from '@/lib/actions/admin';
import { AlertCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const initialState: any = {
    message: null,
    error: null,
    success: false
};

interface EditUserDialogProps {
    user: any;
    groups: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditUserDialog({ user, groups, open, onOpenChange }: EditUserDialogProps) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(
        async (prev: any, formData: FormData) => {
            return updateUser(user.id, formData);
        },
        initialState as any
    );

    // Initial values
    const assignedGroupIds = user.userGroups.map((ug: any) => ug.groupId);

    // Parse existing scopes (assuming single group logic for now)
    const existingMapping = user.userGroups[0];
    const initialCats = existingMapping?.scopedCategories ? existingMapping.scopedCategories.split(',') : [];
    const initialEnvs = existingMapping?.scopedEnvironments ? existingMapping.scopedEnvironments.split(',') : [];

    const [roleType, setRoleType] = useState<'SUPER_ADMIN' | 'GROUP'>(user.role === 'ADMIN' ? 'SUPER_ADMIN' : 'GROUP');
    const [selectedCats, setSelectedCats] = useState<string[]>(initialCats);
    const [selectedEnvs, setSelectedEnvs] = useState<string[]>(initialEnvs);

    useEffect(() => {
        if (state?.success) {
            // Close dialog after short delay
            setTimeout(() => {
                onOpenChange(false);
                router.refresh();
            }, 1500);
        }
    }, [state?.success, onOpenChange, router]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700">
                <DialogHeader>
                    <DialogTitle>Edit User: {user.name || user.email}</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Modify user role, status, and group assignments.
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="space-y-6 mt-4">
                    {/* Role Selection Removed: Role is now derived from Group Membership (Administrator = ADMIN) */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select
                            name="status"
                            defaultValue={user.status}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm sm:text-sm px-3 py-2"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive (Login Disabled)</option>
                            <option value="INVITED" disabled>Invited (Pending)</option>
                        </select>
                    </div>

                    {/* System Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            System Role
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="systemRole"
                                    value="SUPER_ADMIN"
                                    defaultChecked={user.role === 'ADMIN'}
                                    onChange={() => setRoleType('SUPER_ADMIN')}
                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Super Admin</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="systemRole"
                                    value="GROUP"
                                    defaultChecked={user.role !== 'ADMIN'}
                                    onChange={() => setRoleType('GROUP')}
                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Scoped Group Role</span>
                            </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Super Admin has full access to everything. Scoped roles are limited by Group and Scope.
                        </p>
                    </div>

                    {roleType === 'GROUP' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Assigned Group (Select One)
                                </label>
                                <div className="space-y-2">
                                    <select
                                        name="groupId"
                                        defaultValue={assignedGroupIds[0] || ''}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm sm:text-sm px-3 py-2"
                                    >
                                        <option value="" disabled>Select a Group</option>
                                        {groups
                                            .filter(g => ['ADMIN', 'USER', 'CONSUMER', 'AUDITOR'].includes(g.name))
                                            .filter((group, index, self) =>
                                                index === self.findIndex((t) => (t.name === group.name))
                                            ) // Deduplicate just in case
                                            .sort((a, b) => {
                                                const order = ['ADMIN', 'USER', 'CONSUMER', 'AUDITOR'];
                                                return order.indexOf(a.name) - order.indexOf(b.name);
                                            })
                                            .map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name}
                                                </option>
                                            ))}
                                    </select>
                                    <p className="text-xs text-gray-500">
                                        Assign a system group to determine base permissions.
                                    </p>
                                </div>
                            </div>

                            {/* Scopes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scoped Categories</label>
                                    <span className="text-xs text-gray-500 block mb-2">Leave empty for ALL</span>
                                    <div className="space-y-2">
                                        {['Application', 'Infra', 'Integration'].map(cat => (
                                            <label key={cat} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCats.includes(cat)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCats([...selectedCats, cat]);
                                                        else setSelectedCats(selectedCats.filter(c => c !== cat));
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <input type="hidden" name="scopedCategories" value={selectedCats.join(',')} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scoped Environments</label>
                                    <span className="text-xs text-gray-500 block mb-2">Leave empty for ALL</span>
                                    <div className="space-y-2">
                                        {['Dev', 'QA', 'Prod'].map(env => (
                                            <label key={env} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEnvs.includes(env)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedEnvs([...selectedEnvs, env]);
                                                        else setSelectedEnvs(selectedEnvs.filter(e => e !== env));
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{env}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <input type="hidden" name="scopedEnvironments" value={selectedEnvs.join(',')} />
                                </div>
                            </div>
                        </>
                    )}

                    {state?.error && (
                        <div className="rounded-md bg-red-50 p-4 flex gap-2 text-red-800 text-sm">
                            <AlertCircle className="w-5 h-5" /> {state.error}
                        </div>
                    )}
                    {state?.success && (
                        <div className="rounded-md bg-green-50 p-4 flex gap-2 text-green-800 text-sm">
                            <Check className="w-5 h-5" /> {state.message}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
