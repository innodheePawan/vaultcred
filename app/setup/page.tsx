'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Server, Save, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { configureSystem } from '@/lib/actions/setup';

export default function SetupPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{
        error?: string;
        success?: string;
        manualConfigRequired?: boolean;
        envVars?: { [key: string]: string | undefined } | null;
    } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);

        const formData = new FormData(e.currentTarget);

        // Client-side password match validation
        const adminPassword = formData.get('adminPassword') as string;
        const adminConfirm = formData.get('adminPasswordConfirm') as string;
        if (adminPassword !== adminConfirm) {
            setStatus({ error: 'Admin passwords do not match' });
            setIsSaving(false);
            return;
        }

        const result = await configureSystem(formData);

        if (result.error) {
            setStatus({ error: result.error });
            setIsSaving(false);
        } else {
            setStatus({
                success: result.message,
                manualConfigRequired: result.manualConfigRequired,
                envVars: result.envVars
            });

            if (!result.manualConfigRequired) {
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            }
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-indigo-600 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <Database className="h-8 w-8 text-white" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    System Setup
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Configure your database and admin account.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
                    {!status?.success || status.manualConfigRequired ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Database Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                        <Database className="h-5 w-5 text-indigo-400" /> Database Connection
                                    </h3>

                                    <div>
                                        <label htmlFor="dbHost" className="block text-sm font-medium text-gray-300">
                                            Host
                                        </label>
                                        <input
                                            id="dbHost"
                                            name="dbHost"
                                            type="text"
                                            required
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3"
                                            placeholder="localhost"
                                            defaultValue="localhost"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="dbPort" className="block text-sm font-medium text-gray-300">
                                                Port
                                            </label>
                                            <input
                                                id="dbPort"
                                                name="dbPort"
                                                type="text"
                                                required
                                                className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3"
                                                placeholder="3306"
                                                defaultValue="3306"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="dbName" className="block text-sm font-medium text-gray-300">
                                                Database Name
                                            </label>
                                            <input
                                                id="dbName"
                                                name="dbName"
                                                type="text"
                                                required
                                                className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3"
                                                defaultValue="credential_manager"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="dbUser" className="block text-sm font-medium text-gray-300">
                                            Username
                                        </label>
                                        <input
                                            id="dbUser"
                                            name="dbUser"
                                            type="text"
                                            required
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="dbPassword" className="block text-sm font-medium text-gray-300">
                                            Password
                                        </label>
                                        <input
                                            id="dbPassword"
                                            name="dbPassword"
                                            type="password"
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3"
                                        />
                                    </div>
                                </div>

                                {/* Admin Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                        <Server className="h-5 w-5 text-indigo-400" /> Admin Account
                                    </h3>

                                    <div>
                                        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-300">
                                            Email
                                        </label>
                                        <input
                                            id="adminEmail"
                                            name="adminEmail"
                                            type="email"
                                            required
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3"
                                            placeholder="admin@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-300">
                                            Password
                                        </label>
                                        <input
                                            id="adminPassword"
                                            name="adminPassword"
                                            type="password"
                                            required
                                            minLength={12}
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="adminPasswordConfirm" className="block text-sm font-medium text-gray-300">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="adminPasswordConfirm"
                                            name="adminPasswordConfirm"
                                            type="password"
                                            required
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3"
                                        />
                                    </div>
                                </div>
                            </div>

                            {status?.error && (
                                <div className="rounded-md bg-red-900/50 p-4 border border-red-700">
                                    <div className="flex">
                                        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-200">Configuration Failed</h3>
                                            <div className="mt-2 text-sm text-red-300">{status.error}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">●</span>
                                            Configuring System...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="-ml-1 mr-2 h-4 w-4" />
                                            Initialize System
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : null}

                    {status?.success && status.manualConfigRequired && (
                        <div className="space-y-6">
                            <div className="rounded-md bg-green-900/50 p-4 border border-green-700">
                                <div className="flex">
                                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-200">Database Ready!</h3>
                                        <div className="mt-2 text-sm text-green-300">{status.success}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-900/40 p-5 rounded-lg border border-amber-700/50">
                                <h4 className="text-amber-200 font-bold mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" /> ACTION REQUIRED
                                </h4>
                                <p className="text-amber-100 text-sm mb-4 leading-relaxed">
                                    This server has a <strong>read-only filesystem</strong> (AWS Amplify/Lambda).
                                    I could not save the settings to the <code>.env</code> file automatically.
                                    You must manually add the following environment variables to your
                                    <strong>AWS Amplify Dashboard</strong> to complete the setup:
                                </p>

                                <div className="space-y-3">
                                    {status.envVars && Object.entries(status.envVars).map(([key, value]) => (
                                        <div key={key} className="bg-gray-900/80 rounded border border-gray-700 p-3 overflow-hidden">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-indigo-400 text-xs font-mono font-bold uppercase">{key}</span>
                                                <button
                                                    onClick={() => copyToClipboard(value || '', key)}
                                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                                >
                                                    {copiedField === key ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <div className="text-gray-200 font-mono text-sm break-all">
                                                {value}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-amber-700/30 text-xs text-amber-200/80 italic">
                                    After adding these variables, re-deploy your application in Amplify.
                                </div>
                            </div>
                        </div>
                    )}

                    {status?.success && !status.manualConfigRequired && (
                        <div className="text-center py-6">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Setup Complete!</h3>
                            <p className="text-gray-400">Redirecting you to the dashboard...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
