import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getIpSecurityRecords } from '@/lib/actions/ip-blocks';
import IpBlockTable from '@/components/admin/settings/IpBlockTable';
import { ShieldAlert, Info } from 'lucide-react';

export const metadata = {
    title: 'Security Events | VaultSecure Admin',
    description: 'Monitor and manage security events and IP-level blocks.',
};

export default async function SecurityEventsPage() {
    const session = await auth();

    // Strict access control: Only Super Admins (role === 'ADMIN')
    if (!session?.user) redirect('/login');
    if (session.user.role !== 'ADMIN') {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-4">
                    <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-500" />
                    <div>
                        <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Access Restricted</h3>
                        <p className="text-red-700 dark:text-red-300">
                            This page is only accessible to Super Administrators.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const records = await getIpSecurityRecords();

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    Security Events
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Monitor and manage IP-level security blocks and brute-force protection events.
                </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div className="space-y-1">
                    <p className="font-semibold">Security Policy Information:</p>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                        <li>IP addresses are automatically blocked for 4 hours after 20 failed attempts in 30 minutes.</li>
                        <li>Repeat offenders (2+ blocks in 24h) are blocked for 24 hours.</li>
                        <li>Extreme offenders (5+ blocks in 4 days) are permanently blacklisted.</li>
                        <li>Unblocking an IP removes all its security history and history of violations.</li>
                    </ul>
                </div>
            </div>

            <IpBlockTable initialRecords={records} />
        </div>
    );
}
