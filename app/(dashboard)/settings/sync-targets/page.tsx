import React from 'react';
import Link from 'next/link';
import { getSyncTargets, getSyncHistory } from '@/lib/actions/sync-targets';
import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import { Button } from '@/components/ui/button';
import {
  Plus,
  RefreshCw,
  Edit2,
  ListFilter,
  History,
  ShieldCheck,
} from 'lucide-react';
import StatusToggle from './StatusToggle';
import DeleteTargetButton from './DeleteTargetButton';
import CopyUrlButton from './CopyUrlButton';
import SyncHistoryTab from '@/components/admin/settings/SyncHistoryTab';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    targetId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function SyncTargetsPage({ searchParams }: PageProps) {
  const session = await auth();
  const ctx = await getSafeUserContext(session?.user?.id || '');
  const canCreate = canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'CREATE');
  const hasEditPermission = canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'EDIT');
  const canDelete = canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'DELETE');
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const isAuditorOrViewer = session?.user?.role === 'AUDITOR' || session?.user?.role === 'VIEWER';

  const isScoped = ctx.featurePermissions['SYNC_TARGETS'] === 'ALL_SCOPED';
  const isTargetWithinScope = (target: any) => {
    if (!isScoped) return true;
    const allowedCats = ctx.allowedCategories || [];
    const allowedEnvs = ctx.allowedEnvironments || [];
    const targetCats = Array.isArray(target.categories) ? (target.categories as string[]) : [];
    const targetEnvs = Array.isArray(target.environments) ? (target.environments as string[]) : [];
    const catOverlap = allowedCats.includes('*') || targetCats.some((c) => allowedCats.includes(c));
    const envOverlap = allowedEnvs.includes('*') || targetEnvs.some((e) => allowedEnvs.includes(e));
    return catOverlap && envOverlap;
  };

  const params = await searchParams;
  const tab = params.tab || 'targets';

  // Always fetch targets
  const targetsRes = await getSyncTargets();
  const targets = targetsRes.success && targetsRes.data ? targetsRes.data : [];

  let historyData: { data: any[]; total: number; page: number; totalPages: number } = { data: [], total: 0, page: 1, totalPages: 0 };
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;

  if (tab === 'history') {
    const historyRes = await getSyncHistory({
      page,
      limit,
      search: params.search,
      status: params.status,
      targetId: params.targetId,
      startDate: params.startDate,
      endDate: params.endDate,
    });
    if (historyRes.success && historyRes.data) {
      historyData = {
        data: historyRes.data,
        total: historyRes.total || 0,
        page: historyRes.page || 1,
        totalPages: historyRes.totalPages || 0,
      };
    }
  }

  return (
    <div className="space-y-6">
      {/* Listing Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Synchronization
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage external synchronization targets and monitor credential sync history.
          </p>
        </div>

        {tab === 'targets' && canCreate && (
          <Link href="/settings/sync-targets/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Target
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs Sub-navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Sync Navigation">
          <Link
            href="/settings/sync-targets?tab=targets"
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 gap-2
              ${tab === 'targets'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
              }
            `}
          >
            <ShieldCheck className="w-4 h-4" />
            Targets
          </Link>
          <Link
            href="/settings/sync-targets?tab=history"
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 gap-2
              ${tab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
              }
            `}
          >
            <History className="w-4 h-4" />
            History
          </Link>
        </nav>
      </div>

      {/* Conditional rendering based on active tab */}
      {tab === 'targets' ? (
        targets.length === 0 ? (
          <div className="text-center p-6 py-8 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <RefreshCw className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              No Synchronization Targets
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Create your first synchronization target to connect SAP Integration Suite.
            </p>
            {canCreate && (
              <div className="mt-4">
                <Link href="/settings/sync-targets/new">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Target
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold text-left">
                  <tr>
                    <th className="px-6 py-3">Target Details</th>
                    <th className="px-6 py-3">Host URL</th>
                    <th className="px-6 py-3">Connection Health</th>
                    <th className="px-6 py-3">Status</th>
                    {!isAuditorOrViewer && <th className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  {targets.map((target) => {
                    return (
                      <tr
                        key={target.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                      >
                        {/* Target Details */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {target.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            SAP BTP Integration Suite
                          </div>
                        </td>

                        {/* Host URL */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 select-all group">
                            <span
                              className="font-mono text-xs text-gray-600 dark:text-gray-400 select-all block"
                              title={target.hostUrl}
                            >
                              {target.hostUrl}
                            </span>
                            <CopyUrlButton url={target.hostUrl} />
                          </div>
                        </td>

                        {/* Connection Health */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                            🟢 Healthy
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusToggle
                            id={target.id}
                            initialStatus={target.status === 'ENABLED'}
                            canEdit={hasEditPermission && isTargetWithinScope(target)}
                          />
                        </td>

                        {/* Actions */}
                        {!isAuditorOrViewer && (
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {hasEditPermission && isTargetWithinScope(target) ? (
                                <Link href={`/settings/sync-targets/${target.id}/edit`}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Edit connection details"
                                  >
                                    <Edit2 className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                  </Button>
                                </Link>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled
                                  title="Edit connection details (Restricted)"
                                  className="opacity-40 cursor-not-allowed"
                                >
                                  <Edit2 className="w-4 h-4 text-gray-400" />
                                </Button>
                              )}

                              {canDelete && isTargetWithinScope(target) && (
                                <DeleteTargetButton id={target.id} name={target.name} />
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <SyncHistoryTab
          historyData={historyData}
          targets={targets}
          canRetry={isAdmin}
          currentPage={page}
          currentLimit={limit}
        />
      )}
    </div>
  );
}
