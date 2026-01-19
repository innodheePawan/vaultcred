'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CredentialSecrets({ type, data }: { type: string, data: any }) {
    // data is the 'details' object from getCredentialById

    const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
    const [copied, setCopied] = useState<string | null>(null);

    const toggleVisibility = (field: string) => {
        setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
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
    }

    if (!data) return <div className="text-gray-500 italic">No details available.</div>;

    return (
        <div className="space-y-4">
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

            {/* API / OAUTH TYPE */}
            {type === 'API_OAUTH' && (
                <>
                    <Field label="Client ID" value={data.clientId} fieldKey="clientId" />
                    <Field label="Client Secret" value={data.clientSecret} isSecret fieldKey="clientSecret" />
                    <Field label="API Key" value={data.apiKey} isSecret isMultiline fieldKey="apiKey" />
                    <Field label="Token Endpoint" value={data.tokenEndpoint} fieldKey="tokenEndpoint" />
                    <Field label="Auth Endpoint" value={data.authEndpoint} fieldKey="authEndpoint" />
                    <Field label="Scopes" value={data.scopes} fieldKey="scopes" />
                </>
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
                    <Field label="File Content" value={data.fileContent} isSecret isMultiline fieldKey="fileContent" />
                </>
            )}
        </div>
    );
}
