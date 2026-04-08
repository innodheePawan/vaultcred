import { getUsersAndInvites, getAllGroups, inviteUser, getAllCredentialsSummary } from '@/lib/actions/admin';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserTable from '@/components/admin/UserTable';

export default async function UserManagementPage(props: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const session = await auth();
    const ctx = session?.user?.id ? await getSafeUserContext(session.user.id) : null;
    if (!ctx || !canAccess(ctx, 'FEATURE:ADMIN_USERS_GROUPS', 'VIEW')) redirect('/dashboard');

    const searchParams = await props.searchParams;
    const pageNum = searchParams.page ? parseInt(searchParams.page, 10) : 1;
    const limitNum = searchParams.limit ? parseInt(searchParams.limit, 10) : 10;

    const { users, invites, isSystemAdmin, canInvite } = await getUsersAndInvites(pageNum, limitNum);
    const groups = await getAllGroups();
    const credentials = await getAllCredentialsSummary();

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
                credentials={credentials}
                inviteUserAction={inviteUser}
                isSystemAdmin={isSystemAdmin}
                canInvite={canInvite}
            />
        </div>
    );
}
