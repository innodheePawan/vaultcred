import { NextResponse } from "next/server";
import { validateExternalApiPipeline } from "@/lib/api-pipeline";
import { decrypt } from "@/lib/crypto";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;

        const validation = await validateExternalApiPipeline(req, id, "REVEAL_CREDENTIAL");
        if (validation.errorResponse) return validation.errorResponse;

        const { credential, clientRow, logActivity, authType } = validation;
        
        let payload: any = { 
            id: credential.id, 
            name: credential.name, 
            type: credential.type, 
            environment: credential.environment,
            category: credential.category
        };

        if (credential.type === "PASSWORD" && credential.detailsPassword) {
            payload.username = credential.detailsPassword.username;
            payload.password = decrypt(credential.detailsPassword.passwordEncrypted);
            payload.host = credential.detailsPassword.host;
            payload.port = credential.detailsPassword.port;
        } else if (credential.type === "API_OAUTH" && credential.detailsApi) {
            payload.clientId = credential.detailsApi.clientId;
            if (credential.detailsApi.clientSecretEnc) { payload.clientSecret = decrypt(credential.detailsApi.clientSecretEnc); }
            if (credential.detailsApi.apiKeyEncrypted) { payload.apiKey = decrypt(credential.detailsApi.apiKeyEncrypted); }
        } else if (credential.type === "TOKEN" && credential.detailsToken) {
            payload.tokenValue = decrypt(credential.detailsToken.tokenEncrypted);
        } else if (credential.type === "KEY_CERT" && credential.detailsKeyCert) {
            payload.fingerprint = credential.detailsKeyCert.fingerprint;
            payload.validFrom = credential.detailsKeyCert.validFrom;
            payload.validTo = credential.detailsKeyCert.validTo;
            // The actual private key / passphrase / certificate downloads via /files
        } else if (credential.type === "FILE" && credential.detailsFile) {
            payload.fileName = credential.detailsFile.fileName;
            payload.fileType = credential.detailsFile.fileType;
        } else if (credential.type === "SECURE_NOTE" && credential.detailsNote) {
            payload.note = decrypt(credential.detailsNote.noteEncrypted);
        }

        await logActivity({ credentialId: id, application: credential.category || "", environment: credential.environment || "", apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "SUCCESS", httpStatusCode: 200 });
        
        return NextResponse.json({ data: payload });
    } catch (e) {
        console.error("Reveal API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
