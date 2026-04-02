import { Metadata } from 'next';
import { ActivityTabs } from './ActivityTabs';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Activity Center | CRED Secure',
};

export default function ActivityCenterPage() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-blue-500" />
          Activity Center
        </h2>
      </div>
      <p className="text-gray-400 max-w-4xl">
        Consolidated observability across governance, authentication, network blocks, and API telemetry.
      </p>
      
      <div className="mt-8 relative min-h-[500px]">
        <ActivityTabs />
      </div>
    </div>
  );
}
