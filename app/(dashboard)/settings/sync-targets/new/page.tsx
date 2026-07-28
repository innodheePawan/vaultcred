import React from 'react';
import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import SyncTargetForm from '@/components/admin/settings/SyncTargetForm';

export const dynamic = 'force-dynamic';

export default async function NewSyncTargetPage() {
  const session = await auth();
  const ctx = await getSafeUserContext(session?.user?.id || '');
  const canCreate = canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'CREATE');

  if (!canCreate) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Target</h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center gap-4">
          <div>
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">Access Restricted</h3>
            <p className="text-yellow-700 dark:text-yellow-300">
              You do not have permission to add synchronization targets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <SyncTargetForm canEdit={canCreate} />;
}
