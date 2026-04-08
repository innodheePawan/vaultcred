'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle } from 'lucide-react';

const initialState: any = {
    message: null,
    error: null,
    token: null,
    success: false
};

export default function InviteUserForm({ groups, credentials, action }: { groups: any[], credentials: any[], action: any }) {
    const [state, formAction, isPending] = useActionState(action, initialState as any);
    const [roleCategory, setRoleCategory] = useState<'SUPER_ADMIN' | 'SCOPED'>('SCOPED');
    const [scopedRole, setScopedRole] = useState<string>('USER');
    const [isExternal, setIsExternal] = useState(false);
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);
    const [selectedCredIds, setSelectedCredIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [externalAccessType, setExternalAccessType] = useState<'VIEW' | 'CREATE'>('VIEW');

    const categories = ['Application', 'Infra', 'Integration'];
    const environments = ['Dev', 'QA', 'Prod'];

    // Filtered credentials based on search
    const filteredCredentials = credentials.filter(cred =>
        !selectedCredIds.includes(cred.id) &&
        (cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.environment?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <form action={formAction} className="space-y-4">
            {/* External User Toggle */}
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">External Vendor Access</span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400">Restricted, time-bound access for 3rd parties.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        name="isExternal"
                        checked={isExternal}
                        onChange={(e) => {
                            setIsExternal(e.target.checked);
                            if (e.target.checked) {
                                setRoleCategory('SCOPED');
                                setScopedRole('USER');
                                setExternalAccessType('VIEW');
                                setSelectedCats([]);
                                setSelectedEnvs([]);
                            }
                        }}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            {/* Vendor Details (Only for External) */}
            {isExternal && (
                <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="vendorName" className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                                Vendor / Partner Name
                            </label>
                            <input
                                type="text"
                                name="vendorName"
                                id="vendorName"
                                required
                                className="mt-1 block w-full rounded-md border-amber-200 dark:border-amber-800 dark:bg-gray-900 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm px-3 py-2"
                                placeholder="e.g. AWS Support Team"
                            />
                        </div>

                        <div>
                            <label htmlFor="accessExpiresAt" className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                                Access Expiry Date
                            </label>
                            <input
                                type="date"
                                name="accessExpiresAt"
                                id="accessExpiresAt"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="mt-1 block w-full rounded-md border-amber-200 dark:border-amber-800 dark:bg-gray-900 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider mb-2">
                            Access Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="externalAccessType"
                                    value="VIEW"
                                    checked={externalAccessType === 'VIEW'}
                                    onChange={() => setExternalAccessType('VIEW')}
                                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">View-Only</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="externalAccessType"
                                    value="CREATE"
                                    checked={externalAccessType === 'CREATE'}
                                    onChange={() => setExternalAccessType('CREATE')}
                                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Create & View</span>
                            </label>
                        </div>
                    </div>

                    {/* Specific Credentials Selection - Searchable */}
                    {credentials && credentials.length > 0 && (
                        <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <label className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider mb-1">
                                Specific Credential Access (Searchable)
                            </label>
                            <p className="text-[10px] text-amber-600 dark:text-amber-500 mb-3">
                                Explicitly grant access to specific items.
                            </p>

                            {/* Selected Tags */}
                            {selectedCredIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedCredIds.map(id => {
                                        const cred = credentials.find(c => c.id === id);
                                        return (
                                            <div key={id} className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded text-[10px] font-medium border border-amber-200 dark:border-amber-800">
                                                <span>{cred?.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCredIds(selectedCredIds.filter(sid => sid !== id))}
                                                    className="ml-1 hover:text-amber-600 transition-colors"
                                                >
                                                    ×
                                                </button>
                                                <input type="hidden" name="credentialIds" value={id} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search credentials..."
                                    className="block w-full rounded-md border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                                />

                                {/* Search Results */}
                                {searchTerm && filteredCredentials.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                        {filteredCredentials.map(cred => (
                                            <button
                                                key={cred.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCredIds([...selectedCredIds, cred.id]);
                                                    setSearchTerm('');
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex flex-col border-b border-gray-100 dark:border-gray-700 last:border-0"
                                            >
                                                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{cred.name}</span>
                                                <span className="text-[9px] text-gray-500">{cred.type} | {cred.category} | {cred.environment}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {searchTerm && filteredCredentials.length === 0 && (
                                    <div className="absolute z-10 w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] text-gray-500 italic shadow-lg">
                                        No matching credentials found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Email for External */}
                    <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-900/20">
                        <label htmlFor="email_external" className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                            Vendor Email ID
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email_external"
                            required
                            className="mt-1 block w-full rounded-md border-amber-200 dark:border-amber-800 dark:bg-gray-900 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm px-3 py-2"
                            placeholder="vendor@company.com"
                        />
                    </div>

                    {/* Scopes for External - Only for CREATE */}
                    {externalAccessType === 'CREATE' && (
                        <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-900/20">
                            <label className="block text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider mb-3">
                                Creation Scopes
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase block mb-2">Categories</span>
                                    <div className="space-y-1.5">
                                        {categories.map(cat => (
                                            <label key={cat} className="flex items-center cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCats.includes(cat)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCats([...selectedCats, cat]);
                                                        else setSelectedCats(selectedCats.filter(c => c !== cat));
                                                    }}
                                                    className="h-3.5 w-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 group-hover:text-amber-700 transition-colors">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <input type="hidden" name="scopedCategories" value={selectedCats.join(',')} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase block mb-2">Environments</span>
                                    <div className="space-y-1.5">
                                        {environments.map(env => (
                                            <label key={env} className="flex items-center cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEnvs.includes(env)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedEnvs([...selectedEnvs, env]);
                                                        else setSelectedEnvs(selectedEnvs.filter(e => e !== env));
                                                    }}
                                                    className="h-3.5 w-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 group-hover:text-amber-700 transition-colors">{env}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <input type="hidden" name="scopedEnvironments" value={selectedEnvs.join(',')} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* System Role Selection - Hidden if External */}
            {!isExternal && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            System Role (Role-Based Access Control)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'SUPER_ADMIN', label: 'Super Admin' },
                                { id: 'SCOPED', label: 'Scoped User' }
                            ].map(category => (
                                <label key={category.id} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="roleCategory"
                                        value={category.id}
                                        checked={roleCategory === category.id}
                                        onChange={() => setRoleCategory(category.id as 'SUPER_ADMIN' | 'SCOPED')}
                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{category.label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Super Admin has full access to all resources automatically.
                        </p>
                    </div>

                    {roleCategory === 'SCOPED' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Scoped Role</label>
                            <select
                                value={scopedRole}
                                onChange={(e) => setScopedRole(e.target.value)}
                                className="w-full text-black p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
                            >
                                <option value="SCOPED_ADMIN">Administrator</option>
                                <option value="USER">User</option>
                                <option value="VIEWER">Viewer</option>
                                <option value="AUDITOR">Auditor</option>
                            </select>
                            <p className="mt-2 text-xs text-gray-500">
                                This role works in combination with the required group access and optional scopes below.
                            </p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            User Email ID
                        </label>
                        <div className="mt-1">
                            <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                                placeholder="user@company.com"
                            />
                        </div>
                    </div>

                    {roleCategory === 'SCOPED' && (
                <>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md border bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-xs font-bold text-gray-900 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Scoped Categories
                            </label>
                            <span className="text-[10px] text-gray-500 block mb-2">Leave empty for ALL</span>
                            <div className="space-y-1.5">
                                {categories.map(cat => (
                                    <label key={cat} className="flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedCats.includes(cat)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedCats([...selectedCats, cat]);
                                                else setSelectedCats(selectedCats.filter(c => c !== cat));
                                            }}
                                            disabled={scopedRole === 'AUDITOR'}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                        <span className={`ml-2 text-xs transition-colors ${scopedRole === 'AUDITOR' ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600'}`}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                            <input type="hidden" name="scopedCategories" value={selectedCats.join(',')} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-900 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Scoped Environments
                            </label>
                            <span className="text-[10px] text-gray-500 block mb-2">Leave empty for ALL</span>
                            <div className="space-y-1.5">
                                {environments.map(env => (
                                    <label key={env} className="flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedEnvs.includes(env)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedEnvs([...selectedEnvs, env]);
                                                else setSelectedEnvs(selectedEnvs.filter(e => e !== env));
                                            }}
                                            disabled={scopedRole === 'AUDITOR'}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                        <span className={`ml-2 text-xs transition-colors ${scopedRole === 'AUDITOR' ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600'}`}>{env}</span>
                                    </label>
                                ))}
                            </div>
                            <input type="hidden" name="scopedEnvironments" value={selectedEnvs.join(',')} />
                        </div>
                    </div>
                </>
            )}
        </div>
    )}

<div className="hidden">
    <input type="hidden" name="systemRole" value={isExternal ? 'USER' : (roleCategory === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : scopedRole)} />
</div>
{/* Feedback Messages */ }
{
    state?.error && (
        <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{state.error}</h3>
                </div>
            </div>
        </div>
    )
}

{
    state?.success && (
        <div className={`rounded-md p-4 ${state.warning ? 'bg-amber-50 border border-amber-200' : 'bg-green-50'}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    {state.warning ? (
                        <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    ) : (
                        <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                    )
                    }
                </div>
                <div className="ml-3">
                    <p className={`text-sm font-medium ${state.warning ? 'text-amber-800' : 'text-green-800'}`}>
                        {state.message}
                    </p>
                </div>
            </div>
        </div>
    )
}

<Button type="submit" disabled={isPending} className="w-full">
    {isPending ? 'Sending Invite...' : 'Send Invite'}
</Button>
        </form >
    );
}
