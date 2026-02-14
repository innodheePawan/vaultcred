import React from 'react';

export default function EnvValuePage() {
    const setupMode = process.env.SETUP_MODE;
    const publicSetupMode = process.env.NEXT_PUBLIC_SETUP_MODE;
    const dbUrl = process.env.DATABASE_URL;

    // Mask sensitive DB parts
    const maskDbUrl = (url: string | undefined) => {
        if (!url) return 'Not Set';
        try {
            const parts = url.split('@');
            if (parts.length < 2) return 'Invalid Format or Local';
            const hostInfo = parts[1];
            return `mysql://***:***@${hostInfo}`;
        } catch (e) {
            return 'Parse Error';
        }
    };

    const isSetupModeTrue = String(setupMode).trim().toLowerCase() === "true";
    const isPublicSetupModeTrue = String(publicSetupMode).trim().toLowerCase() === "true";
    const effectiveSetupMode = isSetupModeTrue || isPublicSetupModeTrue;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
            <h1 className="text-3xl font-bold mb-8 text-blue-400">Environment Diagnostics V2</h1>

            <div className="space-y-6 max-w-4xl">
                <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-500">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                        Key Variables
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 p-4 rounded border border-gray-700">
                            <p className="text-gray-400 text-sm mb-1 uppercase">SETUP_MODE</p>
                            <p className={`text-xl font-bold ${isSetupModeTrue ? 'text-green-400' : 'text-red-400'}`}>
                                {setupMode === undefined ? 'UNDEFINED' : `"${setupMode}"`}
                            </p>
                        </div>

                        <div className="bg-gray-900 p-4 rounded border border-gray-700">
                            <p className="text-gray-400 text-sm mb-1 uppercase">NEXT_PUBLIC_SETUP_MODE</p>
                            <p className={`text-xl font-bold ${isPublicSetupModeTrue ? 'text-green-400' : 'text-red-400'}`}>
                                {publicSetupMode === undefined ? 'UNDEFINED' : `"${publicSetupMode}"`}
                            </p>
                        </div>

                        <div className="bg-gray-900 p-4 rounded border border-gray-700 md:col-span-2">
                            <p className="text-gray-400 text-sm mb-1 uppercase">DATABASE_URL Status</p>
                            <p className={`text-xl font-bold ${dbUrl ? 'text-green-400' : 'text-red-400'}`}>
                                {dbUrl ? 'DETECTED' : 'MISSING'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 truncate">
                                Value: {maskDbUrl(dbUrl)}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-blue-300">New Logic Interpretation</h2>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex gap-3 items-center">
                            <span className="text-gray-500 font-bold">1.</span>
                            <span>Effective Setup Mode:
                                <span className={`ml-2 px-3 py-1 rounded font-bold ${effectiveSetupMode ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                                    {String(effectiveSetupMode).toUpperCase()}
                                </span>
                            </span>
                        </li>
                        <li className="flex gap-3 items-center">
                            <span className="text-gray-500 font-bold">2.</span>
                            <span>Middleware Action:
                                <span className="ml-2 font-bold text-blue-400 italic">
                                    {effectiveSetupMode ? 'FORCED REDIRECT TO /setup' : 'BYPASS TO LOGIN/APP'}
                                </span>
                            </span>
                        </li>
                    </ul>
                </section>

                <div className="bg-amber-900/30 border border-amber-800 p-4 rounded text-sm text-amber-200">
                    <p className="font-bold mb-1">⚠️ Action Required in Amplify Console:</p>
                    <p className="mb-2">If both are UNDEFINED above, please add BOTH of these to your Amplify environment variables (All Branches):</p>
                    <div className="bg-black/40 p-2 rounded mb-2 select-all">
                        <code>SETUP_MODE = true</code><br />
                        <code>NEXT_PUBLIC_SETUP_MODE = true</code>
                    </div>
                    <p className="text-xs italic">Note: Amplify requires a full "Redeploy" after changing environment variables.</p>
                </div>
            </div>
        </div>
    );
}
