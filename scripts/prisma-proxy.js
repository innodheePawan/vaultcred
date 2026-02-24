const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

function runPrisma() {
    console.log("[Prisma Script] Booting isolated Prisma execution environment...");

    // 1. Get arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("[Prisma Script] No arguments provided.");
        process.exit(1);
    }

    // 2. Build bulletproof isolated environment
    const safeEnv = Object.assign({}, process.env);

    // AWS Amplify aggressively injects a credential listener into every Node process
    // via NODE_OPTIONS="--require /path/to/amplify-credentials". This listener binds to
    // port 9898 by default and crashes if multiple Node processes spawn, OR if it gets a NaN port.
    // We MUST delete it to run Prisma safely on Amplify.
    delete safeEnv.NODE_OPTIONS;

    // Strip other AWS variables that might trigger SDK listeners
    Object.keys(safeEnv).forEach(key => {
        if (key.startsWith('AWS_') || key.startsWith('AMPLIFY_')) {
            delete safeEnv[key];
        }
    });

    // Provide safe defaults for Prisma overrides
    safeEnv.HOME = os.tmpdir();
    safeEnv.npm_config_cache = path.join(os.tmpdir(), '.npm');
    safeEnv.PRISMA_TELEMETRY_DISABLED = '1';
    safeEnv.CHECKPOINT_DISABLE = '1';

    // 3. Reconstruct command
    const platformNpx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const command = `${platformNpx} --yes prisma ${args.join(' ')}`;

    console.log(`[Prisma Script] Executing: ${command}`);

    // 4. Execute synchronously, letting stdout/stderr pipe directly to the parent
    try {
        execSync(command, {
            env: safeEnv,
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        process.exit(0);
    } catch (error) {
        // execSync throws if exit code is not 0
        console.error(`[Prisma Script] Command failed with exit code: ${error.status}`);
        process.exit(error.status || 1);
    }
}

runPrisma();
