'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Edit, Shield, Ban, CheckCircle, RefreshCw, Loader2, Copy } from 'lucide-react';
import InviteUserDialog from './InviteUserDialog';
import EditUserDialog from './EditUserDialog';
import StatusConfirmationDialog from './StatusConfirmationDialog';
import { resendInvite } from '@/lib/actions/admin';

const GROUP_COLORS = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
    // 'bg-purple-100' ... Removed to reserve purple for Super Admin or re-added if needed but careful
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-800',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800',
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-800',
];

const getGroupColor = (name: string) => {
    // Specific Overrides
    if (name.toLowerCase().includes('auditor')) {
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600';
    }
    if (name.toLowerCase().includes('super admin')) {
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800';
    }

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GROUP_COLORS.length;
    return GROUP_COLORS[index];
};

export default function UserTable({ users, invites, groups, inviteUserAction, isSystemAdmin, canInvite }: any) {
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [statusUser, setStatusUser] = useState<any>(null);
    const [resendingId, setResendingId] = useState<string | null>(null);

    const handleResend = async (inviteId: string) => {
        setResendingId(inviteId);
        try {
            const result = await resendInvite(inviteId);
            if (result.success) {
                alert(result.message);
            } else {
                alert(result.error || 'Failed to resend');
            }
        } catch (e) {
            alert('An error occurred');
        } finally {
            setResendingId(null);
        }
    };

    // Filter Users
    const filteredUsers = users.filter((u: any) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredInvites = invites.filter((i: any) =>
        i.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                        placeholder="Search users or invites..."
                        className="pl-8 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-auto">
                    {/* Only show Invite button if authorized (System Admin or Scoped Admin) */}
                    {inviteUserAction && (canInvite || isSystemAdmin) && (
                        <InviteUserDialog groups={groups} action={inviteUserAction} />
                    )}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">All Users</h3>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-900">
                            <TableRow>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</TableHead>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</TableHead>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Groups</TableHead>
                                <TableHead className="relative px-6 py-3"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Active Users */}
                            {filteredUsers.map((user: any) => (
                                <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <TableCell className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                                                {user.name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'Unknown'}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                {user.status}
                                            </span>
                                            {/* Quick Status Action */}
                                            {user.status === 'ACTIVE' ? (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => setStatusUser(user)} title="Deactivate User">
                                                    <Ban className="h-3 w-3" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-green-600" onClick={() => setStatusUser(user)} title="Activate User">
                                                    <CheckCircle className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {user.role === 'ADMIN' ? (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                                                By Role: SUPER ADMIN
                                            </span>
                                        ) : (
                                            <div className="flex flex-col gap-1 items-start">
                                                {user.userGroups.length > 0 ? user.userGroups.map((ug: any) => (
                                                    <div key={ug.groupId} className={`flex flex-col items-start rounded-full px-3 py-1 border ${getGroupColor(ug.group.name)}`}>
                                                        <span className="font-bold text-xs">{ug.group.name}</span>
                                                        {(ug.scopedCategories || ug.scopedEnvironments) && (
                                                            <span className="text-[10px] opacity-80 mt-0.5">
                                                                {[
                                                                    ug.scopedCategories ? `Cat: ${ug.scopedCategories}` : null,
                                                                    ug.scopedEnvironments ? `Env: ${ug.scopedEnvironments}` : null
                                                                ].filter(Boolean).join(' | ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                )) : <span className="text-gray-400 italic">No Group Assigned</span>}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                                            <Edit className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Pending Invites */}
                            {filteredInvites.map((invite: any) => (
                                <TableRow key={invite.id} className="bg-yellow-50/50 dark:bg-yellow-900/10">
                                    <TableCell className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-600 dark:text-yellow-300">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">Invited User</div>
                                                <div className="text-sm text-gray-500">{invite.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            INVITED
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        -
                                    </TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 items-center">
                                            <span className="text-xs text-gray-500 italic mr-2">
                                                Email Sent
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleResend(invite.id)}
                                                disabled={resendingId === invite.id}
                                                title="Resend Invitation Email"
                                            >
                                                {resendingId === invite.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                                ) : (
                                                    <RefreshCw className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {(filteredUsers.length === 0 && filteredInvites.length === 0) && (
                        <div className="text-center py-12 text-gray-500">
                            No users found matching "{search}"
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            {editingUser && (
                <EditUserDialog
                    user={editingUser}
                    groups={groups}
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                />
            )}

            {/* Status Confirmation Dialog */}
            {statusUser && (
                <StatusConfirmationDialog
                    user={statusUser}
                    open={!!statusUser}
                    onOpenChange={(open) => !open && setStatusUser(null)}
                />
            )}
        </div>
    );
}
