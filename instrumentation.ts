export async function register() {
    // Only run this during the Node.js server startup, not Edge Runtime or Build steps
    if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DATABASE_URL) {
        console.log('[Bootstrap] Initializing Credential Management Automatic Setup Sequence...');

        try {
            // Check for schema drift dynamically
            const { internalCheckDatabaseDrift } = await import('@/lib/actions/database');
            const driftResult = await internalCheckDatabaseDrift();

            if (driftResult && driftResult.error) {
                console.error('[Bootstrap] ❌ Drift Check Internal Error:', driftResult.error);
                return; // Abort sync
            }

            if (driftResult && driftResult.drift) {
                console.log('[Bootstrap] Schema Drift Detected! Automatically syncing database...');

                const { syncDatabase } = await import('@/lib/actions/setup');
                const syncResult = await syncDatabase();

                if (syncResult && syncResult.success) {
                    console.log('[Bootstrap] ✅ Database successfully synchronized.');
                } else {
                    console.error('[Bootstrap] ❌ Auto-Sync failed. User intervention may be required upon /setup', syncResult?.error);
                }
            } else {
                console.log('[Bootstrap] ✅ Database schema is already in sync.');
            }
        } catch (error) {
            console.error('[Bootstrap] ❌ Fatal Error during automatic database sync sequence:', error);
        }
    }
}
