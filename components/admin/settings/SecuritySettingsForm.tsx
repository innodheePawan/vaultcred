'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateSecuritySettings } from '@/lib/actions/settings';
import { Save, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

const initialState = {
    message: null,
    error: null,
};

export default function SecuritySettingsForm({ initialSettings, canEdit = true }: { initialSettings: any, canEdit?: boolean }) {
    const [state, formAction, isPending] = useActionState(updateSecuritySettings, initialState as any);

    // Security State
    const [auditPersonal, setAuditPersonal] = useState(initialSettings.auditPersonalCredentials ?? true);
    const [allowApiAccess, setAllowApiAccess] = useState(initialSettings.allowApiAccess ?? false);
    
    // Throttling State
    const [exposeHeaders, setExposeHeaders] = useState(initialSettings.exposeRateLimitHeaders ?? false);

    return (
        <form action={formAction} className="space-y-6 max-w-2xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow">

            {/* Feedback Messages */}
            {state?.error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{state.error}</span>
                </div>
            )}
            {state?.message && (
                <div className="p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{state.message}</span>
                </div>
            )}

            {/* Audit Settings */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Audit & Compliance
                </h3>
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="auditPersonalCredentials"
                            name="auditPersonalCredentials"
                            type="checkbox"
                            value="true"
                            checked={auditPersonal}
                            onChange={(e) => setAuditPersonal(e.target.checked)}
                            disabled={!canEdit}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="auditPersonalCredentials" className="font-medium text-gray-700 dark:text-gray-300">
                            Audit Personal Credentials
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                            If enabled, actions performed on "Personal" credentials will be logged in the system Audit Log.
                            <br />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                Disabling this may reduce visibility into user activities but ensures stricter privacy for personal items.
                            </span>
                        </p>
                    </div>
                </div>
            </div>



            {/* API Settings */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Global API Policy
                </h3>
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="allowApiAccess"
                            name="allowApiAccess"
                            type="checkbox"
                            value="true"
                            checked={allowApiAccess}
                            onChange={(e) => setAllowApiAccess(e.target.checked)}
                            disabled={!canEdit}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="allowApiAccess" className="font-medium text-gray-700 dark:text-gray-300">
                            Enable External API Access
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                            When enabled, authorized external API Clients and OAuth tokens will be able to access Vault APIs.
                            <br />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                This acts as a global master kill switch for ALL external APIs. Individual API Clients must still be explicitly granted permission!
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* API Throttling & Limits */}
            <div className={`pt-6 border-t border-gray-200 dark:border-gray-700 ${!allowApiAccess ? 'opacity-60' : ''}`}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    API Throttling & Security Policies
                </h3>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="exposeRateLimitHeaders"
                                name="exposeRateLimitHeaders"
                                type="checkbox"
                                value="true"
                                checked={exposeHeaders}
                                onChange={(e) => setExposeHeaders(e.target.checked)}
                                disabled={!canEdit || !allowApiAccess}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="exposeRateLimitHeaders" className="font-medium text-gray-700 dark:text-gray-300">
                                Expose Rate Limit Headers
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                                If enabled, X-RateLimit-* headers will be returned in API responses.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                /api/v1/auth/token (req/min)
                            </label>
                            <input
                                type="number"
                                name="apiLimitAuthToken"
                                defaultValue={initialSettings.apiLimitAuthToken ?? 10}
                                disabled={!canEdit || !allowApiAccess}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                /api/v1/credentials (req/min)
                            </label>
                            <input
                                type="number"
                                name="apiLimitCredentials"
                                defaultValue={initialSettings.apiLimitCredentials ?? 50}
                                disabled={!canEdit || !allowApiAccess}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                /api/v1/credentials/&#123;id&#125;/reveal (req/min)
                            </label>
                            <input
                                type="number"
                                name="apiLimitCredentialReveal"
                                defaultValue={initialSettings.apiLimitCredentialReveal ?? 200}
                                disabled={!canEdit || !allowApiAccess}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                /api/v1/credentials/&#123;id&#125;/files (req/min)
                            </label>
                            <input
                                type="number"
                                name="apiLimitCredentialFile"
                                defaultValue={initialSettings.apiLimitCredentialFile ?? 30}
                                disabled={!canEdit || !allowApiAccess}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {canEdit && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Saving...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            )}
        </form>
    );
}
