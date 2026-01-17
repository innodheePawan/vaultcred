'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CredentialSecrets({ type, data }: { type: string, data: any }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const SecretField = ({ label, value, isVisible, onToggle, fieldKey }: any) => {
        if (!value) return null;

        return (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <div className="relative">
                    <div className={`block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200 font-mono break-all ${!isVisible ? 'truncate' : ''}`}>
                        {isVisible ? value : '••••••••••••••••'}
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                        <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{isVisible ? 'Hide' : 'Show'}</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(value, fieldKey)} className="h-8 w-8 p-0 ml-1">
                            {copied === fieldKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            <span className="sr-only">Copy</span>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const TextAreaField = ({ label, value, isVisible, onToggle, fieldKey }: any) => {
        if (!value) return null;

        return (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <div className="relative">
                    {isVisible ? (
                        <pre className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200 font-mono whitespace-pre-wrap break-all min-h-[100px]">
                            {value}
                        </pre>
                    ) : (
                        <div className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200 font-mono truncate">
                            ••••••••••••••••••••••••
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center">
                        <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0 bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700">
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(value, fieldKey)} className="h-8 w-8 p-0 ml-1 bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700">
                            {copied === fieldKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {data.username && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                    <div className="relative flex items-center">
                        <div className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200">
                            {data.username}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(data.username, 'username')} className="absolute right-1 h-8 w-8 p-0">
                            {copied === 'username' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            )}

            {data.password && (
                <SecretField
                    label={type === 'SSH' ? 'Passphrase' : 'Password'}
                    value={data.password}
                    isVisible={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    fieldKey="password"
                />
            )}

            {data.key && (
                <TextAreaField
                    label={type === 'SSH' ? 'Private Key' : 'API Key / Token'}
                    value={data.key}
                    isVisible={showKey}
                    onToggle={() => setShowKey(!showKey)}
                    fieldKey="key"
                />
            )}
        </div>
    );
}
