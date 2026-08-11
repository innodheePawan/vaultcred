import React from 'react';
import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import { getSyncTargetById } from '@/lib/actions/sync-targets';
import SyncTargetForm from '@/components/admin/settings/SyncTargetForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditSyncTargetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSyncTargetPage(props: EditSyncTargetPageProps) {
  const params = await props.params;
  const session = await auth();
  const ctx = await getSafeUserContext(session?.user?.id || '');
  const canEdit = canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'EDIT');

  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Target</h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center gap-4">
          <div>
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">Access Restricted</h3>
            <p className="text-yellow-700 dark:text-yellow-300">
              You do not have permission to edit synchronization targets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const res = await getSyncTargetById(params.id);
  if (res.error || !res.data) {
    notFound();
  }

  const target = res.data;
  const isScoped = ctx.featurePermissions['SYNC_TARGETS'] === 'ALL_SCOPED';
  let isEditable: boolean = canEdit;
  if (isScoped && canEdit) {
    const allowedCats = ctx.allowedCategories || [];
    const allowedEnvs = ctx.allowedEnvironments || [];
    const targetCats = Array.isArray(target.categories) ? (target.categories as string[]) : [];
    const targetEnvs = Array.isArray(target.environments) ? (target.environments as string[]) : [];

    const isCatSubset = allowedCats.includes('*') || targetCats.every((c) => allowedCats.includes(c));
    const isEnvSubset = allowedEnvs.includes('*') || targetEnvs.every((e) => allowedEnvs.includes(e));
    isEditable = isCatSubset && isEnvSubset;
  }

  return <SyncTargetForm initialTarget={target} canEdit={isEditable} canTest={canEdit} />;
}
