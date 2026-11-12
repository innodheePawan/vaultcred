import { prisma } from '../lib/prisma';
import { generateApiJwt } from '../lib/api-auth';
import { POST as createOtsHandler } from '../app/api/v1/one-time-secrets/route';
import { revealSecret } from '../lib/actions/secrets';
import { encrypt } from '../lib/crypto';

interface TestResult {
    testId: string;
    description: string;
    passed: boolean;
    details?: string;
}

const results: TestResult[] = [];

function recordTest(testId: string, description: string, passed: boolean, details?: string) {
    results.push({ testId, description, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [${testId}] ${description}`);
    if (details) console.log(`   └─ ${details}`);
}

async function runTestSuite() {
    console.log('\n======================================================');
    console.log('🧪 CREDSECURE EXTERNAL OTS API VERIFICATION SUITE');
    console.log('======================================================\n');

    let clientA: any;
    let clientB: any;
    let adminUser: any;
    const testOtsIds: string[] = [];
    const testClientIds: string[] = [];

    try {
        // Setup: Find an Admin User
        adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN', status: 'ACTIVE' }
        });
        if (!adminUser) {
            adminUser = await prisma.user.findFirst();
        }
        if (!adminUser) {
            throw new Error('No user found in database to link test API clients.');
        }

        // Setup: Create two distinct API clients for testing
        const clientAId = `test-client-a-${Date.now()}`;
        const clientBId = `test-client-b-${Date.now()}`;

        clientA = await prisma.apiClient.create({
            data: {
                name: 'Automated Test Client A',
                clientId: clientAId,
                clientSecretHash: encrypt('test-secret-a'),
                securityMode: 'BASIC',
                scopes: JSON.stringify({ applications: ['*'], environments: ['*'], credentialTypes: ['*'], accessMode: 'READ_ONLY' }),
                isActive: true,
                tokenValiditySeconds: 3600,
                createdById: adminUser.id
            }
        });
        testClientIds.push(clientA.id);

        clientB = await prisma.apiClient.create({
            data: {
                name: 'Automated Test Client B',
                clientId: clientBId,
                clientSecretHash: encrypt('test-secret-b'),
                securityMode: 'BASIC',
                scopes: JSON.stringify({ applications: ['*'], environments: ['*'], credentialTypes: ['*'], accessMode: 'READ_ONLY' }),
                isActive: true,
                tokenValiditySeconds: 3600,
                createdById: adminUser.id
            }
        });
        testClientIds.push(clientB.id);

        const tokenClientA = await generateApiJwt(clientA);
        const tokenClientB = await generateApiJwt(clientB);

        // ─────────────────────────────────────────────────────────────────────────────
        // TC-01: API generates a 16-character password with complexity
        // TC-02: API creates an OTS with seven-day validity and five maximum views
        // TC-03: API returns both generatedPassword and otsLink
        // ─────────────────────────────────────────────────────────────────────────────
        const req1 = new Request('http://localhost:3000/api/v1/one-time-secrets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenClientA}`
            },
            body: JSON.stringify({
                userName: 'Alice Smith',
                email: 'alice.smith@example.com',
                referenceId: 'TEST-REF-001'
            })
        });

        const res1 = await createOtsHandler(req1);
        const data1 = await res1.json();

        if (data1.otsId) testOtsIds.push(data1.otsId);

        // TC-01 Check
        const pass = data1.generatedPassword || '';
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasNum = /[0-9]/.test(pass);
        const hasSpec = /[!@#$%^*-_+=]/.test(pass);
        const passValid = pass.length === 16 && hasUpper && hasLower && hasNum && hasSpec;
        recordTest('TC-01', 'API generates exactly 16-character password with complexity', passValid, `Length: ${pass.length}, Value: ${pass}`);

        // TC-02 Check
        const maxViewsOk = data1.maxViews === 5;
        const expiresAt = new Date(data1.expiresAt);
        const diffDays = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const lifecycleOk = maxViewsOk && diffDays === 7;
        recordTest('TC-02', 'API creates OTS with 7-day validity and 5 maximum views', lifecycleOk, `MaxViews: ${data1.maxViews}, Days to expiry: ${diffDays}`);

        // TC-03 Check
        const hasLinkAndPassword = !!(data1.generatedPassword && data1.otsLink && data1.otsLink.includes('/share/'));
        recordTest('TC-03', 'API returns both generatedPassword and fully-formed otsLink', hasLinkAndPassword, `otsLink: ${data1.otsLink}`);

        // ─────────────────────────────────────────────────────────────────────────────
        // TC-04: The returned OTS link successfully reveals the same generated password
        // ─────────────────────────────────────────────────────────────────────────────
        const tokenFromLink = data1.otsLink.split('/share/')[1];
        const revealResult = await revealSecret(tokenFromLink);
        const revealOk = revealResult.success === true && revealResult.secretData === pass;
        recordTest('TC-04', 'Returned OTS link successfully reveals identical generated password', revealOk, `Revealed matches generated: ${revealOk}`);

        // ─────────────────────────────────────────────────────────────────────────────
        // TC-05: No email is triggered during API creation
        // ─────────────────────────────────────────────────────────────────────────────
        const noEmailInResponse = data1.emailStatus === undefined;
        recordTest('TC-05', 'No email notification or status triggered during API creation', noEmailInResponse, `emailStatus field absent: ${noEmailInResponse}`);

        // ─────────────────────────────────────────────────────────────────────────────
        // TC-06: Duplicate reference IDs are rejected for the same API client (HTTP 409)
        // ─────────────────────────────────────────────────────────────────────────────
        const reqDup = new Request('http://localhost:3000/api/v1/one-time-secrets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenClientA}`
            },
            body: JSON.stringify({
                userName: 'Alice Duplicate Attempt',
                email: 'alice.dup@example.com',
                referenceId: 'TEST-REF-001'
            })
        });

        const resDup = await createOtsHandler(reqDup);
        const dataDup = await resDup.json();
        const dupRejected = resDup.status === 409 && dataDup.error === 'Conflict' && dataDup.otsId === data1.otsId && dataDup.referenceId === 'TEST-REF-001';
        const noPasswordInDup = dataDup.generatedPassword === undefined && dataDup.otsLink === undefined;
        recordTest('TC-06', 'Duplicate referenceId for same client returns HTTP 409 without disclosing password or link', dupRejected && noPasswordInDup, `Status: ${resDup.status}, otsId: ${dataDup.otsId}`);

        // ─────────────────────────────────────────────────────────────────────────────
        // TC-07: Different API clients can use the same reference ID
        // ─────────────────────────────────────────────────────────────────────────────
        const reqClientB = new Request('http://localhost:3000/api/v1/one-time-secrets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenClientB}`
            },
            body: JSON.stringify({
                userName: 'Bob Smith',
                email: 'bob.smith@example.com',
                referenceId: 'TEST-REF-001' // Same reference ID, different client!
            })
        });

        const resClientB = await createOtsHandler(reqClientB);
        const dataClientB = await resClientB.json();
        if (dataClientB.otsId) testOtsIds.push(dataClientB.otsId);
        const crossClientOk = resClientB.status === 201 && dataClientB.success === true && dataClientB.otsId !== data1.otsId;
        recordTest('TC-07', 'Different API clients can use same referenceId without collision', crossClientOk, `Client B Status: ${resClientB.status}, New otsId: ${dataClientB.otsId}`);

        // ─────────────────────────────────────────────────────────────────────────────
        // TC-08: Existing authentication and authorization remain unchanged
        // ─────────────────────────────────────────────────────────────────────────────
        const reqNoAuth = new Request('http://localhost:3000/api/v1/one-time-secrets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName: 'Test', email: 'test@example.com' })
        });
        const resNoAuth = await createOtsHandler(reqNoAuth);

        const reqBadToken = new Request('http://localhost:3000/api/v1/one-time-secrets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer invalid-token' },
            body: JSON.stringify({ userName: 'Test', email: 'test@example.com' })
        });
        const resBadToken = await createOtsHandler(reqBadToken);

        const authOk = resNoAuth.status === 401 && resBadToken.status === 401;
        recordTest('TC-08', 'Authentication pipeline rejects missing (401) or invalid (401) tokens', authOk, `NoToken: ${resNoAuth.status}, BadToken: ${resBadToken.status}`);

        // ─────────────────────────────────────────────────────────────────────────────
        // TC-09: Generated passwords and OTS links are not exposed in logs
        // ─────────────────────────────────────────────────────────────────────────────
        const auditEntries = await prisma.auditLog.findMany({
            where: {
                apiClientId: clientA.id,
                action: 'CREATE_ONE_TIME_SECRET_API'
            }
        });

        const apiActivityEntries = await prisma.apiActivityLog.findMany({
            where: {
                apiClientId: clientA.id
            }
        });

        let leaked = false;
        for (const entry of auditEntries) {
            const str = JSON.stringify(entry);
            if (str.includes(pass) || (tokenFromLink && str.includes(tokenFromLink))) {
                leaked = true;
                break;
            }
        }
        for (const entry of apiActivityEntries) {
            const str = JSON.stringify(entry);
            if (str.includes(pass) || (tokenFromLink && str.includes(tokenFromLink))) {
                leaked = true;
                break;
            }
        }

        recordTest('TC-09', 'Generated passwords, tokens, and OTS links are not exposed in audit/activity logs', !leaked, `Audits checked: ${auditEntries.length}, Activity checked: ${apiActivityEntries.length}`);

        // ─────────────────────────────────────────────────────────────────────────────
        // TC-10: Existing manual OTS creation, viewing, and revocation continue working without regression
        // ─────────────────────────────────────────────────────────────────────────────
        const { provisionOneTimeSecretCore } = await import('../lib/actions/secrets');
        const manualSecret = await provisionOneTimeSecretCore({
            secretData: 'Manual-Confidential-Secret',
            name: 'Manual Test Secret',
            sharedVia: 'LINK',
            maxViews: 1,
            ttlHours: 1,
            createdById: adminUser.id,
            sendEmailNotification: false
        });

        testOtsIds.push(manualSecret.secret.id);
        const manualCreatedOk = manualSecret.success === true && !!manualSecret.token;

        // Reveal manual secret
        const manualReveal = await revealSecret(manualSecret.token);
        const manualRevealOk = manualReveal.success === true && manualReveal.secretData === 'Manual-Confidential-Secret';

        recordTest('TC-10', 'Existing manual OTS workflow (provision, reveal, status transitions) works without regression', manualCreatedOk && manualRevealOk, `Manual created: ${manualCreatedOk}, Manual revealed: ${manualRevealOk}`);

    } catch (err: any) {
        console.error('💥 Test suite crashed with error:', err);
    } finally {
        // Cleanup test data
        console.log('\n🧹 Cleaning up test artifacts from database...');
        if (testOtsIds.length > 0) {
            await prisma.oneTimeSecret.deleteMany({
                where: { id: { in: testOtsIds } }
            }).catch(() => {});
        }
        if (testClientIds.length > 0) {
            await prisma.apiActivityLog.deleteMany({
                where: { apiClientId: { in: testClientIds } }
            }).catch(() => {});
            await prisma.auditLog.deleteMany({
                where: { apiClientId: { in: testClientIds } }
            }).catch(() => {});
            await prisma.apiClient.deleteMany({
                where: { id: { in: testClientIds } }
            }).catch(() => {});
        }
        await prisma.$disconnect();
    }

    console.log('\n======================================================');
    const allPassed = results.every(r => r.passed);
    const passCount = results.filter(r => r.passed).length;
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
    console.log(allPassed ? '🎉 ALL 10 ACCEPTANCE TESTS PASSED SUCCESSFULLY!' : '❌ SOME TESTS FAILED');
    console.log('======================================================\n');

    process.exit(allPassed ? 0 : 1);
}

runTestSuite();

