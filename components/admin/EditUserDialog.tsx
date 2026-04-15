'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { updateUser } from '@/lib/actions/admin';
import { AlertCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const initialState: any = {
    message: null,
    error: null,
    success: false
};

interface EditUserDialogProps {
    user: any;
    groups: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export default function EditUserDialog({ user, groups, credentials, open, onOpenChange, currentUserId }: any) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(
        async (prev: any, formData: FormData) => {
            return updateUser(user.id, formData);
        },
        initialState as any
    );

    const isExternal = user.isExternal;
    const isSelfEdit = user.id === currentUserId;

    // Initial values for Internal Users (Group Based)
    const assignedGroupIds = user.userGroups?.map((ug: any) => ug.groupId) || [];
    const internalMapping = user.userGroups?.[0]; // Single group support for now

    // Initial values for External Users (Direct on User)
    const externalCats = user.allowedCategories ? user.allowedCategories.split(',') : [];
    const externalEnvs = user.allowedEnvironments ? user.allowedEnvironments.split(',') : [];
    const externalCredIds = user.allowedCredentialIds ? user.allowedCredentialIds.split(',') : [];

    // Unified Init State
    const initialCats = isExternal ? externalCats : (internalMapping?.scopedCategories ? internalMapping.scopedCategories.split(',') : []);
    const initialEnvs = isExternal ? externalEnvs : (internalMapping?.scopedEnvironments ? internalMapping.scopedEnvironments.split(',') : []);

    const isSuper = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const [roleCategory, setRoleCategory] = useState<'SUPER_ADMIN' | 'SCOPED'>(isSuper ? 'SUPER_ADMIN' : 'SCOPED');
    const [scopedRole, setScopedRole] = useState<string>(!isSuper && user.role ? user.role : 'USER');

    const [selectedCats, setSelectedCats] = useState<string[]>(initialCats);
    const [selectedEnvs, setSelectedEnvs] = useState<string[]>(initialEnvs);

    // Vendor Specific State
    const [externalAccessType, setExternalAccessType] = useState<'VIEW' | 'CREATE'>(user.externalAccessType || 'VIEW');
    const [selectedCredIds, setSelectedCredIds] = useState<string[]>(externalCredIds);
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ['Application', 'Infra', 'Integration'];
    const environments = ['Dev', 'QA', 'Prod'];

    useEffect(() => {
        if (state?.success) {
            // Close dialog after short delay
            setTimeout(() => {
                onOpenChange(false);
                router.refresh();
            }, 1500);
        }
    }, [state?.success, onOpenChange, router]);

    // Filtered credentials for search
    const filteredCredentials = credentials?.filter((cred: any) =>
        !selectedCredIds.includes(cred.id) &&
        (cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cred.environment?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit User: {user.name || user.email}</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        {isExternal ? 'Modify External Vendor settings and permissions.' : 'Modify user role, status, and group assignments.'}
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="space-y-6 mt-4">

                    {/* Common Status Field */}
                    <div className="flex justify-between gap-4">
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <select
                                name="status"
                                defaultValue={user.status}
                                disabled={isSelfEdit}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm sm:text-sm px-3 py-2 disabled:opacity-50"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive (Login Disabled)</option>
                                <option value="INVITED" disabled>Invited (Pending)</option>
                            </select>
                        </div>
                    </div>

                    {isSelfEdit && (
                        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">You are editing your own profile</h3>
                                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                                        <p>Self-modification of roles, scopes, and status is disabled for security reasons.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= EXTERNAL USER UI ================= */}
                    {isExternal && (
                        <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider mb-2 border-b border-amber-200 pb-1">
                                Vendor Configuration
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="vendorName" className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                        Vendor Name
                                    </label>
                                    <input
                                        type="text"
                                        name="vendorName"
                                        defaultValue={user.vendorName || ''}
                                        required
                                        className="mt-1 block w-full rounded-md border-amber-200 dark:border-amber-800 dark:bg-gray-900 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="accessExpiresAt" className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                        Access Expiry
                                    </label>
                                    <input
                                        type="date"
                                        name="accessExpiresAt"
                                        defaultValue={user.accessExpiresAt ? new Date(user.accessExpiresAt).toISOString().split('T')[0] : ''}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="mt-1 block w-full rounded-md border-amber-200 dark:border-amber-800 dark:bg-gray-900 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
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

                            {/* Specific Credentials Selection */}
                            <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Specific Credential Access
                                </label>

                                {selectedCredIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {selectedCredIds.map(id => {
                                            const cred = credentials?.find((c: any) => c.id === id) || { name: 'Unknown Credential', id };
                                            return (
                                                <div key={id} className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded text-[10px] font-medium border border-amber-200 dark:border-amber-800">
                                                    <span>{cred.name}</span>
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

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search credentials to add..."
                                        className="block w-full rounded-md border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                    {searchTerm && filteredCredentials.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                            {filteredCredentials.map((cred: any) => (
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
                                                    <span className="text-[9px] text-gray-500">{cred.type} | {cred.category}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Creator Scopes */}
                            {externalAccessType === 'CREATE' && (
                                <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-900/20">
                                    <label className="block text-xs font-bold text-gray-900 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Scopes (for creation)
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Categories</span>
                                            <div className="space-y-1">
                                                {categories.map(cat => (
                                                    <label key={cat} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCats.includes(cat)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedCats([...selectedCats, cat]);
                                                                else setSelectedCats(selectedCats.filter(c => c !== cat));
                                                            }}
                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                                                        />
                                                        <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">{cat}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <input type="hidden" name="scopedCategories" value={selectedCats.join(',')} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Environments</span>
                                            <div className="space-y-1">
                                                {environments.map(env => (
                                                    <label key={env} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEnvs.includes(env)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedEnvs([...selectedEnvs, env]);
                                                                else setSelectedEnvs(selectedEnvs.filter(e => e !== env));
                                                            }}
                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                                                        />
                                                        <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">{env}</span>
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

                    {/* ================= INTERNAL USER UI ================= */}
                    {!isExternal && (
                        <>
                            {/* System Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    System Role
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="roleCategory"
                                            value="SUPER_ADMIN"
                                            checked={roleCategory === 'SUPER_ADMIN'}
                                            onChange={() => setRoleCategory('SUPER_ADMIN')}
                                            disabled={isSelfEdit}
                                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Super Admin</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="roleCategory"
                                            value="SCOPED"
                                            checked={roleCategory === 'SCOPED'}
                                            onChange={() => setRoleCategory('SCOPED')}
                                            disabled={isSelfEdit}
                                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Scoped User</span>
                                    </label>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Super Admin has full access to everything. Scoped roles are limited by Group and Scope.
                                </p>
                            </div>

                            {roleCategory === 'SCOPED' && (
                                <>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Scoped Role</label>
                                        <select
                                            value={scopedRole}
                                            onChange={(e) => setScopedRole(e.target.value)}
                                            disabled={isSelfEdit}
                                            className="w-full text-black p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 disabled:opacity-50"
                                        >
                                            <option value="SCOPED_ADMIN">Administrator</option>
                                            <option value="USER">User</option>
                                            <option value="VIEWER">Viewer</option>
                                            <option value="AUDITOR">Auditor</option>
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500">
                                            This selects the baseline feature permissions across the platform.
                                        </p>
                                    </div>



                                    {/* Scopes */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scoped Categories</label>
                                            <span className="text-xs text-gray-500 block mb-2">Leave empty for ALL</span>
                                            <div className="space-y-2">
                                                {['Application', 'Infra', 'Integration'].map(cat => (
                                                    <label key={cat} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCats.includes(cat)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedCats([...selectedCats, cat]);
                                                                else setSelectedCats(selectedCats.filter(c => c !== cat));
                                                            }}
                                                            disabled={scopedRole === 'AUDITOR' || isSelfEdit}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 disabled:opacity-50"
                                                        />
                                                        <span className={`ml-2 text-sm transition-colors ${scopedRole === 'AUDITOR' ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{cat}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <input type="hidden" name="scopedCategories" value={selectedCats.join(',')} />
                                        </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scoped Environments</label>
                                                <span className="text-xs text-gray-500 block mb-2">Leave empty for ALL</span>
                                                <div className="space-y-2">
                                                    {['Dev', 'QA', 'Prod'].map(env => (
                                                        <label key={env} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEnvs.includes(env)}
                                                                onChange={(e) => {
                                                                if (e.target.checked) setSelectedEnvs([...selectedEnvs, env]);
                                                                    else setSelectedEnvs(selectedEnvs.filter(e => e !== env));
                                                                }}
                                                                disabled={scopedRole === 'AUDITOR' || isSelfEdit}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 disabled:opacity-50"
                                                            />
                                                            <span className={`ml-2 text-sm transition-colors ${scopedRole === 'AUDITOR' ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{env}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <input type="hidden" name="scopedEnvironments" value={selectedEnvs.join(',')} />
                                            </div>
                                        </div>
                                    </>
                            )}
                                </>
                            )}

                            <div className="hidden">
                                <input type="hidden" name="systemRole" value={isExternal ? 'USER' : (roleCategory === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : scopedRole)} />
                            </div>

                            {state?.error && (
                                <div className="rounded-md bg-red-50 p-4 flex gap-2 text-red-800 text-sm">
                                    <AlertCircle className="w-5 h-5" /> {state.error}
                                </div>
                            )}
                            {state?.success && (
                                <div className="rounded-md bg-green-50 p-4 flex gap-2 text-green-800 text-sm">
                                    <Check className="w-5 h-5" /> {state.message}
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
                            </DialogFooter>
                        </form>
            </DialogContent>
        </Dialog>
    );
}
