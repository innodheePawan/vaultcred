'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Download, ChevronRight, Pencil, Trash2, Shield, Key, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CredentialSecrets({ type, data }: { type: string, data: any }) {
    const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
    const [visibleParams, setVisibleParams] = useState<Record<number, boolean>>({});
    const [copied, setCopied] = useState<string | null>(null);

    const toggleVisibility = (field: string) => {
        setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const toggleParamVisibility = (idx: number) => {
        setVisibleParams(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            // Failed to copy
        }
    };

    const downloadFile = (content: string, filename: string) => {
        if (!content) return;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Custom Styled Field to match input-box-style fields with copy/eye icons
    const StyledField = ({ label, value, isSecret = false, fieldKey }: { label: string, value: string, isSecret?: boolean, fieldKey: string }) => {
        if (!value) return null;
        const isVisible = !isSecret || visibleFields[fieldKey];

        return (
            <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="relative flex items-center">
                    <input
                        type={isVisible ? "text" : "password"}
                        value={value}
                        readOnly
                        className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 select-all pr-20"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                        {isSecret && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleVisibility(fieldKey)} 
                                className="h-8 w-8 p-0 hover:bg-slate-800/50 text-gray-400 hover:text-gray-200"
                            >
                                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        )}
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(value, fieldKey)} 
                            className="h-8 w-8 p-0 hover:bg-slate-800/50 text-gray-400 hover:text-gray-200"
                        >
                            {copied === fieldKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const Field = ({ label, value, isSecret = false, fieldKey, isMultiline = false }: any) => {
        if (!value) return null;

        const isVisible = !isSecret || visibleFields[fieldKey];

        return (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <div className="relative">
                    {isMultiline ? (
                        <div className={`block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200 font-mono whitespace-pre-wrap break-all ${!isVisible ? 'h-10 truncate' : ''}`}>
                            {isVisible ? value : '••••••••••••••••••••••••'}
                        </div>
                    ) : (
                        <div className={`block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200 font-mono break-all ${!isVisible ? 'truncate' : ''}`}>
                            {isVisible ? value : '••••••••••••••••'}
                        </div>
                    )}

                    <div className="absolute top-1 right-1 flex items-center">
                        {isSecret && (
                            <Button variant="ghost" size="sm" onClick={() => toggleVisibility(fieldKey)} className="h-7 w-7 p-0 mr-1">
                                {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                <span className="sr-only">{isVisible ? 'Hide' : 'Show'}</span>
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(value, fieldKey)} className="h-7 w-7 p-0">
                            {copied === fieldKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            <span className="sr-only">Copy</span>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    if (!data) return <div className="text-gray-500 italic">No details available.</div>;

    const navigateToEdit = () => {
        if (typeof window !== 'undefined') {
            window.location.href = window.location.pathname + '/edit';
        }
    };

    return (
        <div className="space-y-6">
            {/* PASSWORD TYPE */}
            {type === 'PASSWORD' && (
                <>
                    <Field label="Username" value={data.username} fieldKey="username" />
                    <Field label="Password" value={data.password} isSecret fieldKey="password" />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Host" value={data.host} fieldKey="host" />
                        <Field label="Port" value={data.port} fieldKey="port" />
                    </div>
                </>
            )}

            {/* API / OAUTH TYPE - MATCHING SAMPLE SCREENSHOT */}
            {type === 'API_OAUTH' && (
                <div className="space-y-4">
                    {/* Inner Content Card Header */}
                    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xs">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                                    <Key className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-bold text-white">OAuth 2.0 Client Credentials</h3>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">
                                ACTIVE
                            </span>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <StyledField label="Client ID" value={data.clientId} fieldKey="clientId" />
                            <StyledField label="Client Secret" value={data.clientSecret} isSecret fieldKey="clientSecret" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <StyledField label="Token Endpoint" value={data.tokenEndpoint} fieldKey="tokenEndpoint" />
                            <StyledField label="Scope" value={data.scope || data.scopes} fieldKey="scope" />
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
                                        value={data.grantType?.toLowerCase() === 'client_credentials' || !data.grantType ? 'Client Credentials' : data.grantType}
                                        readOnly
                                        disabled
                                        className="block w-full bg-slate-950/20 border border-slate-800/80 rounded-lg px-3 py-2.5 text-xs text-gray-500 font-mono select-none cursor-not-allowed"
                                    />
                                </div>

                                {/* Grant Transmission */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Grant Transmission</label>
                                    <div className="relative">
                                        <select disabled className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-gray-400 appearance-none font-mono">
                                            <option>{data.grantTypeTransmission?.toLowerCase() === 'url' ? 'URL Query Parameter' : 'Request Body (Recommended)'}</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                            <ChevronRight className="h-3 w-3 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Client Authentication */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Client Authentication</label>
                                    <div className="relative">
                                        <select disabled className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-gray-400 appearance-none font-mono">
                                            <option>{data.clientAuthentication?.toLowerCase() === 'body' ? 'Request Body Payload' : 'HTTP Basic Auth Header (Recommended)'}</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                            <ChevronRight className="h-3 w-3 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* HTTP Content-Type */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">HTTP Content-Type</label>
                                    <div className="relative">
                                        <select disabled className="block w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-gray-400 appearance-none font-mono">
                                            <option>{data.contentType?.toLowerCase() === 'application_json' ? 'application/json' : 'application/x-www-form-urlencoded'}</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                            <ChevronRight className="h-3 w-3 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resource & Audience Fields */}
                            {(data.resource || data.audience) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <StyledField label="Resource" value={data.resource} fieldKey="resource" />
                                    <StyledField label="Audience Claim" value={data.audience} fieldKey="audience" />
                                </div>
                            )}
                        </div>
                    </details>

                    {/* Accordion 2: Custom Parameters */}
                    <details className="group border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-900/25 transition-colors list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-200">
                                <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                                Custom Parameters {Array.isArray(data.customParameters) && `(${data.customParameters.length})`}
                            </div>
                        </summary>
                        <div className="px-5 pb-5 pt-3 border-t border-slate-800 bg-slate-950/10">
                            {(!Array.isArray(data.customParameters) || data.customParameters.length === 0) ? (
                                <div className="text-center py-4 text-xs text-gray-500 italic">No custom parameters configured.</div>
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
                                            {data.customParameters.map((param: any, idx: number) => {
                                                const isParamVisible = visibleParams[idx];
                                                const copyKey = `custom_param_${idx}`;
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-900/20 font-mono">
                                                        <td className="py-3 px-3 text-gray-200 font-semibold">{param.name}</td>
                                                        <td className="py-3 px-3">
                                                            <span className="break-all">
                                                                {isParamVisible ? param.value : '••••••••••••••••'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                                                param.location === 'URL' 
                                                                    ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' 
                                                                    : (param.location === 'HEADER' 
                                                                        ? 'bg-blue-950/30 text-blue-400 border-blue-900/40' 
                                                                        : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40')
                                                            }`}>
                                                                {param.location === 'URL' ? 'URL Query' : (param.location === 'HEADER' ? 'HTTP Header' : 'Request Body')}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {/* Reveal Eye Icon */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleParamVisibility(idx)}
                                                                    className="p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-gray-200 transition-colors"
                                                                >
                                                                    {isParamVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                                </button>
                                                                {/* Copy Icon */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(param.value, copyKey)}
                                                                    className="p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-gray-200 transition-colors"
                                                                >
                                                                    {copied === copyKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                                                </button>
                                                                {/* Edit Icon */}
                                                                <button
                                                                    type="button"
                                                                    onClick={navigateToEdit}
                                                                    className="p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-gray-200 transition-colors"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                {/* Delete Icon */}
                                                                <button
                                                                    type="button"
                                                                    onClick={navigateToEdit}
                                                                    className="p-1 hover:bg-slate-800 rounded text-gray-400 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Add parameter link */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80">
                                <button
                                    type="button"
                                    onClick={navigateToEdit}
                                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    + Add Parameter
                                </button>
                            </div>
                        </div>
                    </details>

                    {/* Accordion 3: Legacy Configuration (Optional fallback fields) */}
                    {(data.apiKey || data.authEndpoint) && (
                        <details className="group border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-900/25 transition-colors list-none [&::-webkit-details-marker]:hidden">
                                <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-200">
                                    <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                                    Legacy Configuration
                                </div>
                            </summary>
                            <div className="px-5 pb-5 pt-3 border-t border-slate-800 bg-slate-950/10 space-y-4">
                                {data.authEndpoint && (
                                    <StyledField label="Authorization Endpoint (Legacy)" value={data.authEndpoint} fieldKey="authEndpoint" />
                                )}
                                {data.apiKey && (
                                    <StyledField label="Standalone API Key / Fallback" value={data.apiKey} isSecret fieldKey="apiKey" />
                                )}
                            </div>
                        </details>
                    )}

                    {/* Accordion 4: Audit Information */}
                    <details className="group border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-900/25 transition-colors list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-200">
                                <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                                Audit Information
                            </div>
                        </summary>
                        <div className="px-5 pb-5 pt-3 border-t border-slate-800 bg-slate-950/10 text-xs text-gray-400 space-y-2 font-mono">
                            <div><span className="text-gray-500">Flow Version:</span> <span className="text-gray-300">2.0</span></div>
                            <div><span className="text-gray-500">Security Cipher:</span> <span className="text-emerald-400">AES-256-GCM (Authenticated)</span></div>
                        </div>
                    </details>
                </div>
            )}

            {/* KEY / CERT TYPE */}
            {type === 'KEY_CERT' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Key Type" value={data.keyType} fieldKey="keyType" />
                        <Field label="Format" value={data.keyFormat} fieldKey="keyFormat" />
                    </div>
                    <Field label="Passphrase" value={data.passphrase} isSecret fieldKey="passphrase" />

                    {/* Private Key Section */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Private Key</label>
                            {data.privateKey && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(data.privateKey, data.privateKeyFileName || `${data.name ? data.name.replace(/\s+/g, '_') : 'private'}-private.pem`)}
                                    className="h-7 text-xs flex items-center gap-1"
                                    title="Download Private Key"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download</span>
                                </Button>
                            )}
                        </div>
                        <Field label="" value={data.privateKey} isSecret isMultiline fieldKey="privateKey" />
                    </div>

                    {/* Public Key Section */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Public Key</label>
                            {data.publicKey && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(data.publicKey, data.publicKeyFileName || `${data.name ? data.name.replace(/\s+/g, '_') : 'public'}-public.pem`)}
                                    className="h-7 text-xs flex items-center gap-1"
                                    title="Download Public Key"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download</span>
                                </Button>
                            )}
                        </div>
                        <Field label="" value={data.publicKey} isMultiline fieldKey="publicKey" />
                    </div>

                    <Field label="Expiry" value={data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : null} fieldKey="expiryDate" />
                </>
            )}

            {/* TOKEN TYPE */}
            {type === 'TOKEN' && (
                <>
                    <Field label="Token" value={data.token} isSecret isMultiline fieldKey="token" />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Type" value={data.tokenType} fieldKey="tokenType" />
                        <Field label="Expires" value={data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : null} fieldKey="expiryDate" />
                    </div>
                </>
            )}

            {/* SECURE NOTE */}
            {type === 'SECURE_NOTE' && (
                <Field label="Secure Note" value={data.note} isSecret isMultiline fieldKey="note" />
            )}

            {/* FILE */}
            {type === 'FILE' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="File Name" value={data.fileName} fieldKey="fileName" />
                        <Field label="File Type" value={data.fileType} fieldKey="fileType" />
                    </div>
                    {/* Display file content if available (text files) */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">File Content</label>
                            {data.fileContent && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadFile(data.fileContent, data.fileName || `${data.name ? data.name.replace(/\s+/g, '_') : 'file'}.txt`)}
                                    className="h-7 text-xs flex items-center gap-1"
                                    title="Download File"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download</span>
                                </Button>
                            )}
                        </div>
                        <Field label="" value={data.fileContent} isSecret isMultiline fieldKey="fileContent" />
                    </div>
                </>
            )}
        </div>
    );
}
