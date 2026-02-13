import { auth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/actions/dashboard';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const stats = await getDashboardStats();

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
      <DashboardGrid
        stats={stats}
        userRole={session.user.role}
        userName={session.user.name?.split(' ')[0] || 'there'}
      />
    </div>
  );
}
