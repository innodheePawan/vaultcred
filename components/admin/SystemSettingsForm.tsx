'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateSystemSettings } from '@/lib/actions/settings';
import { Upload, Save, Building, AlertCircle, CheckCircle, Database } from 'lucide-react';

const initialState = {
    message: null,
    error: null,
};

export default function SystemSettingsForm({ initialSettings, dbInfo }: { initialSettings: any, dbInfo?: any }) {
    const [state, formAction, isPending] = useActionState(updateSystemSettings, initialState as any);
    const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.logoUrl);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [auditPersonal, setAuditPersonal] = useState(initialSettings.auditPersonalCredentials ?? true);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setRemoveLogo(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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

            <input type="hidden" name="existingLogoUrl" value={initialSettings.logoUrl || ''} />

            {/* Application Name */}
            <div>
                <label htmlFor="applicationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Application Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="applicationName"
                        id="applicationName"
                        defaultValue={initialSettings.applicationName}
                        required
                        className="block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    This name will appear in the application header.
                </p>
            </div>

            {/* Company Name */}
            <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="companyName"
                        id="companyName"
                        defaultValue={initialSettings.companyName || 'My Company'}
                        required
                        className="block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    This name will appear in the footer copyrights.
                </p>
            </div>

            {/* Application Logo */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Application Logo
                </label>
                <div className="mt-2 flex items-center gap-6">
                    <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 overflow-hidden">
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-gray-400 text-xs text-center px-2">No Logo</span>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="file"
                                id="logo"
                                name="logo"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleLogoChange}
                            />
                            <div className="flex gap-3">
                                <label
                                    htmlFor="logo"
                                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {logoPreview ? 'Change Logo' : 'Upload New Logo'}
                                </label>

                                {logoPreview && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                        onClick={() => {
                                            setLogoPreview(null);
                                            setRemoveLogo(true);
                                        }}
                                    >
                                        Remove Logo
                                    </Button>
                                )}
                            </div>
                            <input type="hidden" name="removeLogo" value={removeLogo ? 'true' : 'false'} />
                            <p className="mt-2 text-xs text-gray-500">
                                PNG, JPG, or SVG up to 500KB.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Database Configuration (Read-Only) */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Configuration
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Host
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                disabled
                                value={dbInfo?.host || 'Not Configured'}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Port
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                disabled
                                value={dbInfo?.port || '3306'}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Database Name
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                disabled
                                value={dbInfo?.database || ''}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Username
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                disabled
                                value={dbInfo?.user || ''}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Settings */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mb-6">
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
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
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
        </form>
    );
}
