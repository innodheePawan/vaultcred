import { getUsersAndInvites, getAllGroups, inviteUser } from '@/lib/actions/admin';
import UserTable from '@/components/admin/UserTable';

export default async function UserManagementPage() {
    const { users, invites, isSystemAdmin, canInvite } = await getUsersAndInvites();
    const groups = await getAllGroups();

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        User Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage users, roles, and access groups.
                    </p>
                </div>
            </div>

            <UserTable
                users={users}
                invites={invites}
                groups={groups}
                inviteUserAction={inviteUser}
                isSystemAdmin={isSystemAdmin}
                canInvite={canInvite}
            />
        </div>
    );
}
