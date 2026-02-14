'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Server, Save, Copy, CheckCircle, AlertTriangle, Link as LinkIcon, RefreshCw, Loader2 } from 'lucide-react';
import { prepareEnvironment, syncDatabase, seedDatabase, testDbConnection, purgeDatabase } from '@/lib/actions/setup';

type SetupStep = 'IDLE' | 'PURGING_DB' | 'SYNCING_DB' | 'SEEDING_DATA' | 'PREPARING_ENV' | 'COMPLETE' | 'FAILED';

export default function SetupPage() {
    const [currentStep, setCurrentStep] = useState<SetupStep>('IDLE');
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
    const isCloudEnv = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

    const passwordsMatch = adminPassword !== '' && adminPassword === adminPasswordConfirm;
    const isFormValid = passwordsMatch && adminPassword.length >= 12 && !!testResult?.success;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFormValid) return;

        setStatus(null);
        const formData = new FormData(e.currentTarget);
        const adminEmail = formData.get('adminEmail') as string;

        try {
            const dbHost = formData.get('dbHost') as string;
            const dbUser = formData.get('dbUser') as string;
            const dbPassword = formData.get('dbPassword') as string;
            const dbName = formData.get('dbName') as string;
            const dbPort = formData.get('dbPort') as string || '3306';
            const dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

            // PHASE 1: Purge existing records (for a clean slate)
            setCurrentStep('PURGING_DB');
            const purgeResult = await purgeDatabase(dbUrl);
            if (purgeResult.error) throw new Error(`[Purge Error] ${purgeResult.error}`);

            // PHASE 2: Sync Database Schema
            setCurrentStep('SYNCING_DB');
            const syncResult = await syncDatabase(dbUrl);
            if (syncResult.error) throw new Error(`[Database Sync Error] ${syncResult.error}`);

            // PHASE 3: Seed Initial Records
            setCurrentStep('SEEDING_DATA');
            const seedResult = await seedDatabase(dbUrl, adminEmail, adminPassword);
            if (seedResult.error) throw new Error(`[Seeding Error] ${seedResult.error}`);

            // PHASE 4: Infrastructure Preparation (Last)
            setCurrentStep('PREPARING_ENV');
            const envResult = await prepareEnvironment(formData);
            if (envResult.error) throw new Error(`[Infrastructure Error] ${envResult.error}`);

            const manualRequired = !envResult.envUpdateSuccess;

            setStatus({
                envVars: envResult.envVars,
                manualConfigRequired: manualRequired,
                steps: {
                    envUpdate: !!envResult.envUpdateSuccess,
                    dbPush: true,
                    seed: true
                },
                success: manualRequired
                    ? 'Setup completed with manual environment configuration needed for cloud persistence.'
                    : 'System initialized and configured successfully!'
            });

            setCurrentStep('COMPLETE');

            if (!manualRequired) {
                setTimeout(() => router.push('/dashboard'), 3000);
            }

        } catch (err: any) {
            setCurrentStep('FAILED');
            setStatus({ error: err.message });
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
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-indigo-600 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500 shadow-lg shadow-indigo-500/20">
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
                    {currentStep === 'IDLE' || currentStep === 'FAILED' ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Database Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                        <Database className="h-5 w-5 text-indigo-400" /> Database Connection
                                    </h3>

                                    <div>
                                        <label htmlFor="dbHost" className="block text-sm font-medium text-gray-300">Host</label>
                                        <input
                                            id="dbHost" name="dbHost" type="text" required
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="localhost" defaultValue="localhost"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="dbPort" className="block text-sm font-medium text-gray-300">Port</label>
                                            <input
                                                id="dbPort" name="dbPort" type="text" required
                                                className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                placeholder="3306" defaultValue="3306"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="dbName" className="block text-sm font-medium text-gray-300">DB Name</label>
                                            <input
                                                id="dbName" name="dbName" type="text" required
                                                className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                defaultValue="credential_manager"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="dbUser" className="block text-sm font-medium text-gray-300">Username</label>
                                        <input
                                            id="dbUser" name="dbUser" type="text" required
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="dbPassword" className="block text-sm font-medium text-gray-300">Password</label>
                                        <input
                                            id="dbPassword" name="dbPassword" type="password"
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <button
                                        type="button" onClick={handleTestConnection} disabled={isTesting}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-indigo-500 rounded-md text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                                    >
                                        {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                                        Test Connection
                                    </button>

                                    {testResult?.success && <p className="text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {testResult.success}</p>}
                                    {testResult?.error && <p className="text-xs text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {testResult.error}</p>}

                                    {isCloudEnv && (testResult?.success?.includes('localhost') || testResult?.error?.includes('localhost')) && (
                                        <div className="mt-2 p-2 bg-amber-900/30 border border-amber-700 rounded text-[10px] text-amber-200 flex gap-2">
                                            <AlertTriangle className="h-3 w-3 shrink-0" />
                                            <span><strong>Cloud Detected:</strong> You are using &quot;localhost&quot;. For AWS/Amplify, enter your remote database IP or Host instead.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Admin Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                        <Server className="h-5 w-5 text-indigo-400" /> Admin Account
                                    </h3>

                                    <div>
                                        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-300">Email</label>
                                        <input
                                            id="adminEmail" name="adminEmail" type="email" required
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            placeholder="admin@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-300">Password</label>
                                        <input
                                            id="adminPassword" name="adminPassword" type="password" required minLength={12}
                                            value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                                            className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="adminPasswordConfirm" className="block text-sm font-medium text-gray-300">Confirm Password</label>
                                        <input
                                            id="adminPasswordConfirm" name="adminPasswordConfirm" type="password" required
                                            value={adminPasswordConfirm} onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                                            className={`mt-1 block w-full sm:text-sm border rounded-md bg-gray-700 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${adminPasswordConfirm !== '' ? (passwordsMatch ? 'border-green-500' : 'border-red-500') : 'border-gray-600'}`}
                                        />
                                        {adminPasswordConfirm !== '' && <p className={`mt-1 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>{passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}</p>}
                                    </div>

                                    <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600">
                                        <p className="text-[10px] text-gray-400 leading-tight"><strong>Policy:</strong> Minimum 12 characters. Use uppercase, lowercase, numbers, and symbols.</p>
                                    </div>
                                </div>
                            </div>

                            {status?.error && (
                                <div className="rounded-md bg-red-900/50 p-4 border border-red-700 animate-in fade-in duration-300">
                                    <div className="flex"><AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" /><div className="ml-3"><h3 className="text-sm font-medium text-red-200">Configuration Failed</h3><div className="mt-2 text-sm text-red-300">{status.error}</div></div></div>
                                </div>
                            )}

                            <button
                                type="submit" disabled={!isFormValid}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <Save className="-ml-1 mr-2 h-4 w-4" /> Initialize System
                            </button>
                            {!isFormValid && adminPassword !== '' && <p className="text-center text-[10px] text-gray-500 mt-2">Fix issues and test connection to enable.</p>}
                        </form>
                    ) : null}

                    {/* Progress States */}
                    {(currentStep !== 'IDLE' && currentStep !== 'FAILED' && currentStep !== 'COMPLETE') && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-6">
                            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                                    {currentStep === 'PURGING_DB' && 'Purging Old Records...'}
                                    {currentStep === 'SYNCING_DB' && 'Syncing Schema...'}
                                    {currentStep === 'SEEDING_DATA' && 'Seeding Records...'}
                                    {currentStep === 'PREPARING_ENV' && 'Finalizing Infrastructure...'}
                                </h3>
                                <p className="text-gray-400 text-sm italic">Please do not refresh the page.</p>
                            </div>

                            <div className="w-full max-w-xs bg-gray-700 rounded-full h-1.5 mt-8 overflow-hidden">
                                <div className={`bg-indigo-500 h-full transition-all duration-700 ${currentStep === 'PURGING_DB' ? 'w-1/4' : currentStep === 'SYNCING_DB' ? 'w-2/4' : currentStep === 'SEEDING_DATA' ? 'w-3/4' : 'w-full'}`}></div>
                            </div>
                        </div>
                    )}

                    {/* Completion / Manual Steps */}
                    {status?.success && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className={`rounded-md p-4 border ${status.manualConfigRequired ? 'bg-amber-900/40 border-amber-700' : 'bg-green-900/40 border-green-700'}`}>
                                <div className="flex">
                                    {status.manualConfigRequired ? <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" /> : <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />}
                                    <div className="ml-3">
                                        <h3 className={`text-sm font-medium ${status.manualConfigRequired ? 'text-amber-200' : 'text-green-200'}`}>{status.success}</h3>
                                        <p className={`mt-1 text-xs ${status.manualConfigRequired ? 'text-amber-300/80' : 'text-green-300/80'}`}>
                                            {status.manualConfigRequired ? 'Partial success: Manual configuration needed due to server restrictions.' : 'System successfully initialized and ready for use.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {status.manualConfigRequired && (
                                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 shadow-inner space-y-6">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">Manual Actions Required</h4>

                                    {/* Env Vars */}
                                    {!status.steps?.envUpdate && (
                                        <section className="space-y-3">
                                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">1. Set Cloud Environment Variables</p>
                                            <div className="space-y-2">
                                                {status.envVars && Object.entries(status.envVars).map(([key, value]) => (
                                                    <div key={key} className="bg-black/40 rounded border border-gray-800 p-2 flex justify-between items-center group">
                                                        <div className="flex flex-col min-w-0 pr-4">
                                                            <span className="text-indigo-400 font-mono text-[9px] font-bold">{key}</span>
                                                            <span className="text-gray-400 font-mono text-[11px] truncate">{value}</span>
                                                        </div>
                                                        <button onClick={() => copyToClipboard(value || '', key)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                                                            {copiedField === key ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* DB Sync Command - Removed per user request to prioritize automatic sync and error reporting */}

                                    <div className="pt-4 border-t border-gray-800 text-center">
                                        <p className="text-[10px] text-gray-500 italic mb-4">After setting your environment variables, redeploy your app to complete the setup.</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setCurrentStep('IDLE')} className="flex-1 border border-gray-700 text-gray-400 text-xs py-2 rounded font-bold hover:bg-gray-700 transition-colors">Back</button>
                                            <button onClick={() => router.push('/login')} className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 transition-colors">Go to Login</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!status.manualConfigRequired && (
                                <div className="text-center pt-8">
                                    <button onClick={() => router.push('/login')} className="bg-indigo-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20">Login to Dashboard</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
