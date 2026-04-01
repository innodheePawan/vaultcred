import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiJwt, validateApiHmacContext } from "@/lib/api-auth";
import { decrypt } from "@/lib/crypto";

import crypto from 'crypto';

export async function GET(req: Request) {
    const endpoint = new URL(req.url).pathname;
    const method = req.method;
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "";
    const requestId = crypto.randomUUID();

    const logActivity = async (options: { apiClientId?: string; clientName?: string; authType?: string; responseStatus: "SUCCESS" | "FAILURE"; httpStatusCode: number; errorMessage?: string; }) => {
        try {
            await prisma.apiActivityLog.create({
                data: {
                    apiClientId: options.apiClientId, clientName: options.clientName, endpoint, method, requestId,
                    authType: options.authType, responseStatus: options.responseStatus, httpStatusCode: options.httpStatusCode,
                    errorMessage: options.errorMessage, action: "LIST", ipAddress, userAgent
                }
            });
        } catch (e) {}
    };

    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            await logActivity({ responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing or invalid Bearer token" });
            return NextResponse.json({ error: "Missing or invalid Bearer token" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const clientContext = await verifyApiJwt(token);
        
        if (!clientContext) {
            await logActivity({ responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Unauthorized or expired token" });
            return NextResponse.json({ error: "Unauthorized or expired token" }, { status: 401 });
        }

        const client = await prisma.apiClient.findUnique({ where: { clientId: clientContext.clientId } });
        if (!client || !client.isActive) {
            await logActivity({ apiClientId: clientContext.clientId, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Client inactive or not found" });
            return NextResponse.json({ error: "Client inactive or not found" }, { status: 401 });
        }

        const mode = client.securityMode || "BASIC";
        const authType = mode === "ENTERPRISE" ? "OAUTH_CERT_VALIDATION" : mode === "SECURE" ? "OAUTH_CERT" : "OAUTH_ONLY";

        if (mode === "ENTERPRISE") {
            const signature = req.headers.get("x-api-signature");
            const timestamp = req.headers.get("x-api-timestamp");
            if (!signature || !timestamp) {
                await logActivity({ apiClientId: client.id, clientName: client.name, authType, responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing HMAC signature headers (x-api-signature, x-api-timestamp) for Enterprise Mode" });
                return NextResponse.json({ error: "Missing HMAC signature headers required by Enterprise Mode" }, { status: 401 });
            }

            let secretPlain = "";
            try {
                secretPlain = decrypt(client.clientSecretHash);
            } catch (e) {
                return NextResponse.json({ error: "Internal Configuration Error computing HMAC" }, { status: 500 });
            }

            const reqUrlObject = new URL(req.url);
            const isValidSignature = validateApiHmacContext(reqUrlObject.pathname, signature, timestamp, secretPlain);
            if (!isValidSignature) {
                await logActivity({ apiClientId: client.id, clientName: client.name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "HMAC Signature mismatch or expired timestamp" });
                return NextResponse.json({ error: "HMAC Signature mismatch or expired timestamp" }, { status: 403 });
            }
        }

        const whereClause: any = { isPersonal: false, status: "ACTIVE" };
        const scopes = clientContext.scopes;
        
        if (scopes.applications && scopes.applications.length > 0 && !scopes.applications.includes("*")) {
            whereClause.category = { in: scopes.applications };
        }
        if (scopes.environments && scopes.environments.length > 0 && !scopes.environments.includes("*")) {
            whereClause.environment = { in: scopes.environments };
        }
        if (scopes.credentialTypes && scopes.credentialTypes.length > 0 && !scopes.credentialTypes.includes("*")) {
            whereClause.type = { in: scopes.credentialTypes };
        }

        const credentials = await prisma.credentialMaster.findMany({
            where: whereClause,
            select: { id: true, name: true, type: true, category: true, environment: true, description: true, version: true, createdOn: true, lastModifiedOn: true },
            orderBy: { name: 'asc' }
        });

        await logActivity({ apiClientId: client.id, clientName: client.name, authType, responseStatus: "SUCCESS", httpStatusCode: 200 });
        return NextResponse.json({ data: credentials });

    } catch (error) {
        console.error("API GET /credentials error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
