import { auth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/actions/dashboard';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import { redirect } from 'next/navigation';
import { getUserAccessContext, canAccess } from '@/lib/iam/permissions';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const stats = await getDashboardStats();

  const accessContext = await getUserAccessContext(session.user.id);
  const isExternal = (session.user as any)?.isExternal;
  const isExternalViewOnly = isExternal && (session.user as any)?.externalAccessType === 'VIEW';

  let canCreate = false;
  if (!isExternalViewOnly) {
    if (accessContext.role === 'ADMIN' || accessContext.role === 'SUPER_ADMIN') {
      canCreate = true;
    } else {
      canCreate = canAccess(accessContext, 'FEATURE:CREDENTIALS', 'CREATE');
    }
  }

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
      <DashboardGrid
        stats={stats}
        userRole={session.user.role}
        userName={session.user.name?.split(' ')[0] || 'there'}
        canCreate={canCreate}
      />
    </div>
  );
}
