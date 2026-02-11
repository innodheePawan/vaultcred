import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DebugEnvPage() {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
        redirect('/dashboard');
    }

    // Require admin authentication
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        redirect('/login');
    }

    // Server-side environment check (safe: only visible to admins in dev mode)
    const envStatus = {
        nodeEnv: process.env.NODE_ENV,
        dbUrlLen: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'UNDEFINED',
        nextAuthUrl: process.env.NEXTAUTH_URL || 'UNDEFINED',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'UNDEFINED',
        vercelUrl: process.env.VERCEL_URL || 'UNDEFINED',
    };

    return (
        <div className="p-8 font-mono text-sm space-y-4">
            <h1 className="text-xl font-bold">Environment Diagnostic</h1>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 text-yellow-800 dark:text-yellow-200 p-3 rounded text-xs">
                ⚠️ This page is only available in development mode for admin users.
            </div>
            <pre className="bg-gray-100 p-4 rounded text-black">
                {JSON.stringify(envStatus, null, 2)}
            </pre>
            <p className="text-gray-500">
                DATABASE_URL is masked (Length: {envStatus.dbUrlLen})
            </p>
        </div>
    );
}
