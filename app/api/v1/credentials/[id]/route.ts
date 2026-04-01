import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiJwt, validateApiHmacContext } from "@/lib/api-auth";
import { decrypt } from "@/lib/crypto";
import crypto from 'crypto';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const endpoint = new URL(req.url).pathname;
    const method = req.method;
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "";
    const requestId = crypto.randomUUID();

    const logActivity = async (options: {
        apiClientId?: string; clientName?: string; authType?: string;
        responseStatus: "SUCCESS" | "FAILURE"; httpStatusCode: number;
        errorMessage?: string; credentialId?: string; application?: string; environment?: string;
    }) => {
        try {
            await prisma.apiActivityLog.create({
                data: {
                    apiClientId: options.apiClientId, clientName: options.clientName,
                    endpoint, method, requestId, authType: options.authType,
                    responseStatus: options.responseStatus, httpStatusCode: options.httpStatusCode,
                    errorMessage: options.errorMessage, action: "VIEW",
                    credentialId: options.credentialId,
                    application: options.application, environment: options.environment,
                    ipAddress, userAgent
                }
            });
        } catch (e) {}
    };

    try {
        const params = await props.params;
        const { id } = params;

        // ── Auth ─────────────────────────────────────────────────────────────────
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            await logActivity({ credentialId: id, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing or invalid Bearer token" });
            return NextResponse.json({ error: "Missing or invalid Bearer token" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const clientContext = await verifyApiJwt(token);

        if (!clientContext) {
            await logActivity({ credentialId: id, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Unauthorized or expired token" });
            return NextResponse.json({ error: "Unauthorized or expired token" }, { status: 401 });
        }

        // ── Load client via raw SQL ($queryRawUnsafe avoids BigInt coercion issues) ──
        const clientRows: any[] = await prisma.$queryRawUnsafe(
            `SELECT api_client_id, client_name, is_active, security_mode, allow_file_download
             FROM api_clients WHERE client_id = ?`,
            clientContext.clientId
        );

        if (clientRows.length === 0 || Number(clientRows[0].is_active) !== 1) {
            await logActivity({ credentialId: id, apiClientId: clientContext.clientId, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Client inactive or not found" });
            return NextResponse.json({ error: "Client inactive or not found" }, { status: 401 });
        }

        const clientRow = clientRows[0];
        const mode: string = clientRow.security_mode || "BASIC";
        const authType = mode === "ENTERPRISE" ? "OAUTH_CERT_VALIDATION" : mode === "SECURE" ? "OAUTH_CERT" : "OAUTH_ONLY";

        // ── Enterprise HMAC check ────────────────────────────────────────────────
        if (mode === "ENTERPRISE") {
            const signature = req.headers.get("x-api-signature");
            const timestamp = req.headers.get("x-api-timestamp");
            if (!signature || !timestamp) {
                await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing HMAC signature headers" });
                return NextResponse.json({ error: "Missing HMAC signature headers required by Enterprise Mode" }, { status: 401 });
            }
            const clientRecord = await prisma.apiClient.findUnique({ where: { clientId: clientContext.clientId } });
            let secretPlain = "";
            try { secretPlain = decrypt(clientRecord!.clientSecretHash); } catch (e) {
                return NextResponse.json({ error: "Internal Configuration Error computing HMAC" }, { status: 500 });
            }
            const isValidSignature = validateApiHmacContext(new URL(req.url).pathname, signature, timestamp, secretPlain);
            if (!isValidSignature) {
                await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "HMAC Signature mismatch or expired timestamp" });
                return NextResponse.json({ error: "HMAC Signature mismatch or expired timestamp" }, { status: 403 });
            }
        }

        // ── Fetch credential ─────────────────────────────────────────────────────
        const scopes = clientContext.scopes;
        const credential = await prisma.credentialMaster.findFirst({
            where: { id: id, isPersonal: false, status: "ACTIVE" },
            include: { detailsPassword: true, detailsApi: true, detailsKeyCert: true, detailsToken: true, detailsFile: true, detailsNote: true }
        });

        if (!credential) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "Credential not found" });
            return NextResponse.json({ error: "Credential not found or access denied" }, { status: 404 });
        }

        // ── Scope check (deny on empty array — no wildcard means no access) ──────
        const apps = Array.isArray(scopes?.applications) ? scopes.applications : [];
        const envs = Array.isArray(scopes?.environments) ? scopes.environments : [];
        const credTypes = Array.isArray(scopes?.credentialTypes) ? scopes.credentialTypes : [];

        const appAllowed = apps.includes("*") || apps.includes(credential.category || "");
        const envAllowed = envs.includes("*") || envs.includes(credential.environment || "");
        const typeAllowed = credTypes.includes("*") || credTypes.includes(credential.type);

        if (!appAllowed || !envAllowed || !typeAllowed) {
            await logActivity({ credentialId: id, application: credential.category || "", environment: credential.environment || "", apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Access Denied: Credential is out of assigned Client Scopes." });
            return NextResponse.json({ error: "Credential found but out of assigned scopes." }, { status: 403 });
        }

        // ── Build response, decrypt secrets ─────────────────────────────────────
        let decryptedDetails: any = { ...credential };

        if (credential.type === "PASSWORD" && credential.detailsPassword) {
            decryptedDetails.password = decrypt(credential.detailsPassword.passwordEncrypted);
            delete decryptedDetails.detailsPassword.passwordEncrypted;

        } else if (credential.type === "API_OAUTH" && credential.detailsApi) {
            if (credential.detailsApi.clientSecretEnc) { decryptedDetails.detailsApi.clientSecret = decrypt(credential.detailsApi.clientSecretEnc); delete decryptedDetails.detailsApi.clientSecretEnc; }
            if (credential.detailsApi.apiKeyEncrypted) { decryptedDetails.detailsApi.apiKey = decrypt(credential.detailsApi.apiKeyEncrypted); delete decryptedDetails.detailsApi.apiKeyEncrypted; }

        } else if (credential.type === "TOKEN" && credential.detailsToken) {
            decryptedDetails.detailsToken.tokenValue = decrypt(credential.detailsToken.tokenEncrypted);
            delete decryptedDetails.detailsToken.tokenEncrypted;

        } else if (credential.type === "FILE" && credential.detailsFile) {
            // FILE credentials require the client to have allowFileDownload explicitly provisioned.
            // Using $queryRawUnsafe (parameterized) to reliably read MySQL TINYINT(1) as JS number.
            const allowRaw = Number(clientRow.allow_file_download);
            console.log(`[VIEW-CRED] FILE check: client=${clientContext.clientId} allow_file_download(raw)=${clientRow.allow_file_download}(${typeof clientRow.allow_file_download}) → permitted=${allowRaw === 1}`);

            if (allowRaw !== 1) {
                await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Client not authorized for file downloads" });
                return NextResponse.json({ error: "Client not authorized for file downloads" }, { status: 403 });
            }

            const d = credential.detailsFile;
            // Return only metadata — binary content must be fetched via GET /api/v1/credentials/{id}/file
            decryptedDetails.detailsFile = {
                fileName: d.fileName,
                fileType: d.fileType,
            };

        } else if (credential.type === "KEY_CERT" && credential.detailsKeyCert) {
            if (credential.detailsKeyCert.privateKeyEnc) { decryptedDetails.detailsKeyCert.privateKey = decrypt(credential.detailsKeyCert.privateKeyEnc); delete decryptedDetails.detailsKeyCert.privateKeyEnc; }
            if (credential.detailsKeyCert.passphraseEnc) { decryptedDetails.detailsKeyCert.passphrase = decrypt(credential.detailsKeyCert.passphraseEnc); delete decryptedDetails.detailsKeyCert.passphraseEnc; }

        } else if (credential.type === "SECURE_NOTE" && credential.detailsNote) {
            decryptedDetails.detailsNote.note = decrypt(credential.detailsNote.noteEncrypted);
            delete decryptedDetails.detailsNote.noteEncrypted;
        }

        await logActivity({ credentialId: id, application: credential.category || "", environment: credential.environment || "", apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "SUCCESS", httpStatusCode: 200 });
        return NextResponse.json({ data: decryptedDetails });

    } catch (error) {
        console.error("API GET /credentials/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
