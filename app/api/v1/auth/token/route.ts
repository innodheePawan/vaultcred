import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { generateApiJwt } from "@/lib/api-auth";
import { checkGlobalApiAccess, STANDARD_404_HTML } from "@/lib/api-pipeline";

import crypto from 'crypto';

export async function POST(req: Request) {
    const endpoint = new URL(req.url).pathname;
    const method = req.method;
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "";
    const requestId = crypto.randomUUID();

    const logActivity = async (options: {
        apiClientId?: string; clientName?: string; authType?: string;
        validationStatus?: string; responseStatus: "SUCCESS" | "FAILURE";
        httpStatusCode: number; errorMessage?: string; certificateIdentity?: string;
    }) => {
        try {
            await prisma.apiActivityLog.create({
                data: {
                    apiClientId: options.apiClientId, clientName: options.clientName,
                    endpoint, method, requestId, authType: options.authType,
                    certificateIdentity: options.certificateIdentity,
                    validationStatus: options.validationStatus,
                    responseStatus: options.responseStatus, httpStatusCode: options.httpStatusCode,
                    errorMessage: options.errorMessage, action: "SSO_TOKEN_GRANT",
                    ipAddress, userAgent
                }
            });
        } catch (e) {
            console.error("Failed to write ApiActivityLog", e);
        }
    };

    try {
        const isGlobalEnabled = await checkGlobalApiAccess();
        if (!isGlobalEnabled) {
            await logActivity({ responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "Feature disabled globally" });
            return new NextResponse(STANDARD_404_HTML, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        let clientId = "";
        let clientSecret = "";
        
        // 1. Extract Credentials via Basic Auth Header
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.toLowerCase().startsWith("basic ")) {
            try {
                const base64Credentials = authHeader.substring(6);
                const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
                const parts = credentials.split(":");
                if (parts.length >= 2) {
                    clientId = parts[0];
                    clientSecret = parts.slice(1).join(":"); 
                }
            } catch (e) {}
        }
        
        // Form encoded fallback if header missing
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
            try {
                const text = await req.text();
                const params = new URLSearchParams(text);
                if (!clientId) clientId = params.get("client_id") || "";
                if (!clientSecret) clientSecret = params.get("client_secret") || "";
            } catch (e) {}
        } else if (contentType.includes("application/json") && !clientId) {
            try {
                const body = await req.json().catch(() => ({}));
                clientId = body.clientId || body.client_id || "";
                clientSecret = body.clientSecret || body.client_secret || "";
            } catch(e) {}
        }

        if (!clientId) {
            await logActivity({ responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Missing Authorization Basic header or client_id" });
            return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
        }

        // 2. Fetch Client
        const client = await prisma.apiClient.findUnique({ where: { clientId } });
        if (!client || !client.isActive) {
            await logActivity({ responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Invalid or inactive client" });
            return NextResponse.json({ error: "Invalid client" }, { status: 401 });
        }

        // 3. Security Mode Validation
        const mode = client.securityMode || "BASIC";
        let authType = mode === "ENTERPRISE" ? "OAUTH_CERT_VALIDATION" : mode === "SECURE" ? "OAUTH_CERT" : "OAUTH_ONLY";
        
        let secretValid = false;
        if (clientSecret) {
            try {
                const decryptedDbSecret = decrypt(client.clientSecretHash);
                if (clientSecret === decryptedDbSecret) secretValid = true;
            } catch (e) {}
        }

        if (!secretValid) {
            await logActivity({ apiClientId: client.id, clientName: client.name, authType, validationStatus: "FAILED", responseStatus: "FAILURE", httpStatusCode: 401, errorMessage: "Invalid client_secret" });
            return NextResponse.json({ error: "Authentication failed. Invalid secret." }, { status: 401 });
        }

        let certIdentity = req.headers.get("x-client-fingerprint") || undefined;
        if ((mode === "SECURE" || mode === "ENTERPRISE")) {
            if (!certIdentity) {
                await logActivity({ apiClientId: client.id, clientName: client.name, authType, certificateIdentity: certIdentity, validationStatus: "FAILED", responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Security Mode severely requires valid mTLS certificate thumbprint header" });
                return NextResponse.json({ error: "Missing required Client Certificate bound to the request" }, { status: 403 });
            }
            if (!client.certificateThumbprint) {
                await logActivity({ apiClientId: client.id, clientName: client.name, authType, certificateIdentity: certIdentity, validationStatus: "FAILED", responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Client configured securely but lacks a registered thumbprint" });
                return NextResponse.json({ error: "Client not fully configured for mTLS validation" }, { status: 403 });
            }
            
            const cleanReqTp = certIdentity.replace(/:/g, '').toLowerCase();
            const cleanDbTp = client.certificateThumbprint.replace(/:/g, '').toLowerCase();
            if (cleanReqTp !== cleanDbTp) {
                await logActivity({ apiClientId: client.id, clientName: client.name, authType, certificateIdentity: certIdentity, validationStatus: "FAILED", responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Certificate fingerprint mismatch" });
                return NextResponse.json({ error: "Invalid Client Certificate identity" }, { status: 403 });
            }
        }

        // 4. Issue Token
        const token = await generateApiJwt(client);

        await prisma.apiClient.update({
            where: { id: client.id },
            data: { lastUsedAt: new Date() }
        });

        await logActivity({
            apiClientId: client.id, clientName: client.name, authType, certificateIdentity: certIdentity,
            validationStatus: "SUCCESS", responseStatus: "SUCCESS", httpStatusCode: 200
        });

        return NextResponse.json({
            access_token: token,
            token_type: "Bearer",
            expires_in: client.tokenValiditySeconds || 300
        });

    } catch (error: any) {
        console.error("API Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
