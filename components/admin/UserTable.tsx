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
import { Search, MoreVertical, Edit, Shield, Copy, Ban, CheckCircle } from 'lucide-react';
import InviteUserDialog from './InviteUserDialog';
import EditUserDialog from './EditUserDialog';
import StatusConfirmationDialog from './StatusConfirmationDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UserTable({ users, invites, groups, inviteUserAction, isSystemAdmin, canInvite }: any) {
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [statusUser, setStatusUser] = useState<any>(null);

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
                                            <div className="flex flex-col gap-1">
                                                {user.userGroups.length > 0 ? user.userGroups.map((ug: any) => (
                                                    <div key={ug.groupId} className="flex flex-col items-start bg-gray-100 dark:bg-gray-700/50 rounded px-2 py-1">
                                                        <span className="font-medium text-gray-900 dark:text-gray-200">{ug.group.name}</span>
                                                        {(ug.scopedCategories || ug.scopedEnvironments) && (
                                                            <span className="text-xs text-gray-500">
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
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded select-all max-w-[100px] truncate">
                                                {invite.token}
                                            </span>
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
                                                // Ideally show toast
                                            }}>
                                                <Copy className="w-4 h-4 text-gray-500 hover:text-gray-700" />
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
