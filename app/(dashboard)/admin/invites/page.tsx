'use client';

import { useActionState } from 'react';
import { inviteUser } from '@/lib/actions/admin';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

const initialState = {
    message: null,
    error: null,
    token: null,
};

export default function InvitePage() {
    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        const result = await inviteUser(prev, formData);
        if (result.error) return { ...prev, error: result.error, message: null, token: null };
        if (result.success) return { ...prev, message: 'Invitation email sent successfully!', token: result.token, error: null };
        return prev;
    }, initialState);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Invite Users
                    </h2>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
                <form action={formAction} className="space-y-4 max-w-lg">
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
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                                placeholder="colleague@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Role
                        </label>
                        <div className="mt-1">
                            <select
                                id="role"
                                name="role"
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="USER">User (Standard)</option>
                                <option value="ADMIN">Admin</option>
                                <option value="READ_ONLY">Read Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Sending Invite...' : (
                                <>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Send Invitation Email
                                </>
                            )}
                        </Button>
                    </div>

                    {state.error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {state.error}
                        </div>
                    )}

                    {state.message && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                {state.message}
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                The user will receive an email with an activation link to set up their account.
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
