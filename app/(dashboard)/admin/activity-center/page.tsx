import { Metadata } from 'next';
import { ActivityTabs } from './ActivityTabs';
import { ShieldAlert } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getSafeUserContext } from '@/lib/iam/permissions';

export const metadata: Metadata = {
  title: 'Activity Center | CRED Secure',
};

export default async function ActivityCenterPage() {
  // Resolve permissions server-side — passed as props to avoid client Prisma calls
  const session = await auth();
  let featurePermissions: Record<string, string> = {};

  if (session?.user?.id) {
    try {
      const ctx = await getSafeUserContext(session.user.id);
      featurePermissions = ctx.featurePermissions as Record<string, string>;
    } catch {
      // featurePermissions stays empty — ActivityTabs will default to NO_ACCESS
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-blue-500" />
          Activity Center
        </h2>
      </div>
      <p className="text-gray-500 dark:text-gray-400 max-w-4xl">
        Consolidated observability across governance, authentication, network blocks, and API telemetry.
      </p>

      <div className="mt-8 relative min-h-[500px]">
        <ActivityTabs featurePermissions={featurePermissions} />
      </div>
    </div>
  );
}
