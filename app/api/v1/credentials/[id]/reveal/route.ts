import { NextResponse } from "next/server";
import { validateExternalApiPipeline } from "@/lib/api-pipeline";
import { decrypt } from "@/lib/crypto";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;

        const validation = await validateExternalApiPipeline(req, id, "REVEAL_CREDENTIAL");
        if (validation.errorResponse) return validation.errorResponse;

        const { credential, clientRow, logActivity, authType, rateLimitHeaders } = validation;
        
        let payload: any = { 
            name: credential.name, 
            type: credential.type === "API_OAUTH" ? "OAUTH" : credential.type, 
            category: credential.category,
            environment: credential.environment,
            description: credential.description,
            expiryDate: credential.expiryDate
        };

        if (credential.type === "PASSWORD" && credential.detailsPassword) {
            payload.username = credential.detailsPassword.username;
            payload.password = decrypt(credential.detailsPassword.passwordEncrypted);
            payload.host = credential.detailsPassword.host;
            payload.port = credential.detailsPassword.port;
        } else if (credential.type === "API_OAUTH" && credential.detailsApi) {
            const d = credential.detailsApi;

            payload.credentialType = "API_OAUTH";
            payload.grantType = d.grantType || "CLIENT_CREDENTIALS";
            payload.tokenUrl = d.tokenEndpoint || "";
            if (d.authEndpoint) {
                payload.authUrl = d.authEndpoint; // Included solely if populated on a legacy record
            }
            payload.clientId = d.clientId || "";
            payload.clientSecret = d.clientSecretEnc ? decrypt(d.clientSecretEnc) : "";
            payload.scope = d.scope || (d as any).scopes || "";
            payload.grantTypeTransmission = d.grantTypeTransmission || "BODY";
            payload.clientAuthentication = d.clientAuthentication || "HEADER";
            payload.contentType = d.contentType || "APPLICATION_X_WWW_FORM_URLENCODED";
            payload.resource = d.resource || "";
            payload.audience = d.audience || "";

            let customParamsParsed: any[] = [];
            if (d.customParameters) {
                try {
                    const decryptedStr = decrypt(d.customParameters);
                    customParamsParsed = JSON.parse(decryptedStr);
                } catch (e) {
                    console.error("Failed to parse customParameters in reveal API", e);
                }
            }
            payload.customParameters = customParamsParsed;
        } else if (credential.type === "TOKEN" && credential.detailsToken) {
            payload.token = decrypt(credential.detailsToken.tokenEncrypted);
            payload.tokenType = credential.detailsToken.tokenType;
            payload.issuer = credential.detailsToken.issuer;
        } else if (credential.type === "KEY_CERT" && credential.detailsKeyCert) {
            payload.keyType = credential.detailsKeyCert.keyType;
            payload.keyFormat = credential.detailsKeyCert.keyFormat;
            
            if (credential.detailsKeyCert.passphraseEnc) { 
                payload.passphrase = decrypt(credential.detailsKeyCert.passphraseEnc); 
            }
            
            payload.files = [];
            if (credential.detailsKeyCert.publicKeyFileName || credential.detailsKeyCert.publicKey) {
                 payload.files.push({
                     fileId: "pub_1",
                     fileName: credential.detailsKeyCert.publicKeyFileName || "public.pem",
                     fileType: "PUBLIC_KEY"
                 });
            }
            if (credential.detailsKeyCert.privateKeyFileName || credential.detailsKeyCert.privateKeyEnc) {
                 payload.files.push({
                     fileId: "priv_1",
                     fileName: credential.detailsKeyCert.privateKeyFileName || "private.key",
                     fileType: "PRIVATE_KEY"
                 });
            }
            if (credential.detailsKeyCert.certificateFile) {
                 payload.files.push({
                     fileId: "cert_1",
                     fileName: "certificate.crt",
                     fileType: "CERTIFICATE"
                 });
            }
            if (credential.detailsKeyCert.certificateChain) {
                 payload.files.push({
                     fileId: "chain_1",
                     fileName: "chain.crt",
                     fileType: "CERTIFICATE_CHAIN"
                 });
            }
        } else if (credential.type === "FILE" && credential.detailsFile) {
            payload.files = [];
            if (credential.detailsFile.fileName) {
                payload.files.push({
                    fileId: "file_1",
                    fileName: credential.detailsFile.fileName,
                    fileType: credential.detailsFile.fileType || "FILE"
                });
            }
        } else if (credential.type === "SECURE_NOTE" && credential.detailsNote) {
            payload.note = decrypt(credential.detailsNote.noteEncrypted);
        }

        await logActivity({ credentialId: id, application: credential.category || "", environment: credential.environment || "", apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "SUCCESS", httpStatusCode: 200 });
        
        return NextResponse.json({ data: payload }, { headers: rateLimitHeaders });
    } catch (e) {
        console.error("Reveal API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
