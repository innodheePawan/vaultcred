import { NextResponse } from "next/server";
import { validateExternalApiPipeline } from "@/lib/api-pipeline";
import { decrypt } from "@/lib/crypto";

export async function GET(req: Request, props: { params: Promise<{ id: string, fileId: string }> }) {
    try {
        const params = await props.params;
        const { id, fileId } = params;

        const validation = await validateExternalApiPipeline(req, id, "DOWNLOAD_FILE");
        if (validation.errorResponse) return validation.errorResponse;

        const { credential, clientRow, logActivity, authType } = validation;
        
        let contentStr = '';
        let fileName = 'credential_file';

        // Additional CHECK: ensure client has allowApiFileDownload for actual FILE types
        if (credential.type === "FILE") {
            const allowRaw = Number(clientRow.allow_file_download);
            if (allowRaw !== 1) {
                await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 403, errorMessage: "Client not authorized for file downloads" });
                return NextResponse.json({ error: "Client not authorized for file downloads" }, { status: 403 });
            }
        }

        if (credential.type === "KEY_CERT" && credential.detailsKeyCert) {
            const certDetails = credential.detailsKeyCert;
            
            if (fileId === 'certificate' && (certDetails.certificateChain || certDetails.certificateFile)) {
                // Return chain if available, else standard file
                contentStr = certDetails.certificateChain || certDetails.certificateFile || '';
                fileName = "certificate.crt";
            } else if (fileId === 'privateKey' && certDetails.privateKeyEnc) {
                try { contentStr = decrypt(certDetails.privateKeyEnc); } catch(e) {}
                fileName = certDetails.privateKeyFileName || "private.key";
            } else if (fileId === 'publicKey' && certDetails.publicKey) {
                contentStr = certDetails.publicKey;
                fileName = certDetails.publicKeyFileName || "public.key";
            } else {
                return NextResponse.json({ error: "File ID not found for this credential" }, { status: 404 });
            }
        } else if (credential.type === "FILE" && credential.detailsFile && fileId === 'fileContent') {
            const d = credential.detailsFile;
            fileName = d.fileName || 'file.bin';
            if (d.fileContent) {
                try { contentStr = decrypt(d.fileContent); } catch (e) {}
            } else if (d.filePath) {
                try {
                    const fs = await import('fs/promises');
                    contentStr = await fs.readFile(d.filePath, 'utf-8');
                } catch (e) { }
            }
        } else {
             return NextResponse.json({ error: "File ID not found or unsupported credential type" }, { status: 404 });
        }

        if (!contentStr) {
            await logActivity({ credentialId: id, apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "FAILURE", httpStatusCode: 404, errorMessage: "File content could not be resolved" });
            return NextResponse.json({ error: "File content unavailable" }, { status: 404 });
        }

        const isBase64Pattern = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(contentStr);
        const responseBuffer = (isBase64Pattern && contentStr.length % 4 === 0)
            ? Buffer.from(contentStr, 'base64')
            : Buffer.from(contentStr, 'utf-8');

        await logActivity({ credentialId: id, fileName, application: credential.category || "", environment: credential.environment || "", apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "SUCCESS", httpStatusCode: 200 });
        
        return new NextResponse(responseBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Length": responseBuffer.length.toString()
            }
        });
    } catch (e) {
        console.error("Download File API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
