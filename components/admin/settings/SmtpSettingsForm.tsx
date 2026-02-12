'use client';

import { useActionState, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { updateSmtpSettings, verifySmtpConfig } from '@/lib/actions/settings';
import { sendTestEmail } from '@/lib/email';
import { Save, Mail, AlertCircle, CheckCircle, Send, Loader2 } from 'lucide-react';

const initialState = {
    message: null,
    error: null,
};

export default function SmtpSettingsForm({ initialSettings }: { initialSettings: any }) {
    const [state, formAction, isPending] = useActionState(updateSmtpSettings, initialState as any);

    // SMTP State
    const [smtpSecure, setSmtpSecure] = useState(initialSettings.smtpSecure ?? true);

    // Test & Verification State
    const [testEmail, setTestEmail] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false); // Controls Save button
    const [verificationMsg, setVerificationMsg] = useState<{ success: boolean, message: string } | null>(null);

    // If initial settings exist, assume they were verified before (or user can re-verify)
    // Actually, user wants "Test" before "Save".
    // If we load existing settings, we can enable Save if user makes NO changes?
    // But if user changes input, disable Save until Test.
    const [formChanged, setFormChanged] = useState(false);

    const handleVerification = async (formData: FormData) => {
        setVerifying(true);
        setVerificationMsg(null);

        try {
            // Append secure checkbox state if needed, though form data should have it
            // manual append if controlled state differs, but here we can just pass formData from handler?
            // Actually, we need to construct FormData from the form inputs to send to server action

            const result = await verifySmtpConfig(null, formData);
            if (result.success) {
                setVerified(true);
                setVerificationMsg({ success: true, message: result.message! });
            } else {
                setVerified(false);
                setVerificationMsg({ success: false, message: result.message! });
            }
        } catch (e: any) {
            setVerificationMsg({ success: false, message: e.message });
        } finally {
            setVerifying(false);
        }
    };

    // Handler to run verification from button
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

    return (
        <form action={formAction} onChange={handleChange} className="space-y-6 max-w-2xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow">

            {/* Feedback Messages (Save Result) */}
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

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6">
                <div className="sm:col-span-4">
                    <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        SMTP Host
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="smtpHost"
                            id="smtpHost"
                            defaultValue={initialSettings.smtpHost || ''}
                            placeholder="smtp.example.com"
                            required
                            className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        SMTP Port
                    </label>
                    <div className="mt-1">
                        <input
                            type="number"
                            name="smtpPort"
                            id="smtpPort"
                            defaultValue={initialSettings.smtpPort || '587'}
                            required
                            className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="sm:col-span-3">
                    <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        SMTP Username
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="smtpUser"
                            id="smtpUser"
                            defaultValue={initialSettings.smtpUser || ''}
                            autoComplete="off"
                            required
                            className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="sm:col-span-3">
                    <label htmlFor="smtpPass" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        SMTP Password
                    </label>
                    <div className="mt-1">
                        <input
                            type="password"
                            name="smtpPass"
                            id="smtpPass"
                            defaultValue={initialSettings.smtpPass || ''}
                            autoComplete="new-password"
                            placeholder={initialSettings.smtpPass ? '******' : ''}
                            // Required only if no existing password? Or always require for new setup?
                            // Logic: if existing is present, optional. If empty, required? 
                            // user might just update host.
                            className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="sm:col-span-6">
                    <label htmlFor="smtpFromEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        From Email Address
                    </label>
                    <div className="mt-1">
                        <input
                            type="email"
                            name="smtpFromEmail"
                            id="smtpFromEmail"
                            defaultValue={initialSettings.smtpFromEmail || ''}
                            placeholder="noreply@yourcompany.com"
                            className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-start mb-6">
                <div className="flex items-center h-5">
                    <input
                        id="smtpSecure"
                        name="smtpSecure"
                        type="checkbox"
                        value="true"
                        checked={smtpSecure}
                        onChange={(e) => {
                            setSmtpSecure(e.target.checked);
                            handleChange(); // Trigger change detection
                        }}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="smtpSecure" className="font-medium text-gray-700 dark:text-gray-300">
                        Use Secure Connection (TLS/SSL)
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                        Usually <strong>checked</strong> for Port 465, and <strong>unchecked</strong> for Port 587.
                    </p>
                </div>
            </div>

            {/* Verification Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-600 mb-6">
                <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Verify Connection</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        You must verify the connection before you can save changes. Optionally, enter an email to receive a test message.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="w-full sm:flex-1">
                            <label htmlFor="testEmailTo" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Test Email To (Optional)
                            </label>
                            <input
                                type="email"
                                name="testEmailTo"
                                id="testEmailTo"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onVerifyClick}
                            disabled={verifying}
                            className="w-full sm:w-auto"
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    {testEmail ? <Send className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    {testEmail ? 'Verify & Send Test' : 'Test Connection'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                {verificationMsg && (
                    <div className={`mt-3 text-sm flex items-center gap-2 ${verificationMsg.success ? 'text-green-600' : 'text-red-600'}`}>
                        {verificationMsg.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {verificationMsg.message}
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button type="submit" disabled={isPending || (!verified && formChanged)}>
                    {isPending ? 'Saving...' : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>

            {(!verified && formChanged) && (
                <p className="text-xs text-red-500 text-right mt-2">
                    Please test the connection to enable saving.
                </p>
            )}
        </form>
    );
}
