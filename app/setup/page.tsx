'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Server, Save, Copy, CheckCircle, AlertTriangle, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { configureSystem, testDbConnection } from '@/lib/actions/setup';

export default function SetupPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success?: string; error?: string } | null>(null);
    const [status, setStatus] = useState<{
        error?: string;
        success?: string;
        manualConfigRequired?: boolean;
        steps?: { envUpdate: boolean; dbPush: boolean; seed: boolean };
        envVars?: { [key: string]: string | undefined } | null;
    } | null>(null);

    const [adminPassword, setAdminPassword] = useState('');
    const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const router = useRouter();

    const passwordsMatch = adminPassword !== '' && adminPassword === adminPasswordConfirm;
    const isFormValid = passwordsMatch && adminPassword.length >= 12 && !!testResult?.success;


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsSaving(true);
        setStatus(null);

        const formData = new FormData(e.currentTarget);
        const result = await configureSystem(formData);

        if (result.error) {
            setStatus({ error: result.error });
            setIsSaving(false);
        } else {
            setStatus({
                success: result.success,
                manualConfigRequired: result.manualConfigRequired,
                steps: result.steps,
                envVars: result.envVars
            });


            if (!result.manualConfigRequired) {
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            }
        }
    };

    const handleTestConnection = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsTesting(true);
        setTestResult(null);

        const form = (e.currentTarget as HTMLElement).closest('form');
        if (!form) return;

        const formData = new FormData(form);
        const result = await testDbConnection(formData);

        setTestResult(result);
        setIsTesting(false);
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
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
                                                className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="3306"
                                                defaultValue="3306"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="dbName" className="block text-sm font-medium text-gray-300">
                                                DB Name
                                            </label>
                                            <input
                                                id="dbName"
                                                name="dbName"
                                                type="text"
                                                required
                                                className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
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
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
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
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={isTesting}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-indigo-500 rounded-md text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                                    >
                                        {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                                        Test Database Connection
                                    </button>

                                    {testResult?.success && (
                                        <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> {testResult.success}
                                        </p>
                                    )}
                                    {testResult?.error && (
                                        <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> {testResult.error}
                                        </p>
                                    )}
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
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
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
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
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
                                            value={adminPasswordConfirm}
                                            onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                                            className={`mt-1 block w-full sm:text-sm border rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${adminPasswordConfirm !== '' ? (passwordsMatch ? 'border-green-500' : 'border-red-500') : 'border-gray-600'}`}
                                        />
                                        {adminPasswordConfirm !== '' && (
                                            <p className={`mt-1 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                                                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600">
                                        <p className="text-[10px] text-gray-400 leading-tight">
                                            <strong>Policy:</strong> Minimum 12 characters. Use uppercase, lowercase, numbers, and symbols for maximum security.
                                        </p>
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
                                    disabled={isSaving || !isFormValid}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                                            Initializing System...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="-ml-1 mr-2 h-4 w-4" />
                                            Initialize System
                                        </>
                                    )}
                                </button>
                                {!isFormValid && adminPassword !== '' && (
                                    <p className="text-center text-[10px] text-gray-500 mt-2">
                                        Fix password issues to enable initialization.
                                    </p>
                                )}
                            </div>
                        </form>
                    ) : null}

                    {status?.success && status.manualConfigRequired && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="rounded-md bg-green-900/40 p-4 border border-green-700">
                                <div className="flex">
                                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-200">Initialization Partially Completed</h3>
                                        <p className="mt-1 text-sm text-green-300">The core structure is ready, but some cloud environment restrictions were met.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-900/30 p-6 rounded-lg border border-amber-700/50 shadow-inner">
                                <h4 className="text-amber-200 font-bold mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" /> CLOUD DEPLOYMENT - MANUAL STEPS
                                </h4>

                                <div className="space-y-6">
                                    {/* Step 1: Env Vars */}
                                    {!status.steps?.envUpdate && (
                                        <section>
                                            <h5 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                                                <span className="bg-amber-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">1</span>
                                                Set Environment Variables
                                            </h5>
                                            <p className="text-gray-300 text-xs mb-3">Add these to your <strong>AWS Amplify Dashboard</strong> Settings:</p>
                                            <div className="space-y-2">
                                                {status.envVars && Object.entries(status.envVars).map(([key, value]) => (
                                                    <div key={key} className="bg-gray-950 rounded border border-gray-800 p-2 flex justify-between items-center">
                                                        <div className="flex flex-col overflow-hidden mr-2">
                                                            <span className="text-indigo-400 font-mono font-bold text-[9px] uppercase">{key}</span>
                                                            <span className="text-gray-400 font-mono text-[11px] truncate">{value}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => copyToClipboard(value || '', key)}
                                                            className="text-gray-500 hover:text-white transition-colors p-1"
                                                        >
                                                            {copiedField === key ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Step 2: DB Push */}
                                    {!status.steps?.dbPush && (
                                        <section>
                                            <h5 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                                                <span className="bg-amber-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">2</span>
                                                Sync Database Schema
                                            </h5>
                                            <p className="text-gray-300 text-xs mb-3">Since the cloud runtime is restricted, run this command from your <strong>local terminal</strong>:</p>
                                            <div className="bg-gray-950 rounded border border-gray-800 p-3 flex items-center">
                                                <code className="text-indigo-300 text-[11px] font-mono flex-1 break-all">
                                                    DATABASE_URL=&quot;{status.envVars?.DATABASE_URL}&quot; npx prisma db push
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(`DATABASE_URL="${status.envVars?.DATABASE_URL}" npx prisma db push`, 'dbpush')}
                                                    className="text-gray-500 hover:text-white p-1 ml-2"
                                                >
                                                    {copiedField === 'dbpush' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </section>
                                    )}

                                    {/* Final Instruction */}
                                    <div className="pt-4 border-t border-amber-800/20 text-center">
                                        <p className="text-[11px] text-amber-200/80 italic mb-4">
                                            After completing these steps, re-deploy your Amplify application.
                                        </p>
                                        <button
                                            onClick={() => router.push('/login')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-6 rounded-md transition-colors"
                                        >
                                            Go to Sign In
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {status?.success && !status.manualConfigRequired && (
                        <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Setup Complete!</h3>
                            <p className="text-gray-400 mb-8">System configured and admin user created.</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-md transition-colors"
                            >
                                Log In Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
