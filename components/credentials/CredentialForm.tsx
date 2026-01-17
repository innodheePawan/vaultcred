'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

const initialState = {
    message: null,
    error: null,
};

type CredentialFormProps = {
    action: (prevState: any, formData: FormData) => Promise<any>;
    initialData?: any;
    isEdit?: boolean;
};

export default function CredentialForm({ action, initialData, isEdit = false }: CredentialFormProps) {
    const [type, setType] = useState(initialData?.type || 'PASSWORD');
    const [state, formAction, isPending] = useActionState(action, initialState);

    return (
        <form action={formAction} className="space-y-6">
            {/* Common Fields */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        defaultValue={initialData?.name}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g. Production Database, AWS Root"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                </label>
                <div className="mt-1">
                    <select
                        id="type"
                        name="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        disabled={isEdit} // Prevent changing type during edit to avoid data loss complexity
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                    >
                        <option value="PASSWORD">Password</option>
                        <option value="API_KEY">API Key</option>
                        <option value="SSH">SSH Key</option>
                        <option value="OTHER">Other</option>
                    </select>
                    {isEdit && <input type="hidden" name="type" value={type} />}
                </div>
            </div>

            {/* Dynamic Fields */}
            {(type === 'PASSWORD' || type === 'SSH') && (
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Username
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="username"
                            id="username"
                            defaultValue={initialData?.username}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>
            )}

            {(type === 'PASSWORD' || type === 'SSH') && (
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {type === 'SSH' ? 'Passphrase (Optional)' : 'Password'}
                    </label>
                    <div className="mt-1">
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required={!isEdit && type === 'PASSWORD'} // Required only on create if password type
                            placeholder={isEdit ? 'Leave blank to keep unchanged' : ''}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>
            )}

            {(type === 'API_KEY' || type === 'SSH') && (
                <div>
                    <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {type === 'SSH' ? 'Private Key' : 'API Key / Token'}
                    </label>
                    <div className="mt-1">
                        <textarea
                            name="key"
                            id="key"
                            rows={4}
                            required={!isEdit}
                            placeholder={isEdit ? 'Leave blank to keep unchanged' : ''}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white font-mono"
                        />
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                </label>
                <div className="mt-1">
                    <textarea
                        name="notes"
                        id="notes"
                        rows={3}
                        defaultValue={initialData?.notes}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : (isEdit ? 'Update Credential' : 'Save Credential')}
                </Button>
            </div>

            {state.error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {state.error}
                </div>
            )}

            {state.message && (
                <div className="p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <div className="flex-1">
                        {state.message}
                        <div className="mt-1">
                            <a href="/credentials" className="text-sm font-medium underline">
                                View All Credentials
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
