import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiJwt, validateApiHmacContext } from "@/lib/api-auth";
import { checkGlobalApiAccess, STANDARD_404_HTML } from "@/lib/api-pipeline";
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
        const isGlobalEnabled = await checkGlobalApiAccess();
        if (!isGlobalEnabled) {
            await logActivity({ responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "Feature disabled globally" });
            return new NextResponse(STANDARD_404_HTML, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

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

        const reqUrlObject = new URL(req.url);
        
        // ── PAGINATION EXTRACTION ──────────────────────────────────────────────
        const pageParam = reqUrlObject.searchParams.get("page");
        const pageSizeParam = reqUrlObject.searchParams.get("pageSize");
        
        let page = 1;
        let pageSize = 50;
        
        if (pageParam !== null) {
            page = parseInt(pageParam, 10);
            if (isNaN(page) || page < 1) {
                await logActivity({ apiClientId: client.id, clientName: client.name, authType, responseStatus: "FAILURE", httpStatusCode: 400, errorMessage: "Invalid page parameter" });
                return NextResponse.json({ error: "Invalid 'page' parameter. Must be >= 1." }, { status: 400 });
            }
        }
        
        if (pageSizeParam !== null) {
            pageSize = parseInt(pageSizeParam, 10);
            if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
                await logActivity({ apiClientId: client.id, clientName: client.name, authType, responseStatus: "FAILURE", httpStatusCode: 400, errorMessage: "Invalid pageSize parameter" });
                return NextResponse.json({ error: "Invalid 'pageSize' parameter. Must be between 1 and 100." }, { status: 400 });
            }
        }

        const skip = (page - 1) * pageSize;

        // ── RBAC AND SCOPE FILTERS ─────────────────────────────────────────────
        const scopes = clientContext.scopes;
        
        let allowedCategories = scopes.applications && scopes.applications.length > 0 && !scopes.applications.includes("*") ? scopes.applications : null;
        let allowedEnvironments = scopes.environments && scopes.environments.length > 0 && !scopes.environments.includes("*") ? scopes.environments : null;

        // ── QUERY PARAMS FILTERS ─────────────────────────────────────────────
        const applicationFilter = reqUrlObject.searchParams.get("application"); 
        const environmentFilter = reqUrlObject.searchParams.get("environment");
        const typeFilter = reqUrlObject.searchParams.get("type");
        const nameFilter = reqUrlObject.searchParams.get("name");

        const whereClause: any = { isPersonal: false, status: "ACTIVE" };

        if (applicationFilter) {
            if (allowedCategories && !allowedCategories.includes(applicationFilter)) {
                whereClause.category = { in: [] }; 
            } else {
                whereClause.category = applicationFilter;
            }
        } else if (allowedCategories) {
            whereClause.category = { in: allowedCategories };
        }

        if (environmentFilter) {
            if (allowedEnvironments && !allowedEnvironments.includes(environmentFilter)) {
                whereClause.environment = { in: [] };
            } else {
                whereClause.environment = environmentFilter;
            }
        } else if (allowedEnvironments) {
            whereClause.environment = { in: allowedEnvironments };
        }

        if (typeFilter) {
            whereClause.type = typeFilter;
        }

        if (nameFilter) {
            whereClause.name = { contains: nameFilter }; // mysql string search is usually case-insensitive by default in prisma without mode: 'insensitive' (unless postgres)
        }

        const [total, credentials] = await Promise.all([
            prisma.credentialMaster.count({ where: whereClause }),
            prisma.credentialMaster.findMany({
                where: whereClause,
                select: { id: true, name: true, type: true, category: true, environment: true, description: true, version: true, createdOn: true, lastModifiedOn: true },
                skip: skip,
                take: pageSize,
                orderBy: { createdOn: 'desc' }
            })
        ]);

        const totalPages = Math.ceil(total / pageSize);
        const hasNext = page < totalPages;
        const hasPrevious = page > 1;

        const buildLink = (targetPage: number) => {
            const newUrl = new URL(req.url);
            newUrl.searchParams.set("page", targetPage.toString());
            newUrl.searchParams.set("pageSize", pageSize.toString());
            return `${newUrl.pathname}${newUrl.search}`;
        };

        const pagination = {
            page,
            pageSize,
            total,
            totalPages,
            hasNext,
            hasPrevious,
            next: hasNext ? buildLink(page + 1) : null,
            previous: hasPrevious ? buildLink(page - 1) : null
        };

        await logActivity({ apiClientId: client.id, clientName: client.name, authType, responseStatus: "SUCCESS", httpStatusCode: 200 });
        return NextResponse.json({ data: credentials, pagination });

    } catch (error) {
        console.error("API GET /credentials error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
