"use client";

import React, { useState } from 'react';
import { createApiClient, deleteApiClient, toggleApiClientStatus } from "@/lib/actions/api-clients";
import { Plus, Trash2, Copy, Check, Shield, Key, Power, PowerOff } from 'lucide-react';
import { PaginationControls } from '@/components/ui/PaginationControls';

function CustomMultiSelect({ options, selected, onChange, placeholder }: { options: string[], selected: string[], onChange: (val: string[]) => void, placeholder: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(x => x !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    const handleAddCustom = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                const val = inputValue.trim();
                if (!selected.includes(val)) onChange([...selected, val]);
                setInputValue('');
            }
        }
    };

    const displayOptions = Array.from(new Set(['*', ...options]));
    const filteredOptions = displayOptions.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()));

    return (
        <div className="relative z-20">
            <div 
                className="w-full min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 flex flex-wrap gap-2 items-center cursor-text relative z-20"
                onClick={() => setIsOpen(true)}
            >
                {selected.map(s => (
                    <span key={s} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {s === '*' ? 'All (*)' : s}
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleOption(s); }} className="hover:text-indigo-950 dark:hover:text-indigo-100">&times;</button>
                    </span>
                ))}
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleAddCustom}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                    placeholder={selected.length === 0 ? placeholder : ''}
                    onFocus={() => setIsOpen(true)}
                />
            </div>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
                    <div className="absolute z-30 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <div 
                                key={opt} 
                                onClick={(e) => { e.stopPropagation(); toggleOption(opt); setInputValue(''); }}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white transition-colors"
                            >
                                <input type="checkbox" checked={selected.includes(opt)} readOnly className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
                                <span>{opt === '*' ? 'All (*)' : opt}</span>
                            </div>
                        )) : null}
                        {inputValue.trim() && !displayOptions.some(o => o.toLowerCase() === inputValue.trim().toLowerCase()) && (
                            <div 
                                onClick={(e) => { e.stopPropagation(); toggleOption(inputValue.trim()); setInputValue(''); }}
                                className="px-3 py-2 text-sm cursor-pointer border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                + Add &quot;{inputValue.trim()}&quot; (Press Enter)
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}


export default function ApiClientsClient({ initialClients, availableScopes, currentLimit }: { initialClients: { data: any[], total: number, page: number, totalPages: number }, availableScopes: { categories: string[], environments: string[] }, currentLimit: number }) {
    const [clients, setClients] = useState(initialClients.data);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [tokenValiditySeconds, setTokenValiditySeconds] = useState(300);
    const [securityMode, setSecurityMode] = useState<'BASIC'|'SECURE'|'ENTERPRISE'>('BASIC');
    const [certificateThumbprint, setCertificateThumbprint] = useState('');
    const [selectedApps, setSelectedApps] = useState<string[]>(['*']);
    const [selectedEnvs, setSelectedEnvs] = useState<string[]>(['*']);
    const [allowFileDownload, setAllowFileDownload] = useState(false);

    const [newClientSecret, setNewClientSecret] = useState<{ clientId: string, secret: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                name,
                tokenValiditySeconds,
                securityMode,
                allowFileDownload,
                certificateThumbprint: (securityMode === 'SECURE' || securityMode === 'ENTERPRISE') ? certificateThumbprint : null,
                scopes: {
                    applications: selectedApps.includes('*') ? ['*'] : selectedApps,
                    environments: selectedEnvs.includes('*') ? ['*'] : selectedEnvs,
                    credentialTypes: ['*'],
                    accessMode: 'READ_ONLY'
                }
            };
            const result = await createApiClient(data);
            
            if (result.rawSecret) {
                setNewClientSecret({ clientId: result.client.clientId, secret: result.rawSecret });
                triggerDownload(result.client.clientId, result.rawSecret);
            } else {
                setNewClientSecret({ clientId: result.client.clientId, secret: 'No Secret Generated (mTLS Only)' });
                triggerDownload(result.client.clientId, 'No Secret Generated (mTLS Only)');
            }
            
            // Temporary UI optimism (normally handled by server action revalidate)
            setClients([{ ...result.client, scopesObj: data.scopes }, ...clients]);
            setIsCreateOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            alert("Failed to create API Client");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setTokenValiditySeconds(300);
        setSecurityMode('BASIC');
        setAllowFileDownload(false);
        setCertificateThumbprint('');
        setSelectedApps(['*']);
        setSelectedEnvs(['*']);
    };

    const triggerDownload = (clientId: string, clientSecret: string) => {
        const fileData = {
            oauth: {
                createdate: new Date().toISOString(),
                clientid: clientId,
                clientsecret: clientSecret,
                tokenurl: `${window.location.origin}/api/v1/auth/token`,
                url: `${window.location.origin}/api/v1`
            }
        };
        const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `api-client-${clientId.substring(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await toggleApiClientStatus(id, !currentStatus);
            setClients(clients.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this API Client? It will break any integrating applications immediately.")) return;
        try {
            await deleteApiClient(id);
            setClients(clients.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Key className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Active Configurations</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{clients.filter(c => c.isActive).length} Applications Connected</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Client</span>
                </button>
            </div>

            {newClientSecret && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-md relative shadow-sm">
                    <h3 className="text-amber-800 dark:text-amber-200 font-bold mb-2">Important: Save Your Credentials!</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                        This is the ONLY time the Client Secret will be displayed. Please copy it to a secure location.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <span className="text-xs font-semibold text-amber-800/70 dark:text-amber-200/70 uppercase">Client ID</span>
                            <div className="bg-white dark:bg-gray-900 p-2 rounded text-sm text-gray-800 dark:text-gray-200 font-mono select-all">
                                {newClientSecret.clientId}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-amber-800/70 dark:text-amber-200/70 uppercase">Client Secret</span>
                            <div className="flex items-center gap-2">
                                <div className="bg-white dark:bg-gray-900 p-2 rounded text-sm text-gray-800 dark:text-gray-200 font-mono select-all flex-1 overflow-x-auto">
                                    {newClientSecret.secret}
                                </div>
                                <button
                                    onClick={() => handleCopy(newClientSecret.secret)}
                                    className="p-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                    title="Copy Secret"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setNewClientSecret(null)}
                        className="mt-4 text-xs font-semibold px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-50 rounded"
                    >
                        I have saved these details
                    </button>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scopes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 relative">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {client.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{client.clientId}</div>
                                        <div className="text-xs mt-1">
                                            <span className="font-semibold text-gray-600 dark:text-gray-300">Mode: </span>
                                            <span className="text-indigo-600 dark:text-indigo-400">{client.securityMode || 'BASIC'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-gray-500">Apps:</span>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {(client.scopesObj?.applications || []).join(', ') || 'None'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-gray-500">Envs:</span>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {(client.scopesObj?.environments || []).join(', ') || 'None'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            client.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                        }`}>
                                            {client.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => handleToggle(client.id, client.isActive)}
                                                className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                title={client.isActive ? "Disable Client" : "Enable Client"}
                                            >
                                                {client.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(client.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete Client"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {clients.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No API clients configured. Click "Create Client" to issue a new integration token.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {initialClients.total > 0 && (
                <PaginationControls
                    currentPage={initialClients.page}
                    totalPages={initialClients.totalPages}
                    totalItems={initialClients.total}
                    currentLimit={currentLimit}
                />
            )}

            {/* Create Modal overlay */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
                            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                Register External Client
                            </h2>
                            <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="create-client-form" onSubmit={handleCreate} className="space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Client Details</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application / Client Name *</label>
                                        <input 
                                            required value={name} onChange={e => setName(e.target.value)} 
                                            placeholder="e.g. Jenkins CI, Ansible Tower, App Backend"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">JWT Token Validity (Sec)</label>
                                            <input 
                                                type="number" min="60" max="86400" required value={tokenValiditySeconds} onChange={e => setTokenValiditySeconds(Number(e.target.value))} 
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Default: 300s (5mins)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Binding */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Security Tiering & Policies</h3>
                                    
                                    <div className="flex items-center space-x-2 pt-2 pb-2">
                                        <input
                                            type="checkbox"
                                            id="allowFileDownload"
                                            checked={allowFileDownload}
                                            onChange={(e) => setAllowFileDownload(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-white border-gray-300 dark:border-gray-600 focus:ring-2"
                                        />
                                        <label htmlFor="allowFileDownload" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                            Allow Binary File Downloads (Overrides default explicit blocking)
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Security Mode *</label>
                                        <select 
                                            value={securityMode} 
                                            onChange={(e) => setSecurityMode(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="BASIC">BASIC (OAuth 2.0 Client Credentials strictly)</option>
                                            <option value="SECURE">SECURE (+ Required mTLS Identity Binding)</option>
                                            <option value="ENTERPRISE">ENTERPRISE (+ mTLS + Cryptographic Endpoint Response Signatures [HMAC])</option>
                                        </select>
                                    </div>

                                    {(securityMode === 'SECURE' || securityMode === 'ENTERPRISE') && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zero-Trust mTLS Binding</label>
                                            <input 
                                                required
                                                value={certificateThumbprint} onChange={e => setCertificateThumbprint(e.target.value)} 
                                                placeholder="Client Certificate Thumbprint (e.g. A1:B2...)"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Matches the `x-client-fingerprint` header injected by Reverse Proxies upon successful mTLS handoff.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Scopes */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Access Scopes (RBAC)</h3>
                                    <p className="text-xs text-gray-500 mb-2">Leave blank to deny all. Select "*" to allow all within category.</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-48">
                                        <div className="relative z-20">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allowed Applications</label>
                                            <CustomMultiSelect 
                                                options={availableScopes.categories}
                                                selected={selectedApps}
                                                onChange={setSelectedApps}
                                                placeholder="Select or type to create..."
                                            />
                                        </div>

                                        <div className="relative z-10">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allowed Environments</label>
                                            <CustomMultiSelect 
                                                options={availableScopes.environments}
                                                selected={selectedEnvs}
                                                onChange={setSelectedEnvs}
                                                placeholder="Select or type to create..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
                            <button 
                                type="button" 
                                onClick={() => setIsCreateOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="create-client-form"
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? 'Registering...' : 'Register Client'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
