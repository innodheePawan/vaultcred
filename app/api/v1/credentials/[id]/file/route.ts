import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiJwt, validateApiHmacContext } from "@/lib/api-auth";
import { decrypt } from "@/lib/crypto";
import crypto from 'crypto';

const NOT_FOUND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #fff; color: #000; }
  .container { text-align: center; }
  h1 { font-size: 24px; font-weight: 500; margin: 0; padding: 0 20px 0 0; border-right: 1px solid rgba(0, 0, 0, .3); display: inline-block; vertical-align: top; line-height: 49px; }
  h2 { font-size: 14px; font-weight: 400; margin: 0; padding: 0 0 0 20px; display: inline-block; vertical-align: top; line-height: 49px; }
</style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <h2>This page could not be found.</h2>
  </div>
</body>
</html>
`;

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const endpoint = new URL(req.url).pathname;
    const method = req.method;
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "";
    const requestId = crypto.randomUUID();

    const logActivity = async (options: {
        apiClientId?: string; clientName?: string; authType?: string;
        responseStatus: "SUCCESS" | "FAILURE"; httpStatusCode: number;
        errorMessage?: string; credentialId?: string;
        application?: string; environment?: string; fileName?: string;
    }) => {
        try {
            await prisma.apiActivityLog.create({
                data: {
                    apiClientId: options.apiClientId, clientName: options.clientName,
                    endpoint, method, requestId, authType: options.authType,
                    responseStatus: options.responseStatus, httpStatusCode: options.httpStatusCode,
                    errorMessage: options.errorMessage, action: "DOWNLOAD_FILE",
                    credentialId: options.credentialId,
                    application: options.application, environment: options.environment,
                    ipAddress, userAgent
                }
            });
        } catch (e) { /* audit failure must never block the response */ }
    };

    try {
        const params = await props.params;
        const { id } = params;

        console.log(`\n[FILE-DOWNLOAD] ====== START REQUEST ====== credentialId=${id}`);

        // ── STEP 1: Global Policy Check ─────────────────────────────────────────
        // Use $queryRawUnsafe (not tagged $queryRaw) — returns plain JS number, not BigInt.
        const settingsRows: any[] = await prisma.$queryRawUnsafe(
            `SELECT allow_api_file_download FROM system_settings LIMIT 1`
        );
        const globalRaw = settingsRows.length > 0 ? settingsRows[0].allow_api_file_download : 0;
        const isGlobalEnabled = Number(globalRaw) === 1;

        console.log(`[FILE-DOWNLOAD] STEP1 global policy: raw=${globalRaw} enabled=${isGlobalEnabled}`);

        if (!isGlobalEnabled) {
            await logActivity({ credentialId: id, responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "Feature disabled globally" });
            return new NextResponse(NOT_FOUND_HTML, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        // ── STEP 2: Token Authentication ─────────────────────────────────────────
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            await logActivity({ credentialId: id, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing or invalid Bearer token" });
            return NextResponse.json({ error: "Missing or invalid Bearer token" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const clientContext = await verifyApiJwt(token);

        console.log(`[FILE-DOWNLOAD] STEP2 JWT verify: clientId=${clientContext?.clientId ?? 'NULL'}`);

        if (!clientContext) {
            await logActivity({ credentialId: id, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Unauthorized or expired token" });
            return NextResponse.json({ error: "Unauthorized or expired token" }, { status: 401 });
        }

        // ── STEP 3: Load Client via raw SQL ──────────────────────────────────────
        // Using $queryRawUnsafe avoids BigInt coercion issues with MySQL TINYINT(1) fields.
        const clientRows: any[] = await prisma.$queryRawUnsafe(
            `SELECT api_client_id, client_id, client_name, allow_file_download, security_mode, is_active
             FROM api_clients WHERE client_id = ?`,
            clientContext.clientId
        );

        console.log(`[FILE-DOWNLOAD] STEP3 client lookup: found=${clientRows.length} rows`);

        if (clientRows.length === 0) {
            await logActivity({ credentialId: id, apiClientId: clientContext.clientId, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Client not found" });
            return NextResponse.json({ error: "Client not found" }, { status: 401 });
        }

        const clientRow = clientRows[0];

        console.log(`[FILE-DOWNLOAD] STEP3 client row: name=${clientRow.client_name} is_active=${clientRow.is_active} (type=${typeof clientRow.is_active}) allow_file_download=${clientRow.allow_file_download} (type=${typeof clientRow.allow_file_download})`);

        if (Number(clientRow.is_active) !== 1) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Client is disabled" });
            return NextResponse.json({ error: "Client is disabled" }, { status: 401 });
        }

        // ── STEP 4: File Download Permission Check ───────────────────────────────
        const allowFileDownload = Number(clientRow.allow_file_download) === 1;

        console.log(`[FILE-DOWNLOAD] STEP4 allowFileDownload check: raw=${clientRow.allow_file_download} → permitted=${allowFileDownload}`);

        if (!allowFileDownload) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Client not authorized for file downloads" });
            return NextResponse.json({ error: "Client not authorized for file downloads" }, { status: 403 });
        }

        // ── STEP 5: Security Mode Validation (ENTERPRISE = HMAC required) ────────
        const mode: string = clientRow.security_mode || "BASIC";
        const authType = mode === "ENTERPRISE" ? "OAUTH_CERT_VALIDATION" : mode === "SECURE" ? "OAUTH_CERT" : "OAUTH_ONLY";

        console.log(`[FILE-DOWNLOAD] STEP5 security mode: ${mode}`);

        if (mode === "ENTERPRISE") {
            const signature = req.headers.get("x-api-signature");
            const timestamp = req.headers.get("x-api-timestamp");
            if (!signature || !timestamp) {
                await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing HMAC signature headers" });
                return NextResponse.json({ error: "Missing HMAC signature headers required by Enterprise Mode" }, { status: 401 });
            }

            // Fetch secret via Prisma to decrypt
            const clientRecord = await prisma.apiClient.findUnique({ where: { clientId: clientContext.clientId } });
            let secretPlain = "";
            try {
                secretPlain = decrypt(clientRecord!.clientSecretHash);
            } catch (e) {
                return NextResponse.json({ error: "Internal Configuration Error" }, { status: 500 });
            }

            const reqUrlObject = new URL(req.url);
            const isValidSignature = validateApiHmacContext(reqUrlObject.pathname, signature, timestamp, secretPlain);
            if (!isValidSignature) {
                await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "HMAC Signature mismatch or expired" });
                return NextResponse.json({ error: "HMAC Signature mismatch or expired timestamp" }, { status: 403 });
            }
        }

        // ── STEP 6: Fetch Credential ─────────────────────────────────────────────
        const credential = await prisma.credentialMaster.findFirst({
            where: { id, isPersonal: false, status: "ACTIVE", type: "FILE" },
            include: { detailsFile: true }
        });

        console.log(`[FILE-DOWNLOAD] STEP6 credential lookup: found=${!!credential} hasFile=${!!credential?.detailsFile}`);

        if (!credential || !credential.detailsFile) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "Credential not found or not a FILE type" });
            return NextResponse.json({ error: "Credential not found or access denied" }, { status: 404 });
        }

        // ── STEP 7: Scope Check ──────────────────────────────────────────────────
        // Scopes come from the JWT — baked in at token-generation time.
        const scopes = clientContext.scopes;
        const apps = Array.isArray(scopes?.applications) ? scopes.applications : [];
        const envs = Array.isArray(scopes?.environments) ? scopes.environments : [];
        const credTypes = Array.isArray(scopes?.credentialTypes) ? scopes.credentialTypes : [];

        const appAllowed = apps.includes("*") || apps.includes(credential.category || "");
        const envAllowed = envs.includes("*") || envs.includes(credential.environment || "");
        const typeAllowed = credTypes.includes("*") || credTypes.includes(credential.type);

        console.log(`[FILE-DOWNLOAD] STEP7 scope check:`);
        console.log(`  credential: category=${credential.category} env=${credential.environment} type=${credential.type}`);
        console.log(`  client scopes: apps=${JSON.stringify(apps)} envs=${JSON.stringify(envs)} types=${JSON.stringify(credTypes)}`);
        console.log(`  results: appAllowed=${appAllowed} envAllowed=${envAllowed} typeAllowed=${typeAllowed}`);

        if (!appAllowed) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: `Application scope mismatch: credential is in '${credential.category}', client allows ${JSON.stringify(apps)}` });
            return NextResponse.json({ error: `Access denied: Client scope does not permit access to application '${credential.category}'` }, { status: 403 });
        }

        if (!envAllowed) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: `Environment scope mismatch: credential is in '${credential.environment}', client allows ${JSON.stringify(envs)}` });
            return NextResponse.json({ error: `Access denied: Client scope does not permit access to environment '${credential.environment}'` }, { status: 403 });
        }

        if (!typeAllowed) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: `Credential type scope mismatch: type '${credential.type}', client allows ${JSON.stringify(credTypes)}` });
            return NextResponse.json({ error: `Access denied: Client scope does not permit access to credential type '${credential.type}'` }, { status: 403 });
        }

        // ── STEP 8: Decrypt & Serve File ─────────────────────────────────────────
        const d = credential.detailsFile;
        let contentStr = '';

        if (d.fileContent) {
            try { contentStr = decrypt(d.fileContent); } catch (e) { console.error("[FILE-DOWNLOAD] decrypt error:", e); }
        } else if (d.filePath) {
            try {
                const fs = await import('fs/promises');
                contentStr = await fs.readFile(d.filePath, 'utf-8');
            } catch (e) { }
        }

        console.log(`[FILE-DOWNLOAD] STEP8 content resolved: length=${contentStr.length}`);

        if (!contentStr) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "File content could not be resolved" });
            return NextResponse.json({ error: "File content unavailable" }, { status: 404 });
        }

        const isBase64Pattern = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(contentStr);
        const responseBuffer = (isBase64Pattern && contentStr.length % 4 === 0)
            ? Buffer.from(contentStr, 'base64')
            : Buffer.from(contentStr, 'utf-8');

        const fileName = d.fileName || 'credential.enc';

        await logActivity({
            credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name,
            authType, responseStatus: "SUCCESS", httpStatusCode: 200,
            application: credential.category || undefined,
            environment: credential.environment || undefined,
            fileName
        });

        console.log(`[FILE-DOWNLOAD] ====== SUCCESS: serving ${fileName} (${responseBuffer.length} bytes) ======\n`);

        return new NextResponse(responseBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Length": responseBuffer.length.toString()
            }
        });

    } catch (error: any) {
        console.error("[FILE-DOWNLOAD] Unhandled exception:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
