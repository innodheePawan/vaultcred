export default function DebugEnvPage() {
    // Server-side environment check
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
            <pre className="bg-gray-100 p-4 rounded text-black">
                {JSON.stringify(envStatus, null, 2)}
            </pre>
            <p className="text-gray-500">
                DATABASE_URL is masked (Length: {envStatus.dbUrlLen})
            </p>
        </div>
    );
}
