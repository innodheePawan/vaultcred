import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { verifyApiJwt, validateApiHmacContext, ApiClientContext } from "@/lib/api-auth";
import { decrypt } from "@/lib/crypto";

export const STANDARD_404_HTML = `
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

export async function checkGlobalApiAccess(): Promise<boolean> {
   const settingsRows: any[] = await prisma.$queryRawUnsafe(`SELECT allow_api_access FROM system_settings LIMIT 1`);
   const globalRaw = settingsRows.length > 0 ? settingsRows[0].allow_api_access : 0;
   return Number(globalRaw) === 1;
}

export async function validateExternalApiPipeline(req: Request, credentialId: string, action: string = "REVEAL_CREDENTIAL") {
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
                   errorMessage: options.errorMessage, action,
                   credentialId: options.credentialId,
                   application: options.application, environment: options.environment,
                   ipAddress, userAgent
               }
           });
       } catch (e) { /* audit failure must never block the response */ }
   };

    // 1. Global Config Check
    const isGlobalEnabled = await checkGlobalApiAccess();
    if (!isGlobalEnabled) {
        await logActivity({ credentialId, responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "Feature disabled globally" });
        return { errorResponse: new NextResponse(STANDARD_404_HTML, { status: 404, headers: { 'Content-Type': 'text/html' } }) };
    }

    // 2. Token Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        await logActivity({ credentialId, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing or invalid Bearer token" });
        return { errorResponse: NextResponse.json({ error: "Missing or invalid Bearer token" }, { status: 401 }) };
    }
    const token = authHeader.split(" ")[1];
    const clientContext = await verifyApiJwt(token);
    if (!clientContext) {
        await logActivity({ credentialId, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Unauthorized or expired token" });
        return { errorResponse: NextResponse.json({ error: "Unauthorized or expired token" }, { status: 401 }) };
    }

    // 3. Client Check
    const clientRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT api_client_id, client_id, client_name, security_mode, is_active FROM api_clients WHERE client_id = ?`,
        clientContext.clientId
    );
    if (clientRows.length === 0) {
        await logActivity({ credentialId, apiClientId: clientContext.clientId, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Client not found" });
        return { errorResponse: NextResponse.json({ error: "Client not found" }, { status: 401 }) };
    }
    const clientRow = clientRows[0];
    if (Number(clientRow.is_active) !== 1) {
         await logActivity({ credentialId, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Client is disabled" });
         return { errorResponse: NextResponse.json({ error: "Client is disabled" }, { status: 401 }) };
    }

    // 4. Security Mode validation
    const mode: string = clientRow.security_mode || "BASIC";
    const authType = mode === "ENTERPRISE" ? "OAUTH_CERT_VALIDATION" : mode === "SECURE" ? "OAUTH_CERT" : "OAUTH_ONLY";

    if (mode === "SECURE" || mode === "ENTERPRISE") {
         const verifyHeader = req.headers.get("x-client-verify");
         if (verifyHeader !== "SUCCESS") {
             await logActivity({ credentialId, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "mTLS authentication failed" });
             return { errorResponse: NextResponse.json({ error: "mTLS authentication failed required by SECURE mode" }, { status: 401 }) };
         }
    }

    if (mode === "ENTERPRISE") {
         const signature = req.headers.get("x-api-signature");
         const timestamp = req.headers.get("x-api-timestamp");
         if (!signature || !timestamp) {
             await logActivity({ credentialId, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing HMAC signature headers" });
             return { errorResponse: NextResponse.json({ error: "Missing HMAC signature headers required by Enterprise Mode" }, { status: 401 }) };
         }

         const clientRecord = await prisma.apiClient.findUnique({ where: { clientId: clientContext.clientId } });
         let secretPlain = "";
         try { secretPlain = decrypt(clientRecord!.clientSecretHash); } catch(e) {}
         const reqUrlObject = new URL(req.url);
         const isValidSignature = validateApiHmacContext(reqUrlObject.pathname, signature, timestamp, secretPlain);
         if (!isValidSignature) {
              await logActivity({ credentialId, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "HMAC Signature mismatch or expired" });
              return { errorResponse: NextResponse.json({ error: "HMAC Signature mismatch or expired timestamp" }, { status: 403 }) };
         }
    }

    // 5. Fetch Credential
    const credential = await prisma.credentialMaster.findFirst({
        where: { id: credentialId, isPersonal: false, status: "ACTIVE" },
        include: { detailsFile: true, detailsToken: true, detailsKeyCert: true, detailsApi: true, detailsPassword: true, detailsNote: true }
    });

    if (!credential) {
         await logActivity({ credentialId, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "Credential not found" });
         return { errorResponse: NextResponse.json({ error: "Credential not found or access denied" }, { status: 404 }) };
    }

    // 6. Scope Check (Application and Environment ONLY)
    const scopes = clientContext.scopes;
    const apps = Array.isArray(scopes?.applications) ? scopes.applications : [];
    const envs = Array.isArray(scopes?.environments) ? scopes.environments : [];

    const appAllowed = apps.includes("*") || apps.includes(credential.category || "");
    const envAllowed = envs.includes("*") || envs.includes(credential.environment || "");

    if (!appAllowed) {
        await logActivity({ credentialId, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Application scope mismatch" });
        return { errorResponse: NextResponse.json({ error: "Access denied: Application scope mismatch" }, { status: 403 }) };
    }
    if (!envAllowed) {
        await logActivity({ credentialId, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Environment scope mismatch" });
        return { errorResponse: NextResponse.json({ error: "Access denied: Environment scope mismatch" }, { status: 403 }) };
    }

    return { errorResponse: null, clientRow, credential, clientContext, logActivity, authType };
}
