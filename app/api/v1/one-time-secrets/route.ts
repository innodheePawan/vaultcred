import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authenticateExternalApiClient } from '@/lib/api-pipeline';
import { generateSecureCredential } from '@/lib/utils/password-generator';
import { provisionOneTimeSecretCore } from '@/lib/actions/secrets';
import { getBaseUrl } from '@/lib/utils/url';
import { Prisma } from '@prisma/client';

const CreateOtsSchema = z.object({
    userName: z.string({ required_error: 'userName is required' })
        .trim()
        .min(1, 'userName cannot be empty')
        .max(100, 'userName exceeds maximum length of 100 characters'),
    email: z.string({ required_error: 'email is required' })
        .trim()
        .email('Invalid email address format'),
    referenceId: z.string()
        .trim()
        .min(1, 'referenceId cannot be empty string')
        .max(100, 'referenceId exceeds maximum length of 100 characters')
        .optional()
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const authResult = await authenticateExternalApiClient(req, 'one_time_secrets', 'CREATE_ONE_TIME_SECRET');
    if (authResult.errorResponse) {
        return authResult.errorResponse;
    }

    const { clientRecord, authType, rateLimitHeaders, logActivity } = authResult;

    // 1. Parse and Validate Request Payload
    let body: any;
    try {
        body = await req.json();
    } catch {
        await logActivity({
            apiClientId: clientRecord.id,
            clientName: clientRecord.name,
            authType,
            responseStatus: 'FAILURE',
            httpStatusCode: 400,
            errorMessage: 'Malformed JSON payload'
        });
        return NextResponse.json(
            { success: false, error: 'Bad Request', message: 'Malformed JSON payload' },
            { status: 400, headers: rateLimitHeaders }
        );
    }

    const parseResult = CreateOtsSchema.safeParse(body);
    if (!parseResult.success) {
        const validationErrors = parseResult.error.flatten().fieldErrors;
        await logActivity({
            apiClientId: clientRecord.id,
            clientName: clientRecord.name,
            authType,
            responseStatus: 'FAILURE',
            httpStatusCode: 400,
            errorMessage: JSON.stringify(validationErrors)
        });
        return NextResponse.json(
            {
                success: false,
                error: 'Bad Request',
                message: 'Validation failed',
                details: validationErrors
            },
            { status: 400, headers: rateLimitHeaders }
        );
    }

    const { userName, email, referenceId } = parseResult.data;

    // 2. Pre-check for duplicate referenceId scoped to this API client
    if (referenceId) {
        const existingSecret = await prisma.oneTimeSecret.findFirst({
            where: {
                apiClientId: clientRecord.id,
                referenceId
            },
            select: { id: true, referenceId: true }
        });

        if (existingSecret) {
            await logActivity({
                apiClientId: clientRecord.id,
                clientName: clientRecord.name,
                authType,
                responseStatus: 'FAILURE',
                httpStatusCode: 409,
                errorMessage: `Duplicate referenceId '${referenceId}' for API client`
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Conflict',
                    message: `A secret with referenceId '${referenceId}' already exists for this client.`,
                    otsId: existingSecret.id,
                    referenceId: existingSecret.referenceId
                },
                { status: 409, headers: rateLimitHeaders }
            );
        }
    }

    // 3. Generate Password (Exactly 16 characters, uppercase, lowercase, numbers, special characters)
    const generatedPassword = generateSecureCredential(16, true, true, true, true);

    // 4. Provision OTS Record (UUID primary key, 7-day validity, 5 maximum views)
    try {
        const provisionResult = await provisionOneTimeSecretCore({
            secretData: generatedPassword,
            name: `One-Time Secret - ${userName}`,
            recipientName: userName,
            recipientEmail: email,
            referenceId: referenceId || undefined,
            sharedVia: 'LINK',
            maxViews: 5,
            ttlHours: 168, // 7 days (7 * 24 hours)
            createdById: clientRecord.createdById,
            apiClientId: clientRecord.id,
            sendEmailNotification: false
        });

        const baseUrl = await getBaseUrl();
        const otsLink = `${baseUrl}/share/${provisionResult.token}`;

        // Audit & Activity Logging (Plaintext password, token, and otsLink are never logged)
        await logActivity({
            apiClientId: clientRecord.id,
            clientName: clientRecord.name,
            authType,
            responseStatus: 'SUCCESS',
            httpStatusCode: 201
        });

        const responseHeaders: Record<string, string> = {
            ...rateLimitHeaders,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };

        return NextResponse.json(
            {
                success: true,
                otsId: provisionResult.secret.id,
                referenceId: provisionResult.secret.referenceId,
                userName,
                email,
                generatedPassword,
                otsLink,
                status: 'CREATED',
                expiresAt: provisionResult.secret.expiresAt.toISOString(),
                maxViews: 5
            },
            { status: 201, headers: responseHeaders }
        );

    } catch (error: any) {
        // Handle concurrent duplicate constraint violation (P2002)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            if (referenceId) {
                const existing = await prisma.oneTimeSecret.findFirst({
                    where: { apiClientId: clientRecord.id, referenceId },
                    select: { id: true, referenceId: true }
                });

                if (existing) {
                    await logActivity({
                        apiClientId: clientRecord.id,
                        clientName: clientRecord.name,
                        authType,
                        responseStatus: 'FAILURE',
                        httpStatusCode: 409,
                        errorMessage: `Concurrent duplicate referenceId '${referenceId}' caught by database constraint`
                    });

                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Conflict',
                            message: `A secret with referenceId '${referenceId}' already exists for this client.`,
                            otsId: existing.id,
                            referenceId: existing.referenceId
                        },
                        { status: 409, headers: rateLimitHeaders }
                    );
                }
            }
        }

        console.error('[External OTS API Error]: Failed to create one-time secret:', error);
        await logActivity({
            apiClientId: clientRecord.id,
            clientName: clientRecord.name,
            authType,
            responseStatus: 'FAILURE',
            httpStatusCode: 500,
            errorMessage: 'Internal Server Error'
        });

        return NextResponse.json(
            { success: false, error: 'Internal Server Error', message: 'Failed to create one-time secret' },
            { status: 500, headers: rateLimitHeaders }
        );
    }
}

