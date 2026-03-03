export async function register() {
    // Only run this during the Node.js server startup, not Edge Runtime or Build steps
    if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DATABASE_URL) {
        // Bootstrap sequence started

        try {
            // Check for schema drift dynamically
            const { internalCheckDatabaseDrift } = await import('@/lib/actions/database');
            const driftResult = await internalCheckDatabaseDrift();

            if (driftResult && driftResult.error) {
                console.error('[Bootstrap] ❌ Drift Check Internal Error:', driftResult.error);
                return; // Abort sync
            }

            if (driftResult && driftResult.drift) {
                // Schema Drift Detected, attempting database sync

                const { syncDatabase } = await import('@/lib/actions/setup');
                const syncResult = await syncDatabase();

                if (syncResult && syncResult.success) {
                    // Database successfully synchronized.
                } else {
                    console.error('[Bootstrap] ❌ Auto-Sync failed. User intervention may be required upon /setup', syncResult?.error);
                }
            } else {
                // Database schema is already in sync.
            }

            // --- License State Evaluation (Boot-Time) ---
            try {
                const { getLicenseState } = await import('@/lib/license-enforcement');
                console.log('[Bootstrap] 🔒 Evaluatng License State...');
                // Force a refresh to read the DB, decrypt, and re-verify the signature
                const licenseInfo = await getLicenseState(true);
                console.log(`[Bootstrap] ℹ️ Initial License State: ${licenseInfo.state}`);
            } catch (licenseError) {
                console.error('[Bootstrap] ⚠️ Non-fatal error during license evaluation:', licenseError);
            }

        } catch (error) {
            console.error('[Bootstrap] ❌ Fatal Error during automatic database sync sequence:', error);
        }
    }
}
