'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Server, Save, Copy, CheckCircle, AlertTriangle, Link as LinkIcon, RefreshCw, Loader2, Lock } from 'lucide-react';
import { prepareEnvironment, syncDatabase, seedRolesAction, seedSuperAdminAction, seedBrandingAction, testDbConnection, purgeDatabase, performDiagnostics, getSyncStatusAction, verifyTablesAction } from '@/lib/actions/setup';

type SetupStep = 'IDLE' | 'PURGING_DB' | 'SYNCING_DB' | 'SEEDING_ROLES' | 'SEEDING_ADMIN' | 'SEEDING_BRANDING' | 'PREPARING_ENV' | 'COMPLETE' | 'FAILED';

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

    const [shouldPurge, setShouldPurge] = useState(false);
    const [generatedSecrets, setGeneratedSecrets] = useState<{ MASTER_KEY?: string; AUTH_SECRET?: string; NEXTAUTH_SECRET?: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!adminPassword || adminPassword !== adminPasswordConfirm || adminPassword.length < 12) return;

        setStatus(null);
        setDebugLogs([]);
        setGeneratedSecrets(null);
        const formData = new FormData(e.currentTarget);
        const adminEmail = formData.get('adminEmail') as string;

        const addLog = (msg: string) => setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

        try {
            addLog('Initializing system setup sequence (Setup Mode)...');
            addLog(`Target Admin: ${adminEmail}`);

            // PHASE 1: Validate Connectivity
            setCurrentStep('PURGING_DB');
            addLog('Phase 1: Validating preconfigured database connectivity...');
            const testResult = await testDbConnection();
            if (testResult.error) {
                addLog(`CRITICAL CONNECTION ERROR: ${testResult.error}`);
                throw new Error(`[Connection Error] ${testResult.error}`);
            }
            addLog('SUCCESS: Connection verified.');

            // PHASE 2: Optional Purge
            if (shouldPurge) {
                addLog('Phase 2: Purging all existing database records per policy...');
                const purgeResult = await purgeDatabase();
                if (purgeResult.error) {
                    addLog(`CRITICAL PURGE ERROR: ${purgeResult.error}`);
                    throw new Error(`[Purge Error] ${purgeResult.error}`);
                }
                addLog('SUCCESS: Database purged.');
            } else {
                addLog('Phase 2: Skipping database purge (Keep existing data).');
            }

            // PHASE 3: Sync Database Schema (Async Polling)
            setCurrentStep('SYNCING_DB');
            addLog('Phase 3: Initiating asynchronous database schema synchronization...');
            const syncTrigger = await syncDatabase();

            if (syncTrigger.error) {
                throw new Error(`[Sync Initiation Error] ${syncTrigger.error}`);
            }

            // Polling Loop
            let isSyncing = true;
            let pollCount = 0;
            while (isSyncing) {
                pollCount++;
                // Wait 2 seconds between polls
                await new Promise(r => setTimeout(r, 2000));

                const task = await getSyncStatusAction();

                // Update local logs with task logs (ensuring we don't duplicate)
                if (task.logs && task.logs.length > 0) {
                    setDebugLogs(prev => {
                        const newLogs = [...prev];
                        task.logs.forEach(l => {
                            if (!newLogs.includes(l)) newLogs.push(l);
                        });
                        return newLogs;
                    });
                }

                if (task.status === 'SUCCESS') {
                    addLog('SUCCESS: Asynchronous schema sync complete.');
                    isSyncing = false;
                } else if (task.status === 'FAILED') {
                    addLog(`CRITICAL SYNC ERROR: ${task.error}`);
                    throw new Error(`[Schema Error] ${task.error}`);
                } else if (pollCount > 10) {
                    // HEURISTIC: After 10 polls (20s), check if tables exist even if process didn't report SUCCESS
                    // This handles cases where Lambda kills the status file write.
                    const verify = await verifyTablesAction();
                    if (verify.success && verify.count && verify.count > 0) {
                        addLog(`DETECTED: Database has ${verify.count} tables. Assuming sync succeeded.`);
                        isSyncing = false;
                    } else if (pollCount > 60) { // 2 minute timeout
                        throw new Error('[Sync Timeout] The synchronization task is taking too long. Check CloudWatch logs.');
                    }
                }
            }

            // FINAL SYNC VERIFICATION
            const finalVerify = await verifyTablesAction();
            if (finalVerify.success) {
                addLog(`Database Sync Verification: ${finalVerify.count} tables found.`);
                if (finalVerify.tables && finalVerify.tables.length > 0) {
                    addLog(`Tables list: ${finalVerify.tables.join(', ')}`);
                }
                if (!finalVerify.count) throw new Error('No tables found in database after sync.');
            }

            // PHASE 4.1: Seed Roles
            setCurrentStep('SEEDING_ROLES');
            addLog('Phase 4.1: Seeding mandatory system roles...');
            const roleResult = await seedRolesAction();
            if (roleResult.error) {
                addLog(`CRITICAL ROLE SEED ERROR: ${roleResult.error}`);
                throw new Error(`[Role Error] ${roleResult.error}`);
            }
            addLog('SUCCESS: System roles initialized.');

            // PHASE 4.2: Seed Super Admin
            setCurrentStep('SEEDING_ADMIN');
            addLog(`Phase 4.2: Creating Super Administrator (${adminEmail})...`);
            const adminResult = await seedSuperAdminAction(adminEmail, adminPassword);
            if (adminResult.error) {
                addLog(`CRITICAL ADMIN SEED ERROR: ${adminResult.error}`);
                throw new Error(`[Admin Error] ${adminResult.error}`);
            }
            addLog('SUCCESS: Super Admin created.');

            // PHASE 4.3: Seed Branding
            setCurrentStep('SEEDING_BRANDING');
            addLog('Phase 4.3: Initializing system branding and settings...');
            const brandingResult = await seedBrandingAction();
            if (brandingResult.error) {
                addLog(`CRITICAL BRANDING ERROR: ${brandingResult.error}`);
                throw new Error(`[Branding Error] ${brandingResult.error}`);
            }
            addLog('SUCCESS: System branding initialized.');

            // PHASE 5: Environment Preparation (Secrets)
            setCurrentStep('PREPARING_ENV');
            addLog('Phase 5: Generating platform security identifiers...');
            const envResult = await prepareEnvironment(formData);
            if (envResult.error) {
                addLog(`CRITICAL SECRET ERROR: ${envResult.error}`);
                throw new Error(`[Secret Error] ${envResult.error}`);
            }
            if (envResult.secrets) {
                setGeneratedSecrets(envResult.secrets);
                addLog('SUCCESS: Security secrets generated.');
            }

            setStatus({
                success: 'System successfully initialized!'
            });

            setCurrentStep('COMPLETE');

        } catch (err: any) {
            setCurrentStep('FAILED');
            const errorMsg = err.message === 'An unexpected response was received from the server.'
                ? 'Server Action Crash (likely Timeout or Memory Limit). Check logs.'
                : err.message;
            setStatus({ error: errorMsg });
            setDebugLogs(prev => [...prev, `CRITICAL ERROR: ${errorMsg}`]);
        }
    };

    const handleTestConnection = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsTesting(true);
        setTestResult(null);

        const result = await testDbConnection();
        setTestResult(result);
        setIsTesting(false);
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-gray-100">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-indigo-600 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500 shadow-lg shadow-indigo-500/20">
                    <Database className="h-8 w-8 text-white" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Setup Mode
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    One-Time Initialization Process
                </p>
                <div className="mt-4 flex justify-center">
                    <span className="bg-amber-900/40 text-amber-300 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-amber-700/50">
                        Restricted Access Active
                    </span>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700 transition-all duration-500 overflow-hidden min-h-[400px]">
                    {currentStep === 'IDLE' || currentStep === 'FAILED' ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Connectivity Status */}
                                <div className="bg-black/20 p-4 rounded-md border border-gray-700 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Database Sync</h3>
                                        <button
                                            type="button" onClick={handleTestConnection} disabled={isTesting}
                                            className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center gap-1 transition-colors disabled:opacity-50"
                                        >
                                            {isTesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <LinkIcon className="h-3 w-3" />}
                                            {testResult?.success ? 'Re-verify' : 'Validate Connectivity'}
                                        </button>
                                    </div>

                                    {!testResult && <p className="text-[10px] text-gray-500 italic">Verifying environment-variable configuration...</p>}
                                    {testResult?.success && <p className="text-[10px] text-green-400 font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Connection Verified (Preconfigured)</p>}
                                    {testResult?.error && <p className="text-[10px] text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {testResult.error}</p>}

                                    <div className="pt-2 mt-2 border-t border-gray-700/50">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={shouldPurge}
                                                onChange={(e) => setShouldPurge(e.target.checked)}
                                                className="h-3 w-3 rounded border-gray-700 text-indigo-500 bg-gray-900 focus:ring-0 focus:ring-offset-0"
                                            />
                                            <span className="text-[11px] text-gray-400 group-hover:text-gray-300 transition-colors">Purge existing tables (Start from scratch)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Super Admin Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        Super Admin Credentials
                                    </h3>

                                    <div>
                                        <label htmlFor="adminEmail" className="block text-xs font-medium text-gray-400">Email Address</label>
                                        <input
                                            id="adminEmail" name="adminEmail" type="email" required
                                            className="mt-1 block w-full sm:text-sm border-gray-700 rounded-md bg-gray-900/50 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none border hover:border-gray-600 transition-colors"
                                            placeholder="admin@credsecure.io"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="adminPassword" className="block text-xs font-medium text-gray-400">Password</label>
                                        <input
                                            id="adminPassword" name="adminPassword" type="password" required minLength={12}
                                            value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                                            className="mt-1 block w-full sm:text-sm border-gray-700 rounded-md bg-gray-900/50 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none border hover:border-gray-600 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="adminPasswordConfirm" className="block text-xs font-medium text-gray-400">Confirm Password</label>
                                        <input
                                            id="adminPasswordConfirm" name="adminPasswordConfirm" type="password" required
                                            value={adminPasswordConfirm} onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                                            className={`mt-1 block w-full sm:text-sm border rounded-md bg-gray-900/50 text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${adminPasswordConfirm !== '' ? (passwordsMatch ? 'border-green-500/50' : 'border-red-500/50') : 'border-gray-700'}`}
                                        />
                                        {adminPasswordConfirm !== '' && !passwordsMatch && <p className="mt-1 text-[10px] text-red-400">Passwords do not match</p>}
                                    </div>
                                </div>
                            </div>

                            {status?.error && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="rounded-md bg-red-900/30 p-3 border border-red-700/50">
                                        <div className="flex">
                                            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                                            <div className="ml-3">
                                                <h3 className="text-xs font-medium text-red-200 uppercase tracking-wider">Initialization Failed</h3>
                                                <div className="mt-1 text-xs text-red-300/80">{status.error}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Debug Console */}
                                    <div className="bg-black/80 rounded-md border border-gray-800 p-4 font-mono text-[9px] text-gray-500 max-h-40 overflow-y-auto shadow-inner">
                                        <div className="flex justify-between items-center mb-2 border-b border-gray-900 pb-1">
                                            <span className="uppercase tracking-widest text-[8px]">Audit Console</span>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const d = await performDiagnostics();
                                                    setDiagnosticsData(d);
                                                    setShowDiagnostics(true);
                                                }}
                                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                            >
                                                <RefreshCw className="h-3 w-3" /> Cloud Report
                                            </button>
                                        </div>
                                        {debugLogs.map((log, i) => (
                                            <div key={i} className={log.includes('ERROR') ? 'text-red-400/80' : ''}>{log}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit" disabled={!adminPassword || !passwordsMatch || adminPassword.length < 12}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                            >
                                <Save className="-ml-1 mr-2 h-4 w-4" /> Start Initialization
                            </button>
                        </form>
                    ) : null}

                    {currentStep !== 'IDLE' && currentStep !== 'FAILED' && currentStep !== 'COMPLETE' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-gray-700 border-t-indigo-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Database className="h-6 w-6 text-indigo-400" />
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="text-lg font-bold text-white">
                                    {currentStep === 'PURGING_DB' && (shouldPurge ? 'Purging Existing Data...' : 'Validating Connectivity...')}
                                    {currentStep === 'SYNCING_DB' && 'Synchronizing Schema...'}
                                    {currentStep === 'SEEDING_ROLES' && 'Seeding Roles...'}
                                    {currentStep === 'SEEDING_ADMIN' && 'Creating Super Admin...'}
                                    {currentStep === 'SEEDING_BRANDING' && 'Initializing Branding...'}
                                    {currentStep === 'PREPARING_ENV' && 'Generating Security Secrets...'}
                                </h3>
                                <div className="mt-2 text-xs text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <div className="h-1 w-24 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 animate-pulse" />
                                    </div>
                                    <span>In Progress</span>
                                </div>
                            </div>

                            <div className="w-full bg-black/50 rounded-md p-4 font-mono text-[10px] text-gray-400 max-h-40 overflow-y-auto mt-6">
                                {debugLogs.map((log, i) => (
                                    <div key={i} className="mb-0.5 border-l-2 border-indigo-900/50 pl-2">{log}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 'COMPLETE' && (
                        <div className="flex flex-col space-y-6 py-4 animate-in fade-in duration-700">
                            <div className="flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center mb-4 scale-110 animate-bounce">
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Initialization Complete</h2>
                                <p className="mt-1 text-sm text-gray-400">Application successfully configured.</p>
                            </div>

                            {generatedSecrets && (
                                <div className="space-y-3 bg-black/20 p-4 rounded-lg border border-gray-700">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest">
                                        <AlertTriangle className="h-3 w-3" /> Mandatory Platform Secrets
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-tight">
                                        These values are required for encryption and authentication. Add them to your environment variables (e.g., AWS Console) immediately.
                                    </p>

                                    <div className="space-y-2">
                                        {Object.entries(generatedSecrets).map(([key, value]) => (
                                            <div key={key} className="bg-black/60 rounded border border-gray-700/50 p-2 flex justify-between items-center group hover:border-gray-600 transition-colors">
                                                <div className="overflow-hidden mr-2">
                                                    <div className="text-[8px] text-gray-500 uppercase font-black tracking-widest">{key}</div>
                                                    <div className="text-[11px] text-gray-300 font-mono truncate max-w-[220px]">{value}</div>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(value!, key)}
                                                    className="p-1.5 rounded hover:bg-white/10 transition-colors shrink-0"
                                                    title="Copy to clipboard"
                                                >
                                                    {copiedField === key ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-gray-500 group-hover:text-white" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-indigo-900/20 border border-indigo-700/50 rounded-md p-4 text-xs text-indigo-300 flex gap-3">
                                <Lock className="h-5 w-5 shrink-0 opacity-70" />
                                <div>
                                    <strong className="block mb-1">Final Deployment Step:</strong>
                                    Update your environment variables with the secrets above, set <code>SETUP_MODE=false</code>, and restart your server.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
    );
}
