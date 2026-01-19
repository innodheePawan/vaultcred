'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

const initialState = {
    message: null,
    error: null,
};

type CredentialFormProps = {
    action: (prevState: any, formData: FormData) => Promise<any>;
    initialData?: any;
    isEdit?: boolean;
};

export default function CredentialForm({ action, initialData, isEdit = false }: CredentialFormProps) {
    const [type, setType] = useState(initialData?.type || 'PASSWORD');
    const [formState, formAction, isPending] = useActionState(action, initialState);
    const state = formState || initialState;

    // Track original filenames for Key/Cert uploads
    const [publicFileName, setPublicFileName] = useState('');
    const [privateFileName, setPrivateFileName] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
                        defaultValue={initialData?.category || 'Application'}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="Application">Application</option>
                        <option value="Infra">Infrastructure</option>
                        <option value="Integration">Integration</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="environment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Environment
                    </label>
                    <select
                        id="environment"
                        name="environment"
                        defaultValue={initialData?.environment || 'Dev'}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="Dev">Development</option>
                        <option value="QA">QA / Staging</option>
                        <option value="Prod">Production</option>
                    </select>
                </div>
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
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password Username <span className="text-red-500">*</span></label>
                        <input type="text" name="username" id="username" required defaultValue={initialData?.details?.username}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password <span className="text-red-500">*</span></label>
                        <input type="password" name="password" id="password" required={!isEdit} defaultValue={initialData?.details?.password} placeholder={isEdit ? 'Unchanged' : ''}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
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

            {/* API / OAUTH */}
            {type === 'API_OAUTH' && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">OAuth / API Details</label>
                        <p className="text-xs text-gray-500 mb-4">Provide either API Key OR Client ID/Secret</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client ID</label>
                            <input type="text" name="clientId" id="clientId" defaultValue={initialData?.details?.clientId}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Secret</label>
                            <input type="password" name="clientSecret" id="clientSecret" defaultValue={initialData?.details?.clientSecret} placeholder={isEdit ? 'Unchanged' : ''}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                        <textarea name="apiKey" id="apiKey" rows={2} defaultValue={initialData?.details?.apiKey} placeholder={isEdit ? 'Unchanged' : ''}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white font-mono" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tokenEndpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Token Endpoint (URL)</label>
                            <input type="url" name="tokenEndpoint" id="tokenEndpoint" defaultValue={initialData?.details?.tokenEndpoint}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="authEndpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Auth Endpoint (URL)</label>
                            <input type="url" name="authEndpoint" id="authEndpoint" defaultValue={initialData?.details?.authEndpoint}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="scopes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scopes (comma separated)</label>
                        <input type="text" name="scopes" id="scopes" defaultValue={initialData?.details?.scopes}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
                    </div>
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
                        <input type="password" name="passphrase" id="passphrase" defaultValue={initialData?.details?.passphrase} placeholder={isEdit ? 'Unchanged' : ''}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
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
                        <div>
                            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date <span className="text-red-500">*</span></label>
                            <input type="date" name="expiryDate" id="expiryDate" required defaultValue={initialData?.details?.expiryDate ? new Date(initialData.details.expiryDate).toISOString().split('T')[0] : ''}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 dark:bg-gray-700 dark:text-white" />
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
                        <p className="text-xs text-gray-500 mb-2">Paste the content of the file here.</p>
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

            {state?.error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-5 h-5" />
                        <span>Validation Error</span>
                    </div>
                    {typeof state.error === 'string' ? state.error : (
                        <ul className="list-disc pl-5 text-sm">
                            {/* Handle Object errors from Zod flatten() */}
                            {state.details && Object.entries(state.details).map(([key, msgs]) => (
                                <li key={key}>
                                    <span className="font-semibold capitalize">{key}:</span> {Array.isArray(msgs) ? (msgs as string[]).join(', ') : (msgs as string)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}


            {state?.message && typeof state.message === 'string' && (
                <div className="p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <div className="flex-1">
                        {state.message}
                        <div className="mt-1">
                            <a href="/credentials" className="text-sm font-medium underline">
                                View All Credentials
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
