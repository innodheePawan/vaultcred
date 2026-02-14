import React from 'react';

export default function EnvValuePage() {
    const setupMode = process.env.SETUP_MODE;
    const dbUrl = process.env.DATABASE_URL;

    // Mask sensitive DB parts: mysql://user:password@host:port/db
    const maskDbUrl = (url: string | undefined) => {
        if (!url) return 'Not Set';
        try {
            const parts = url.split('@');
            if (parts.length < 2) return 'Invalid Format or Local SQLite';
            const creds = parts[0];
            const hostInfo = parts[1];
            return `mysql://***:***@${hostInfo}`;
        } catch (e) {
            return 'Parse Error';
        }
    };

    const isSetupModeTrue = String(setupMode).trim().toLowerCase() === "true";

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
            <h1 className="text-3xl font-bold mb-8 text-blue-400">Environment Diagnostics</h1>

            <div className="space-y-6 max-w-4xl">
                <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                        Current Environment Variables
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 p-4 rounded border border-gray-700">
                            <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">SETUP_MODE</p>
                            <p className={`text-xl font-bold ${isSetupModeTrue ? 'text-green-400' : 'text-red-400'}`}>
                                {setupMode === undefined ? 'UNDEFINED' : `"${setupMode}"`}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Expected: "true" (case-insensitive, trimmed)</p>
                        </div>

                        <div className="bg-gray-900 p-4 rounded border border-gray-700">
                            <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">DATABASE_URL Status</p>
                            <p className={`text-xl font-bold ${dbUrl ? 'text-green-400' : 'text-red-400'}`}>
                                {dbUrl ? 'CONNECTED' : 'MISSING'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 truncate" title={maskDbUrl(dbUrl)}>
                                Value: {maskDbUrl(dbUrl)}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-blue-300">Application Logic Interpretation</h2>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex gap-3">
                            <span className="text-gray-500 font-bold">1.</span>
                            <span>Middleware detects <code>isSetupMode</code> as:
                                <span className={`ml-2 px-2 py-0.5 rounded font-bold ${isSetupModeTrue ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                                    {String(isSetupModeTrue)}
                                </span>
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-gray-500 font-bold">2.</span>
                            <span>Should redirect to <code>/setup</code>?
                                <span className={`ml-2 font-bold ${isSetupModeTrue ? 'text-green-400' : 'text-gray-500'}`}>
                                    {isSetupModeTrue ? 'YES' : 'NO'}
                                </span>
                            </span>
                        </li>
                    </ul>
                </section>

                <div className="bg-blue-900/30 border border-blue-800 p-4 rounded text-sm text-blue-200">
                    <p className="font-bold mb-1">💡 Troubleshooting Tips for Amplify:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Ensure variables are set in the <strong>All Branches</strong> or specific target branch.</li>
                        <li>Amplify requires a <strong>Redeploy</strong> (build) after environment variable changes.</li>
                        <li>Check for hidden characters or BOM in value strings.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
