'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateSmtpSettings, verifySmtpConfig } from '@/lib/actions/settings';
import { 
    Save, 
    Mail, 
    AlertCircle, 
    CheckCircle2, 
    Send, 
    Loader2, 
    Server, 
    Hash, 
    User, 
    Lock, 
    Eye, 
    EyeOff, 
    ShieldCheck, 
    ShieldAlert, 
    Sparkles, 
    Check
} from 'lucide-react';

const initialState = {
    message: null,
    error: null,
};

export default function SmtpSettingsForm({ initialSettings, canEdit = true }: { initialSettings: any, canEdit?: boolean }) {
    const [state, formAction, isPending] = useActionState(updateSmtpSettings, initialState as any);

    // Form inputs state
    const [smtpPort, setSmtpPort] = useState(initialSettings.smtpPort?.toString() || '587');
    const [smtpSecure, setSmtpSecure] = useState(initialSettings.smtpSecure ?? false);
    const [showPassword, setShowPassword] = useState(false);

    // Test & Verification State
    const [testEmail, setTestEmail] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false); // Controls Save button
    const [verificationMsg, setVerificationMsg] = useState<{ success: boolean, message: string } | null>(null);
    const [formChanged, setFormChanged] = useState(false);

    const isConfigured = !!(initialSettings.smtpHost && initialSettings.smtpUser);

    const handleVerification = async (formData: FormData) => {
        setVerifying(true);
        setVerificationMsg(null);

        try {
            const result = await verifySmtpConfig(null, formData);
            if (result.success) {
                setVerified(true);
                setVerificationMsg({ success: true, message: result.message! });
            } else {
                setVerified(false);
                setVerificationMsg({ success: false, message: result.message! });
            }
        } catch (e: any) {
            setVerified(false);
            setVerificationMsg({ success: false, message: e.message || 'An unexpected error occurred during verification.' });
        } finally {
            setVerifying(false);
        }
    };

    const onVerifyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const form = (e.target as Element).closest('form') as HTMLFormElement;
        const formData = new FormData(form);
        handleVerification(formData);
    };

    const handleChange = () => {
        setVerified(false);
        setFormChanged(true);
        setVerificationMsg(null);
    };

    const applyPortPreset = (port: string, secure: boolean) => {
        setSmtpPort(port);
        setSmtpSecure(secure);
        handleChange();
    };

    return (
        <div className="max-w-3xl">
            <form 
                action={formAction} 
                onChange={handleChange} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                {/* Header Banner */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email (SMTP) Settings</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Configure the outgoing email server used for invitations, password resets, and alerts.
                            </p>
                        </div>
                    </div>
                    <div>
                        {isConfigured ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Configured
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Not Configured
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    {/* Feedback Messages (Save Result) */}
                    {state?.error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                            <span>{state.error}</span>
                        </div>
                    )}
                    {state?.message && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-sm">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                            <span>{state.message}</span>
                        </div>
                    )}

                    {/* Server Configuration Fields */}
                    <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-6">
                        {/* SMTP Host */}
                        <div className="sm:col-span-4">
                            <label htmlFor="smtpHost" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                SMTP Host <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-xs">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                    <Server className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    name="smtpHost"
                                    id="smtpHost"
                                    defaultValue={initialSettings.smtpHost || ''}
                                    placeholder="smtp.example.com"
                                    required
                                    disabled={!canEdit}
                                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* SMTP Port */}
                        <div className="sm:col-span-2">
                            <label htmlFor="smtpPort" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                Port <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-xs">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                    <Hash className="w-4 h-4" />
                                </div>
                                <input
                                    type="number"
                                    name="smtpPort"
                                    id="smtpPort"
                                    value={smtpPort}
                                    onChange={(e) => {
                                        setSmtpPort(e.target.value);
                                        handleChange();
                                    }}
                                    required
                                    disabled={!canEdit}
                                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Port Presets */}
                        <div className="sm:col-span-6 -mt-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Quick presets:</span>
                                <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => applyPortPreset('587', false)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                                        smtpPort === '587' && !smtpSecure
                                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/30'
                                            : 'bg-white dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {smtpPort === '587' && !smtpSecure && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                                    Port 587 (STARTTLS)
                                </button>
                                <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => applyPortPreset('465', true)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                                        smtpPort === '465' && smtpSecure
                                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/30'
                                            : 'bg-white dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {smtpPort === '465' && smtpSecure && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                                    Port 465 (Direct SSL/TLS)
                                </button>
                            </div>
                        </div>

                        {/* SMTP Username */}
                        <div className="sm:col-span-3">
                            <label htmlFor="smtpUser" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                SMTP Username <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-xs">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    name="smtpUser"
                                    id="smtpUser"
                                    defaultValue={initialSettings.smtpUser || ''}
                                    autoComplete="off"
                                    placeholder="user@example.com"
                                    required
                                    disabled={!canEdit}
                                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* SMTP Password */}
                        <div className="sm:col-span-3">
                            <label htmlFor="smtpPass" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                SMTP Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-xs">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="smtpPass"
                                    id="smtpPass"
                                    defaultValue={initialSettings.smtpPass || ''}
                                    autoComplete="new-password"
                                    placeholder={initialSettings.smtpPass ? '******' : 'Enter password'}
                                    disabled={!canEdit}
                                    className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* From Email Address */}
                        <div className="sm:col-span-6">
                            <label htmlFor="smtpFromEmail" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                Sender ("From") Email Address
                            </label>
                            <div className="relative rounded-lg shadow-xs">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    name="smtpFromEmail"
                                    id="smtpFromEmail"
                                    defaultValue={initialSettings.smtpFromEmail || ''}
                                    placeholder="noreply@yourcompany.com"
                                    disabled={!canEdit}
                                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                The email address displayed in the recipient's inbox. If omitted, the SMTP username will be used as the sender.
                            </p>
                        </div>
                    </div>

                    {/* SSL / TLS Option Card */}
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-700/30 p-4 transition">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <div className="flex items-center h-5 mt-0.5">
                                <input
                                    id="smtpSecure"
                                    name="smtpSecure"
                                    type="checkbox"
                                    value="true"
                                    checked={smtpSecure}
                                    disabled={!canEdit}
                                    onChange={(e) => {
                                        setSmtpSecure(e.target.checked);
                                        handleChange();
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        Use Secure Connection (Direct TLS / SSL)
                                    </span>
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                                        smtpSecure 
                                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' 
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                        {smtpSecure ? 'Implicit SSL (Port 465)' : 'Explicit STARTTLS (Port 587)'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    Enable this if connecting directly over SSL/TLS on <strong>Port 465</strong>. Keep unchecked for <strong>Port 587</strong> or <strong>25</strong> which negotiate encryption dynamically via STARTTLS.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Pre-Save Verification Section */}
                    <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/20 dark:from-indigo-950/20 dark:via-gray-800 dark:to-indigo-950/10 p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Test & Verify Connection
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Verification tests server reachability and credentials before saving to avoid breaking email delivery.
                                </p>
                            </div>
                            {verified && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    <Check className="w-3.5 h-3.5" /> Verified
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="w-full sm:flex-1">
                                <label htmlFor="testEmailTo" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Send Test Email To (Optional)
                                </label>
                                <div className="relative rounded-lg shadow-xs">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                                        <Send className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        name="testEmailTo"
                                        id="testEmailTo"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="admin@yourcompany.com"
                                        disabled={!canEdit || verifying}
                                        className="block w-full pl-10 pr-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {canEdit && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onVerifyClick}
                                    disabled={verifying}
                                    className="w-full sm:w-auto h-9.5 px-4 font-medium border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            {testEmail ? <Send className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                            {testEmail ? 'Verify & Send Test Email' : 'Test Connection'}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* Verification Response Banner */}
                        {verificationMsg && (
                            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition ${
                                verificationMsg.success 
                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                                    : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
                            }`}>
                                {verificationMsg.success ? (
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                                )}
                                <span className="font-medium">{verificationMsg.message}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                {canEdit && (
                    <div className="px-6 py-4 bg-gray-50/70 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                            {(!verified && formChanged) ? (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                                    Unsaved changes detected. Please test the connection before saving.
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Saved settings will take effect immediately across all email notifications.
                                </p>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isPending || (!verified && formChanged)}
                            className="w-full sm:w-auto px-5"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}

