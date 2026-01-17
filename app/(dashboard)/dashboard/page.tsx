import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Key, Shield, UserPlus, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

async function getDashboardStats(userId: string) {
  const [credentialCount, sharedCount, recentActivity] = await Promise.all([
    prisma.credential.count({ where: { ownerId: userId } }),
    prisma.credentialShare.count({ where: { userId } }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: { user: true, credential: true }
    })
  ]);

  return { credentialCount, sharedCount, recentActivity };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const stats = await getDashboardStats(session.user.id);
  const isAdmin = session.user.role === 'ADMIN';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Welcome back, {session.user.name}
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Key className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">My Credentials</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.credentialCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/credentials" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Shared with Me</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.sharedCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link href="/credentials" className="font-medium text-indigo-600 hover:text-indigo-500">
                View shared
              </Link>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserPlus className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Admin Actions</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">Invite Users</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/invites" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Manage Invites
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Recent System Activity
          </h3>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {stats.recentActivity.map((log) => (
            <li key={log.id} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">{log.user?.name || log.user?.email || 'System'}</span>
                  {' '}
                  <span className="text-gray-500 dark:text-gray-400">
                    {log.action.toLowerCase().replace('_', ' ')}
                  </span>
                  {' '}
                  {log.credential?.name && <span className="font-medium">on {log.credential.name}</span>}
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {log.details}
              </div>
            </li>
          ))}
          {stats.recentActivity.length === 0 && (
            <li className="px-5 py-4 text-sm text-gray-500 text-center">No recent activity.</li>
          )}
        </ul>
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 rounded-b-lg">
          <div className="text-sm">
            <Link href={isAdmin ? "/admin/audit" : "#"} className={isAdmin ? "font-medium text-indigo-600 hover:text-indigo-500" : "text-gray-400 cursor-not-allowed"}>
              {isAdmin ? "View full audit log" : "Audit log restricted to Admins"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
