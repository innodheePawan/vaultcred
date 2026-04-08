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
    const [allowApiFileDownload, setAllowApiFileDownload] = useState(initialSettings.allowApiFileDownload ?? false);

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
                            id="allowApiFileDownload"
                            name="allowApiFileDownload"
                            type="checkbox"
                            value="true"
                            checked={allowApiFileDownload}
                            onChange={(e) => setAllowApiFileDownload(e.target.checked)}
                            disabled={!canEdit}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="allowApiFileDownload" className="font-medium text-gray-700 dark:text-gray-300">
                            Enable External API File Downloads
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                            When enabled, authorized API Clients will be able to download "FILE" type credentials via the external API endpoint.
                            <br />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                This acts as a global master kill switch. Individual API Clients must still be explicitly granted permission!
                            </span>
                        </p>
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
