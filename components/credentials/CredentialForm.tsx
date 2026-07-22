'use client';

import React, { useActionState, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Upload, Eye, EyeOff, Loader2, Plus, Trash2, ShieldCheck, Globe, Sliders, Lock, Key, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const initialState = {
    message: null,
    error: null,
};

type CredentialFormProps = {
    action: (prevState: any, formData: FormData) => Promise<any>;
    initialData?: any;
    isEdit?: boolean;
    allowedCategories?: string[]; // passed from server
    allowedEnvironments?: string[]; // passed from server
    isExternal?: boolean; // New prop
};

export default function CredentialForm({
    action,
    initialData,
    isEdit = false,
    allowedCategories = ['*'],
    allowedEnvironments = ['*'],
    isExternal = false
}: CredentialFormProps) {
    const [type, setType] = useState(initialData?.type || 'PASSWORD');
    const [isPersonal, setIsPersonal] = useState(initialData?.isPersonal || false);

    const [customParams, setCustomParams] = useState<{ name: string; value: string; location: 'BODY' | 'HEADER' | 'URL' }[]>(
        initialData?.details?.customParameters || []
    );

    const [formState, formAction, isPending] = useActionState(action, initialState as any);
    const state = formState || initialState;

    // Track original filenames for Key/Cert uploads
    const [publicFileName, setPublicFileName] = useState('');
    const [privateFileName, setPrivateFileName] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [clientError, setClientError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showClientSecret, setShowClientSecret] = useState(false);
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [dismissError, setDismissError] = useState(false);
    const [forceCloseModal, setForceCloseModal] = useState(false);
    const [navigatingUrl, setNavigatingUrl] = useState<string | null>(null);
    const router = useRouter();

    const handleNavigate = (url: string) => {
        setNavigatingUrl(url);
        // Show loading state briefly before closing modal and navigating
        setTimeout(() => {
            setForceCloseModal(true);
            if (url === '/credentials/create') {
                window.location.href = url;
            } else {
                router.push(url);
            }
        }, 150);
    };

    // Reset error dismissal status whenever a new submission starts
    import_react_useEffect_hack: {
        // We use a small hack since we can't easily add the import if it's not there, but it is imported as useEffect in the top.
    }
    React.useEffect(() => {
        if (isPending) setDismissError(false);
    }, [isPending]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File) => {
        setClientError(null);
        if (file.size > 100 * 1024) {
            setClientError(`File "${file.name}" exceeds the 100KB size limit.`);
            return false;
        }

        const isImageMime = file.type.startsWith('image/');
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'heic'];

        if (isImageMime || imageExtensions.includes(ext)) {
            setClientError(`Image formats are not allowed ("${file.name}").`);
            return false;
        }

        return true;
    };

    const handleCredFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!validateFile(file)) {
            e.target.value = ''; // Reset input
            setUploadedFileName('');
            const nameInput = document.getElementById('fileName') as HTMLInputElement;
            if (nameInput) nameInput.value = '';
            const typeInput = document.getElementById('fileType') as HTMLInputElement;
            if (typeInput) typeInput.value = '';
            const textarea = document.getElementById('fileContent') as HTMLTextAreaElement;
            if (textarea) textarea.value = '';
            return;
        }

        // Auto-populate fileName
        const nameInput = document.getElementById('fileName') as HTMLInputElement;
        if (nameInput) nameInput.value = file.name;

        // Auto-populate fileType from extension
        const ext = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
        const typeInput = document.getElementById('fileType') as HTMLInputElement;
        if (typeInput) typeInput.value = ext;

        setUploadedFileName(file.name);

        // Read file as text so content is displayed as-is
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const textarea = document.getElementById('fileContent') as HTMLTextAreaElement;
            if (textarea) textarea.value = text;
        };
        reader.readAsText(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!validateFile(file)) {
            e.target.value = ''; // Reset input
            return;
        }

        // Store filename
        if (fieldId === 'publicKey') setPublicFileName(file.name);
        if (fieldId === 'privateKey') setPrivateFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const textarea = document.getElementById(fieldId) as HTMLTextAreaElement;
            if (textarea) textarea.value = text;
        };
        reader.readAsText(file);
    };

    // Filter Options based on Permissions
    const ALL_CATEGORIES = ['Application', 'Infra', 'Integration'];
    const ALL_ENVIRONMENTS = ['Dev', 'QA', 'Prod'];

    const filteredCategories = allowedCategories.includes('*')
        ? ALL_CATEGORIES
        : ALL_CATEGORIES.filter(c => allowedCategories.includes(c));

    const filteredEnvironments = allowedEnvironments.includes('*')
        ? ALL_ENVIRONMENTS
        : ALL_ENVIRONMENTS.filter(e => allowedEnvironments.includes(e));

    return (
        <form action={formAction} className="space-y-6 max-w-4xl mx-auto p-4 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow">

            {/* Hidden inputs to pass filenames to server action */}
            {type === 'KEY_CERT' && (
                <>
                    <input type="hidden" name="publicKeyFileName" value={publicFileName} />
                    <input type="hidden" name="privateKeyFileName" value={privateFileName} />
                </>
            )}

            {/* -------------------- MASTER FIELDS -------------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Credential Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        defaultValue={initialData?.name}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g. Production AWS Root"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        disabled={isEdit}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                    >

                        <option value="PASSWORD">Password / Database</option>
                        <option value="API_OAUTH">API / OAuth</option>
                        <option value="KEY_CERT">Key / Certificate</option>
                        <option value="TOKEN">Token</option>
                        <option value="SECURE_NOTE">Secure Note</option>
                        <option value="FILE">File</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                    </label>
                    <select
                        id="category"
                        name="category"
                        defaultValue={initialData?.category || filteredCategories[0]}
                        // Don't disable if it's the only option, just let it be. Or if disabled, we MUST pass hidden.
                        // Better UX: If 1 option, just show it. If we disable, we lose the value in FormData.
                        // Strategy: Keep enabled but if only 1, user can't change it anyway.
                        // Actually, if we want to enforce it visually as locked, we can disable but add hidden.
                        disabled={isPersonal || filteredCategories.length <= 1}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-80"
                    >
                        {filteredCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    {/* HIDDEN INPUT IF DISABLED (Only 1 option and NOT Personal) */}
                    {!isPersonal && filteredCategories.length <= 1 && filteredCategories[0] && (
                        <input type="hidden" name="category" value={filteredCategories[0]} />
                    )}

                    {filteredCategories.length === 0 && !isPersonal && (
                        <p className="text-xs text-red-500 mt-1">No allowed categories.</p>
                    )}
                </div>

                <div>
                    <label htmlFor="environment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Environment
                    </label>
                    <select
                        id="environment"
                        name="environment"
                        defaultValue={initialData?.environment || filteredEnvironments[0]}
                        disabled={isPersonal || filteredEnvironments.length <= 1}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-80"
                    >
                        {filteredEnvironments.map(e => (
                            <option key={e} value={e}>{e === 'QA' ? 'QA / Staging' : (e === 'Dev' ? 'Development' : 'Production')}</option>
                        ))}
                    </select>
                    {/* HIDDEN INPUT IF DISABLED */}
                    {!isPersonal && filteredEnvironments.length <= 1 && filteredEnvironments[0] && (
                        <input type="hidden" name="environment" value={filteredEnvironments[0]} />
                    )}

                    {filteredEnvironments.length === 0 && !isPersonal && (
                        <p className="text-xs text-red-500 mt-1">No allowed environments.</p>
                    )}
                </div>

                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expiry Date
                    </label>
                    <input
                        type="date"
                        name="expiryDate"
                        id="expiryDate"
                        defaultValue={initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : ''}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {!isExternal && (
                    <div className="md:col-span-2 flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center h-5">
                            <input
                                id="isPersonal"
                                name="isPersonal"
                                type="checkbox"
                                value="true"
                                checked={isPersonal}
                                onChange={(e) => setIsPersonal(e.target.checked)}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3">
                            <label htmlFor="isPersonal" className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                Personal Credential
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                    Private
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                If checked, this credential will be <strong>hidden from everyone else</strong>, including Admins. Only you can access it.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6"></div>

            {/* -------------------- TYPE SPECIFIC FIELDS -------------------- */}

            {/* PASSWORD / DATABASE */}
            {type === 'PASSWORD' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Credentials
                        </label>
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username <span className="text-red-500">*</span></label>
                        <input type="text" name="username" id="username" required defaultValue={initialData?.details?.username}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password <span className="text-red-500">*</span></label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                required={!isEdit}
                                defaultValue={initialData?.details?.password}
                                placeholder={isEdit ? 'Unchanged' : ''}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 pr-10 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Host / IP (Optional)</label>
                        <input type="text" name="host" id="host" defaultValue={initialData?.details?.host}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Port (Optional)</label>
                        <input type="number" name="port" id="port" defaultValue={initialData?.details?.port}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                    </div>
                </div>
            )}

            {/* API / OAUTH SECTION - MODERN ENTERPRISE UI */}
            {type === 'API_OAUTH' && (
                <div className="space-y-4">
                    {/* Hidden input to pass customParameters payload string */}
                    <input type="hidden" name="customParameters" value={JSON.stringify(customParams)} />

                    {/* Card 1: Core Credentials & Token Endpoint */}
                    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xs">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                                <Key className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    OAuth 2.0 Client Credentials
                                </h3>
                                <p className="text-xs text-gray-400">Configure Client ID, Secret, Token Endpoint, and Scope</p>
                            </div>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label htmlFor="clientId" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                    Client ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="clientId"
                                    id="clientId"
                                    defaultValue={initialData?.details?.clientId}
                                    className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                                    placeholder="e.g. 8f9a2b1c-3d4e-5f6a-7b8c-9d0e1f2a3b4c"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="clientSecret" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                    Client Secret <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type={showClientSecret ? "text" : "password"}
                                        name="clientSecret"
                                        id="clientSecret"
                                        defaultValue={initialData?.details?.clientSecret}
                                        placeholder={isEdit ? '•••••••••••••••• (Unchanged)' : 'e.g. sec_x9K#mP2$vL8NqR1wZ'}
                                        className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors pr-10"
                                        required={!isEdit}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowClientSecret(!showClientSecret)}
                                        className="absolute right-3 text-gray-400 hover:text-gray-200"
                                    >
                                        {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="tokenEndpoint" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                    Token Endpoint <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    name="tokenEndpoint"
                                    id="tokenEndpoint"
                                    defaultValue={initialData?.details?.tokenEndpoint}
                                    className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                                    placeholder="https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="scope" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                    Scope
                                </label>
                                <input
                                    type="text"
                                    name="scope"
                                    id="scope"
                                    defaultValue={initialData?.details?.scope || initialData?.details?.scopes}
                                    className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                                    placeholder="e.g. read write profile"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Accordion 1: Advanced OAuth Configuration */}
                    <details className="group border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-900/25 transition-colors list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-200">
                                <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                                Advanced OAuth Configuration
                            </div>
                        </summary>
                        <div className="px-5 pb-5 pt-3 border-t border-slate-800 bg-slate-950/10 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Grant Type */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Grant Type</label>
                                    <input
                                        type="text"
                                        value="Client Credentials"
                                        readOnly
                                        disabled
                                        className="block w-full bg-slate-950/20 border border-slate-800/80 rounded-lg px-3 py-2.5 text-xs text-gray-500 font-mono select-none cursor-not-allowed"
                                    />
                                </div>

                                {/* Grant Transmission */}
                                <div>
                                    <label htmlFor="grantTypeTransmission" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Grant Transmission</label>
                                    <div className="relative">
                                        <select
                                            name="grantTypeTransmission"
                                            id="grantTypeTransmission"
                                            defaultValue={initialData?.details?.grantTypeTransmission || 'BODY'}
                                            className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-gray-200 appearance-none font-mono focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="BODY">Request Body (Recommended)</option>
                                            <option value="URL">URL Query Parameter</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                            <ChevronRight className="h-3 w-3 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Client Authentication */}
                                <div>
                                    <label htmlFor="clientAuthentication" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Client Authentication</label>
                                    <div className="relative">
                                        <select
                                            name="clientAuthentication"
                                            id="clientAuthentication"
                                            defaultValue={initialData?.details?.clientAuthentication || 'HEADER'}
                                            className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-gray-200 appearance-none font-mono focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="HEADER">HTTP Basic Auth Header (Recommended)</option>
                                            <option value="BODY">Request Body Payload</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                            <ChevronRight className="h-3 w-3 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* HTTP Content-Type */}
                                <div>
                                    <label htmlFor="contentType" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">HTTP Content-Type</label>
                                    <div className="relative">
                                        <select
                                            name="contentType"
                                            id="contentType"
                                            defaultValue={initialData?.details?.contentType || 'APPLICATION_X_WWW_FORM_URLENCODED'}
                                            className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-gray-200 appearance-none font-mono focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="APPLICATION_X_WWW_FORM_URLENCODED">application/x-www-form-urlencoded</option>
                                            <option value="APPLICATION_JSON">application/json</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                            <ChevronRight className="h-3 w-3 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resource & Audience Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="resource" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Resource Identifier (Optional)</label>
                                    <input
                                        type="text"
                                        name="resource"
                                        id="resource"
                                        defaultValue={initialData?.details?.resource}
                                        className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        placeholder="e.g. https://api.partner.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="audience" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Audience Claim (Optional)</label>
                                    <input
                                        type="text"
                                        name="audience"
                                        id="audience"
                                        defaultValue={initialData?.details?.audience}
                                        className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                                        placeholder="e.g. https://auth.partner.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </details>

                    {/* Accordion 2: Custom Parameters */}
                    <details className="group border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-900/25 transition-colors list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-200">
                                <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                                Custom Parameters ({customParams.length})
                            </div>
                        </summary>
                        <div className="px-5 pb-5 pt-3 border-t border-slate-800 bg-slate-950/10">
                            {customParams.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg">
                                    <Lock className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                                    <p className="text-xs text-gray-400 font-medium">No custom parameters configured</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Click "Add Parameter" below for custom client headers or body inputs</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left text-gray-300">
                                        <thead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-slate-800">
                                            <tr>
                                                <th className="py-2.5 px-3">Name</th>
                                                <th className="py-2.5 px-3">Value</th>
                                                <th className="py-2.5 px-3">Location</th>
                                                <th className="py-2.5 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-850">
                                            {customParams.map((param, index) => (
                                                <tr key={index} className="hover:bg-slate-900/20 font-mono">
                                                    <td className="py-2 px-2 text-gray-200">
                                                        <input
                                                            type="text"
                                                            placeholder="Parameter Name"
                                                            value={param.name}
                                                            onChange={(e) => {
                                                                const updated = [...customParams];
                                                                updated[index].name = e.target.value;
                                                                setCustomParams(updated);
                                                            }}
                                                            className="w-full bg-slate-950/40 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-indigo-500"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Parameter Value"
                                                            value={param.value}
                                                            onChange={(e) => {
                                                                const updated = [...customParams];
                                                                updated[index].value = e.target.value;
                                                                setCustomParams(updated);
                                                            }}
                                                            className="w-full bg-slate-950/40 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-gray-200 focus:ring-1 focus:ring-indigo-500"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <div className="relative">
                                                            <select
                                                                value={param.location}
                                                                onChange={(e) => {
                                                                    const updated = [...customParams];
                                                                    updated[index].location = e.target.value as any;
                                                                    setCustomParams(updated);
                                                                }}
                                                                className="w-full bg-slate-950/40 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-gray-200 appearance-none focus:ring-1 focus:ring-indigo-500"
                                                            >
                                                                <option value="BODY">Request Body</option>
                                                                <option value="HEADER">HTTP Header</option>
                                                                <option value="URL">URL Query Parameter</option>
                                                            </select>
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
                                                                <ChevronRight className="h-3 w-3 rotate-90" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCustomParams(customParams.filter((_, i) => i !== index))}
                                                            className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors"
                                                            title="Delete parameter"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Add parameter link */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80">
                                <button
                                    type="button"
                                    onClick={() => setCustomParams([...customParams, { name: '', value: '', location: 'BODY' }])}
                                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    + Add Parameter
                                </button>
                            </div>
                        </div>
                    </details>

                    {/* Accordion 3: Legacy Configuration (Optional fallback fields) */}
                    <details className="group border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-900/25 transition-colors list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-200">
                                <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                                Legacy Configuration
                            </div>
                        </summary>
                        <div className="px-5 pb-5 pt-3 border-t border-slate-800 bg-slate-950/10 space-y-4">
                            <div>
                                <label htmlFor="apiKey" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Standalone API Key / Fallback</label>
                                <textarea
                                    name="apiKey"
                                    id="apiKey"
                                    rows={2}
                                    defaultValue={initialData?.details?.apiKey}
                                    placeholder={isEdit ? '•••••••••••••••• (Unchanged)' : 'Optional standalone API key or static bearer token payload'}
                                    className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    </details>
                </div>
            )}

            {/* KEY / CERT */}
            {type === 'KEY_CERT' && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="keyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key Type <span className="text-red-500">*</span></label>
                            <select name="keyType" id="keyType" defaultValue={initialData?.details?.keyType || 'SSL'}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white">
                                <option value="SSL">SSL</option>
                                <option value="SSH">SSH</option>
                                <option value="PGP">PGP</option>
                                <option value="TLS">TLS</option>
                                <option value="SIGNING">Code Signing</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="keyFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Format</label>
                            <select name="keyFormat" id="keyFormat" defaultValue={initialData?.details?.keyFormat || 'PEM'}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white">
                                <option value="PEM">PEM</option>
                                <option value="DER">DER</option>
                                <option value="PFX">PFX</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Public Key</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="uploadPublicKey"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'publicKey')}
                                    />
                                    <label htmlFor="uploadPublicKey" className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-500 font-medium">
                                        Upload File
                                    </label>
                                </div>
                            </div>
                            <textarea name="publicKey" id="publicKey" rows={3} defaultValue={initialData?.details?.publicKey}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white font-mono text-xs" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Private Key</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="uploadPrivateKey"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'privateKey')}
                                    />
                                    <label htmlFor="uploadPrivateKey" className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-500 font-medium">
                                        Upload File
                                    </label>
                                </div>
                            </div>
                            <textarea name="privateKey" id="privateKey" rows={3} defaultValue={initialData?.details?.privateKey} placeholder={isEdit ? 'Unchanged' : ''}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white font-mono text-xs" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Passphrase (Optional)</label>
                        <div className="relative mt-1">
                            <input
                                type={showPassphrase ? "text" : "password"}
                                name="passphrase"
                                id="passphrase"
                                defaultValue={initialData?.details?.passphrase}
                                placeholder={isEdit ? 'Unchanged' : ''}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 pr-10 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassphrase(!showPassphrase)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                            >
                                {showPassphrase ? (
                                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOKEN */}
            {type === 'TOKEN' && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div>
                        <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Token Value <span className="text-red-500">*</span></label>
                        <textarea name="token" id="token" rows={3} required={!isEdit} defaultValue={initialData?.details?.token} placeholder={isEdit ? 'Unchanged' : ''}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white font-mono text-break" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tokenType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Token Type</label>
                            <select name="tokenType" id="tokenType" defaultValue={initialData?.details?.tokenType || 'Bearer'}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white">
                                <option value="Bearer">Bearer</option>
                                <option value="JWT">JWT</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* SECURE NOTE */}
            {type === 'SECURE_NOTE' && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div>
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Safe Note <span className="text-red-500">*</span></label>
                        <textarea name="note" id="note" rows={6} required={!isEdit} defaultValue={initialData?.details?.note} placeholder="Enter sensitive information here..."
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white font-mono" />
                    </div>
                </div>
            )}

            {/* FILE */}
            {type === 'FILE' && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    {/* Upload Button */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleCredFileUpload}
                        />
                        <Upload className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                        {uploadedFileName ? (
                            <>
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{uploadedFileName}</p>
                                <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload a file</p>
                                <p className="text-xs text-gray-500 mt-1">File name, type, and content will be auto-filled</p>
                            </>
                        )}
                    </div>

                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-xs text-gray-400">or fill manually</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">File Name <span className="text-red-500">*</span></label>
                            <input type="text" name="fileName" id="fileName" required defaultValue={initialData?.details?.fileName} placeholder="e.g. key.pem"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">File Type (Extension)</label>
                            <input type="text" name="fileType" id="fileType" defaultValue={initialData?.details?.fileType} placeholder="e.g. PEM"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="fileContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">File Content (Text/Base64) <span className="text-red-500">*</span></label>
                        <p className="text-xs text-gray-500 mb-2">Auto-filled on upload, or paste content manually.</p>
                        <textarea name="fileContent" id="fileContent" rows={6} required={!isEdit} defaultValue={initialData?.details?.fileContent}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white font-mono text-xs" />
                    </div>
                </div>
            )}

            {/* Common Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description / Notes
                </label>
                <div className="mt-1">
                    <textarea
                        name="description"
                        id="description"
                        rows={3}
                        defaultValue={initialData?.description}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : (isEdit ? 'Update Credential' : 'Save Credential')}
                </Button>
            </div>

            {clientError && (
                <div className="p-4 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-md flex flex-col gap-2 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-5 h-5" />
                        <span>File Upload Error</span>
                    </div>
                    <p className="text-sm">{clientError}</p>
                </div>
            )}

            {/* MODAL OVERLAY */}
            {(!forceCloseModal && (isPending || (state?.message && !isEdit) || (state?.message && isEdit) || (state?.error && !dismissError))) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 flex flex-col items-center border border-gray-200 dark:border-gray-700">
                        {isPending && (
                            <>
                                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {isEdit ? 'Updating credentials...' : 'Creating credentials...'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">Please wait while we encrypt and save your data.</p>
                            </>
                        )}

                        {!isPending && state?.message && (
                            <>
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Success!</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">{state.message}</p>
                                <div className="flex flex-col gap-3 w-full">
                                    {!isEdit && (
                                        <Button type="button" onClick={() => handleNavigate('/credentials/create')} disabled={navigatingUrl !== null} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center">
                                            {navigatingUrl === '/credentials/create' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : '➕ '} Create New Credentials
                                        </Button>
                                    )}
                                    <Button type="button" variant="outline" onClick={() => handleNavigate('/credentials')} disabled={navigatingUrl !== null} className="w-full flex items-center justify-center">
                                        {navigatingUrl === '/credentials' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : '👁️ '} View Credentials
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={() => handleNavigate('/dashboard')} disabled={navigatingUrl !== null} className="w-full flex items-center justify-center">
                                        {navigatingUrl === '/dashboard' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : '🏠 '} Go to Dashboard
                                    </Button>
                                </div>
                            </>
                        )}

                        {!isPending && state?.error && (
                            <>
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Creation Failed</h3>
                                <div className="text-sm text-red-600 dark:text-red-400 text-center mb-6 max-h-32 overflow-y-auto">
                                    {typeof state.error === 'string' ? state.error : (
                                        <ul className="list-disc pl-5 text-left">
                                            {state.details && Object.entries(state.details).map(([key, msgs]) => (
                                                <li key={key}>
                                                    <span className="font-semibold capitalize">{key}:</span> {Array.isArray(msgs) ? (msgs as string[]).join(', ') : (msgs as unknown as string)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex gap-3 w-full">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => window.history.back()}>
                                        Cancel
                                    </Button>
                                    <Button type="button" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => setDismissError(true)}>
                                        Retry
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </form>
    );
}
