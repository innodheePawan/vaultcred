'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { 
    Bell, 
    ShieldAlert, 
    ShieldCheck, 
    Clock, 
    AlertTriangle, 
    Info, 
    CheckCircle2, 
    Play, 
    Send, 
    RefreshCw, 
    Loader2, 
    Sliders,
    Layers,
    Mail,
    ArrowRight,
    Users
} from 'lucide-react';
import { updateAlertSettings, triggerAlertEvaluationAction, sendTestAlertDigestAction, getAlertDispatchLogs } from '@/lib/actions/alert-settings';
import { AlertEvaluationResult } from '@/lib/alert-engine';

interface AlertSetupFormProps {
    initialSettings: {
        tier1Days: number;
        tier2Days: number;
        tier3Days: number;
        lastEvaluationAt: string | null;
        canEdit: boolean;
        userRole: string;
        isScopedAdmin: boolean;
    };
    initialLogs: any[];
}

export default function AlertSetupForm({ initialSettings, initialLogs }: AlertSetupFormProps) {
    const [state, formAction, isPending] = useActionState(updateAlertSettings, {} as any);

    const [t1, setT1] = useState<number>(initialSettings.tier1Days);
    const [t2, setT2] = useState<number>(initialSettings.tier2Days);
    const [t3, setT3] = useState<number>(initialSettings.tier3Days);

    const [logs, setLogs] = useState<any[]>(initialLogs || []);
    const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

    // On-demand evaluation state
    const [isEvaluating, startEvaluationTransition] = useTransition();
    const [evaluationResult, setEvaluationResult] = useState<AlertEvaluationResult | null>(null);

    // Test email modal state
    const [showTestModal, setShowTestModal] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testTier, setTestTier] = useState<number>(1);
    const [isSendingTest, startTestTransition] = useTransition();
    const [testFeedback, setTestFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

    // Validation checks for hierarchy: Tier 1 > Tier 2 > Tier 3 > 0
    const isHierarchyValid = t1 > t2 && t2 > t3 && t3 > 0 && t1 <= 365;

    let validationErrorMsg = '';
    if (t3 <= 0) {
        validationErrorMsg = 'Tier 3 (Urgent) must be greater than 0 days.';
    } else if (t2 <= t3) {
        validationErrorMsg = `Tier 2 (${t2}d) must be strictly greater than Tier 3 (${t3}d).`;
    } else if (t1 <= t2) {
        validationErrorMsg = `Tier 1 (${t1}d) must be strictly greater than Tier 2 (${t2}d).`;
    } else if (t1 > 365) {
        validationErrorMsg = 'Tier 1 cannot exceed 365 days.';
    }

    const handleRunEvaluation = () => {
        setEvaluationResult(null);
        startEvaluationTransition(async () => {
            const res = await triggerAlertEvaluationAction();
            setEvaluationResult(res);
            // Refresh logs
            refreshLogs();
        });
    };

    const handleSendTest = () => {
        if (!testEmail || !testEmail.includes('@')) {
            setTestFeedback({ success: false, message: 'Please enter a valid email address.' });
            return;
        }
        setTestFeedback(null);
        startTestTransition(async () => {
            const res = await sendTestAlertDigestAction(testEmail, testTier);
            if (res.error) {
                setTestFeedback({ success: false, message: res.error });
            } else {
                setTestFeedback({ success: true, message: res.message });
            }
        });
    };

    const refreshLogs = async () => {
        setIsRefreshingLogs(true);
        try {
            const res = await getAlertDispatchLogs(25);
            setLogs(res.data || []);
        } catch (e) {
            console.error('Failed to refresh logs:', e);
        } finally {
            setIsRefreshingLogs(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Top Overview & Engine Status Banner */}
            <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                24h Background Engine
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Exact-Day Targeting
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Global Expiry Alert Policies
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                            Configure standard organization-wide expiration milestones. Stakeholders receive personalized, zero-leakage email digests targeted on these exact calendar days.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {initialSettings.canEdit && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => { setShowTestModal(true); setTestFeedback(null); }}
                                    className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm"
                                >
                                    <Mail className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                    Send Test Digest
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRunEvaluation}
                                    disabled={isEvaluating}
                                    className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm disabled:opacity-50"
                                >
                                    {isEvaluating ? (
                                        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Evaluating...</>
                                    ) : (
                                        <><Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Run Evaluation Now</>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Last Run Indicator */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Last evaluation cycle:</span>
                        <strong className="text-gray-700 dark:text-gray-300">
                            {initialSettings.lastEvaluationAt 
                                ? new Date(initialSettings.lastEvaluationAt).toLocaleString() 
                                : 'Not executed yet'}
                        </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Active Role Access:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {initialSettings.userRole} ({initialSettings.canEdit ? 'Read & Write' : 'Read-Only'})
                        </span>
                    </div>
                </div>
            </div>

            {/* Scoped Admin Read-Only Notice */}
            {initialSettings.isScopedAdmin && !initialSettings.canEdit && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                            Scoped Admin: Read-Only Access
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                            Global alert timelines are standardized by Super Administrators to enforce enterprise-wide compliance. Scope Admins can view these active thresholds and monitor dispatches, but cannot modify policies or trigger ad-hoc evaluations.
                        </p>
                    </div>
                </div>
            )}

            {/* Manual Evaluation Result Banner */}
            {evaluationResult && (
                <div className={`rounded-xl p-5 border ${
                    evaluationResult.success 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                            {evaluationResult.success ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            )}
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                {evaluationResult.success ? 'Evaluation Completed Successfully' : 'Evaluation Failed'}
                            </h4>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEvaluationResult(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                        >
                            Dismiss
                        </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Evaluated</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {evaluationResult.evaluatedCount}
                            </span>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Exact-Day Matches</span>
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {evaluationResult.matchingCount}
                            </span>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Digests Sent</span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {evaluationResult.dispatchedDigestCount}
                            </span>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Recipients Reached</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {evaluationResult.recipientsNotifiedCount}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Feedback Alerts */}
            {state?.success && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                        {state.message}
                    </p>
                </div>
            )}
            {state?.error && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-4 border border-rose-200 dark:border-rose-800 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                        {state.error}
                    </p>
                </div>
            )}

            {/* Threshold Tiers Configuration Form */}
            <form action={formAction} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-4">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Threshold Tiers
                            </h3>
                        </div>
                        <span className="text-xs text-gray-500">
                            Enforced Hierarchy: <strong>Tier 1 &gt; Tier 2 &gt; Tier 3 &gt; 0</strong>
                        </span>
                    </div>

                    {/* Tier Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Tier 1: Informational */}
                        <div className="rounded-xl border-2 border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                        Tier 1 (Informational)
                                    </span>
                                    <Info className="w-4 h-4 text-blue-500" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Early Lifecycle Notice
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                    Initial heads-up digest to technical consumers providing ample lead time for roadmap planning.
                                </p>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label htmlFor="tier1Days" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Trigger Days Prior to Expiry
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <input
                                        id="tier1Days"
                                        name="tier1Days"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={t1}
                                        onChange={(e) => setT1(parseInt(e.target.value, 10) || 0)}
                                        disabled={!initialSettings.canEdit || isPending}
                                        required
                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pl-4 pr-14 py-2.5 text-base font-bold focus:ring-2 focus:ring-blue-500 border disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-xs font-semibold text-gray-400">days</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-gray-500 block">Default: 60 days</span>
                            </div>
                        </div>

                        {/* Tier 2: Warning */}
                        <div className="rounded-xl border-2 border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                        Tier 2 (Warning)
                                    </span>
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Action Recommended
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                    Mid-cycle warning urging teams to initiate certificate rotation or token refreshes.
                                </p>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label htmlFor="tier2Days" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Trigger Days Prior to Expiry
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <input
                                        id="tier2Days"
                                        name="tier2Days"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={t2}
                                        onChange={(e) => setT2(parseInt(e.target.value, 10) || 0)}
                                        disabled={!initialSettings.canEdit || isPending}
                                        required
                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pl-4 pr-14 py-2.5 text-base font-bold focus:ring-2 focus:ring-amber-500 border disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-xs font-semibold text-gray-400">days</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-gray-500 block">Default: 30 days</span>
                            </div>
                        </div>

                        {/* Tier 3: Urgent */}
                        <div className="rounded-xl border-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-5 space-y-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300">
                                        Tier 3 (Urgent)
                                    </span>
                                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Imminent Expiration
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                    Final high-priority escalation. Sent before impending service disruption or outage.
                                </p>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label htmlFor="tier3Days" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Trigger Days Prior to Expiry
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <input
                                        id="tier3Days"
                                        name="tier3Days"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={t3}
                                        onChange={(e) => setT3(parseInt(e.target.value, 10) || 0)}
                                        disabled={!initialSettings.canEdit || isPending}
                                        required
                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pl-4 pr-14 py-2.5 text-base font-bold focus:ring-2 focus:ring-rose-500 border disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-xs font-semibold text-gray-400">days</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-gray-500 block">Default: 15 days</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Validation Banner if invalid */}
                    {!isHierarchyValid && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2.5 text-rose-800 dark:text-rose-300 text-xs">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{validationErrorMsg}</span>
                        </div>
                    )}

                    {/* Visual Timeline Progression */}
                    <div className="p-5 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                            <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                    Lifecycle Alert Progression
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Sequential notification escalation stages as credential approaches expiration
                                </span>
                            </div>
                            <span className="self-start sm:self-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Exact-Day &amp; Catch-Up Cadence
                            </span>
                        </div>

                        {/* Interactive Escalation Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Tier 1 Stage */}
                            <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/80 bg-white dark:bg-blue-950/30 shadow-xs flex items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                        <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                                            Tier 1: Info
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Early notice at milestone
                                    </p>
                                </div>
                                <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded-md shrink-0">
                                    {t1}d left
                                </span>
                            </div>

                            {/* Tier 2 Stage */}
                            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/80 bg-white dark:bg-amber-950/30 shadow-xs flex items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
                                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                            Tier 2: Warning
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Rotation reminder
                                    </p>
                                </div>
                                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-md shrink-0">
                                    {t2}d left
                                </span>
                            </div>

                            {/* Tier 3 Stage */}
                            <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/80 bg-white dark:bg-rose-950/30 shadow-xs flex items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                                        <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                                            Tier 3: Urgent
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Impending outage risk
                                    </p>
                                </div>
                                <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 px-2 py-1 rounded-md shrink-0">
                                    {t3}d left
                                </span>
                            </div>

                            {/* Day 0 Expired */}
                            <div className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-xs flex items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-300 inline-block"></span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                            Day 0: Expired
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Inactive / Revocation
                                    </p>
                                </div>
                                <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-2 py-1 rounded-md shrink-0">
                                    0d
                                </span>
                            </div>
                        </div>

                        {/* Visual Progress Bar Track */}
                        <div className="pt-2">
                            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: '40%' }} title={`Tier 1 (${t1} days)`}></div>
                                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: '30%' }} title={`Tier 2 (${t2} days)`}></div>
                                <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: '20%' }} title={`Tier 3 (${t3} days)`}></div>
                                <div className="bg-slate-800 dark:bg-slate-600 h-full transition-all duration-300" style={{ width: '10%' }} title="Expired (0 days)"></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 px-0.5">
                                <span>&larr; Early Warning ({t1}d)</span>
                                <span>Action Window ({t2}d)</span>
                                <span>Critical Escalation ({t3}d)</span>
                                <span>Service Outage (0d) &rarr;</span>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    {initialSettings.canEdit && (
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={!isHierarchyValid || isPending}
                                className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving Policies...</>
                                ) : (
                                    'Save Alert Policies'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </form>

            {/* Alert Dispatch History Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Alert Dispatches
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={refreshLogs}
                        disabled={isRefreshingLogs}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshingLogs ? 'animate-spin' : ''}`} />
                        Refresh Logs
                    </button>
                </div>

                {logs.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                        No alert digests have been recorded yet. The automated engine evaluates credentials once every 24 hours.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase font-semibold">
                                    <th className="py-2.5 px-3">Severity Tier</th>
                                    <th className="py-2.5 px-3">Recipient</th>
                                    <th className="py-2.5 px-3">Role</th>
                                    <th className="py-2.5 px-3">Credentials</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3 text-right">Dispatched At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                {logs.map((log) => {
                                    const tierBadge = log.tier === 1 
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                                        : log.tier === 2 
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
                                    const tierLabel = log.tier === 1 ? 'Tier 1 (Info)' : log.tier === 2 ? 'Tier 2 (Warn)' : 'Tier 3 (Urgent)';

                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition">
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${tierBadge}`}>
                                                    {tierLabel} ({log.daysRemaining}d)
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">
                                                {log.recipientEmail}
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                                                {log.recipientRole}
                                            </td>
                                            <td className="py-2.5 px-3 font-semibold text-gray-800 dark:text-gray-200">
                                                {log.credentialCount} {log.credentialCount === 1 ? 'credential' : 'credentials'}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {log.status === 'SENT' ? (
                                                    <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-semibold gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-semibold gap-1" title={log.errorMessage}>
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-gray-500 whitespace-nowrap">
                                                {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Test Email Modal */}
            {showTestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 p-6 space-y-5 animate-scale-in">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                            <div className="flex items-center gap-2">
                                <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Send Sample Alert Digest
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTestModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            Preview the exact email formatting and verify your SMTP delivery. This sends a sample digest with demonstration credentials.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Recipient Email Address
                                </label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="admin@company.com"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Severity Tier to Preview
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { tier: 1, label: `Tier 1 (${t1}d)`, color: 'text-blue-600' },
                                        { tier: 2, label: `Tier 2 (${t2}d)`, color: 'text-amber-600' },
                                        { tier: 3, label: `Tier 3 (${t3}d)`, color: 'text-rose-600' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.tier}
                                            type="button"
                                            onClick={() => setTestTier(opt.tier)}
                                            className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition ${
                                                testTier === opt.tier
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-xs'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {testFeedback && (
                                <div className={`p-3 rounded-lg text-xs font-medium ${
                                    testFeedback.success 
                                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' 
                                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300'
                                }`}>
                                    {testFeedback.message}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowTestModal(false)}
                                className="px-4 py-2 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={handleSendTest}
                                disabled={isSendingTest || !testEmail}
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow transition disabled:opacity-50"
                            >
                                {isSendingTest ? (
                                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending...</>
                                ) : (
                                    'Send Test Digest'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
