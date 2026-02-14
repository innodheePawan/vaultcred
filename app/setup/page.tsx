'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Server, Save, Copy, CheckCircle, AlertTriangle, Link as LinkIcon, RefreshCw, Loader2 } from 'lucide-react';
import { prepareEnvironment, syncDatabase, seedDatabase, testDbConnection, purgeDatabase, performDiagnostics } from '@/lib/actions/setup';

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
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [diagnosticsData, setDiagnosticsData] = useState<any>(null);

    const router = useRouter();

    const isCloudEnv = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

    const passwordsMatch = adminPassword !== '' && adminPassword === adminPasswordConfirm;
    const isFormValid = passwordsMatch && adminPassword.length >= 12 && !!testResult?.success;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFormValid) return;

        setStatus(null);
        setDebugLogs([]);
        const formData = new FormData(e.currentTarget);
        const adminEmail = formData.get('adminEmail') as string;

        const addLog = (msg: string) => setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

        try {
            const dbHost = formData.get('dbHost') as string;
            const dbUser = formData.get('dbUser') as string;
            const dbPassword = formData.get('dbPassword') as string;
            const dbName = formData.get('dbName') as string;
            const dbPort = formData.get('dbPort') as string || '3306';
            const dbUrl = `mysql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

            addLog('Initializing system setup sequence...');
            addLog(`Setting up with Host: ${dbHost}:${dbPort}, DB: ${dbName}, Admin: ${adminEmail}`);

            // Generate a masked URL for logging
            const maskedUrl = `mysql://${encodeURIComponent(dbUser)}:****@${dbHost}:${dbPort}/${dbName}`;
            addLog(`Target Connection: ${maskedUrl}`);
            addLog(`Platform: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'}`);

            // PHASE 1: Purge existing records (SKIPPED per user request)
            /*
            setCurrentStep('PURGING_DB');
            addLog('Phase 1: Purging all existing database records to ensure a fresh state...');
            const purgeResult = await purgeDatabase(dbUrl);
            if (purgeResult.error) {
                addLog(`CRITICAL PURGE ERROR: ${purgeResult.error}`);
                throw new Error(`[Purge Error] ${purgeResult.error}`);
            }
            addLog('SUCCESS: Database purged.');
            */
            addLog('Phase 1 (Purge) skipped by policy.');

            // PHASE 2: Sync Database Schema
            setCurrentStep('SYNCING_DB');
            addLog('Phase 2: Synchronizing schema. Running "npx prisma db push --skip-generate"...');
            addLog('Note: --skip-generate is used to bypass port 9898 restrictions on AWS.');
            const syncResult = await syncDatabase(dbUrl);
            if (syncResult.error) {
                addLog(`CRITICAL SYNC ERROR: ${syncResult.error}`);
                if (syncResult.stderr) addLog(`OS STDERR: ${syncResult.stderr}`);
                if (syncResult.stdout) addLog(`OS STDOUT: ${syncResult.stdout}`);
                addLog('HINT: If this persists, verify your database allows remote connections from the AWS Amplify IP range.');
                throw new Error(`[Database Sync Error] ${syncResult.error}`);
            }
            addLog('SUCCESS: Schema synchronized.');

            // PHASE 3: Seed Initial Records
            setCurrentStep('SEEDING_DATA');
            addLog(`Phase 3: Seeding initial administrative account (${adminEmail}) and system settings...`);
            const seedResult = await seedDatabase(dbUrl, adminEmail, adminPassword);
            if (seedResult.error) {
                addLog(`CRITICAL SEEDING ERROR: ${seedResult.error}`);
                throw new Error(`[Seeding Error] ${seedResult.error}`);
            }
            addLog('SUCCESS: Admin user and system defaults seeded.');

            // PHASE 4: Infrastructure Preparation (Last)
            setCurrentStep('PREPARING_ENV');
            addLog('Phase 4: Finalizing server environment and encryption keys...');
            const envResult = await prepareEnvironment(formData);
            if (envResult.error) {
                addLog(`CRITICAL INFRA ERROR: ${envResult.error}`);
                throw new Error(`[Infrastructure Error] ${envResult.error}`);
            }
            addLog('SUCCESS: MASTER_KEY and AUTH_SECRET finalized.');

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
            // Check if it's the generic "unexpected response" and try to provide better context
            const errorMsg = err.message === 'An unexpected response was received from the server.'
                ? 'Server Action Crash (likely Timeout or Memory Limit on AWS). Check CloudWatch logs for details.'
                : err.message;
            setStatus({ error: errorMsg });
            setDebugLogs(prev => [...prev, `CRITICAL ERROR: ${errorMsg}`]);
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
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="rounded-md bg-red-900/50 p-4 border border-red-700">
                                        <div className="flex">
                                            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-200">Configuration Failed</h3>
                                                <div className="mt-2 text-sm text-red-300">{status.error}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Debug Console */}
                                    <div className="bg-black/80 rounded-md border border-gray-700 p-4 font-mono text-[10px] text-gray-400 max-h-48 overflow-y-auto">
                                        <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-1">
                                            <span className="text-gray-500 uppercase tracking-widest text-[9px]">Local Debug Console</span>
                                            <button
                                                onClick={async () => {
                                                    const d = await performDiagnostics();
                                                    setDiagnosticsData(d);
                                                    setShowDiagnostics(true);
                                                }}
                                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                            >
                                                <RefreshCw className="h-3 w-3" /> Run Cloud Diagnostics
                                            </button>
                                        </div>
                                        {debugLogs.map((log, i) => (
                                            <div key={i} className={log.includes('ERROR') ? 'text-red-400' : ''}>{log}</div>
                                        ))}
                                        {debugLogs.length === 0 && <div className="italic">No detailed logs captured for this session.</div>}
                                    </div>
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
                    {/* Diagnostics Modal Overlays */}
                    {showDiagnostics && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-white overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <RefreshCw className="h-5 w-5 text-indigo-400" /> Cloud Diagnostics Report
                                    </h3>
                                    <button onClick={() => setShowDiagnostics(false)} className="text-gray-400 hover:text-white">&times;</button>
                                </div>
                                <div className="flex-1 overflow-y-auto font-mono text-[11px] bg-black/40 p-4 rounded-lg border border-gray-900 space-y-4">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(diagnosticsData, null, 2)}</pre>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button onClick={() => setShowDiagnostics(false)} className="px-6 py-2 bg-indigo-600 rounded-md font-bold hover:bg-indigo-700 transition-colors">Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
