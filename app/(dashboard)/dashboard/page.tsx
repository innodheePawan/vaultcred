import { auth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/actions/dashboard';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const stats = await getDashboardStats();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back, {session.user.name}. Here is your credential overview.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-sm text-gray-500 font-medium">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <DashboardGrid stats={stats} userRole={session.user.role} />
    </div>
  );
}
