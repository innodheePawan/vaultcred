'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle } from 'lucide-react';

const initialState: any = {
    message: null,
    error: null,
    token: null,
    success: false
};

export default function InviteUserForm({ groups, action }: { groups: any[], action: any }) {
    const [state, formAction, isPending] = useActionState(action, initialState as any);
    const [roleType, setRoleType] = useState<'SUPER_ADMIN' | 'GROUP'>('SUPER_ADMIN');
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);

    return (
        <form action={formAction} className="space-y-4">
            {/* System Role Selection - Moved to Top */}
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
                            checked={roleType === 'SUPER_ADMIN'}
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
                            checked={roleType === 'GROUP'}
                            onChange={() => setRoleType('GROUP')}
                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Scoped Group Role</span>
                    </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Super Admin has full access. Scoped roles are limited by Group and Scope.
                </p>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                </label>
                <div className="mt-1">
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                        placeholder="colleague@example.com"
                    />
                </div>
            </div>

            {roleType === 'GROUP' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Assign Role Group
                        </label>
                        <div className="mt-1">
                            <select
                                id="groups"
                                name="groups"
                                className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                                required
                            >
                                <option value="" disabled selected>Select a Group</option>
                                {groups
                                    .sort((a, b) => a.name.localeCompare(b.name))
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

            {
                state?.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{state.error}</h3>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                state?.success && (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{state.message}</p>
                                {/* Dev helper to show token immediately since we don't have email sender */}
                                {state.token && (
                                    <p className="text-xs font-mono text-green-700 mt-1 select-all">
                                        Token: {state.token}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Sending Invite...' : 'Send Invite'}
            </Button>
        </form >
    );
}
