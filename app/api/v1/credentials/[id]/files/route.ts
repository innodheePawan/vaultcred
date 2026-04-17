import { NextResponse } from "next/server";
import { validateExternalApiPipeline } from "@/lib/api-pipeline";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;

        const validation = await validateExternalApiPipeline(req, id, "LIST_FILES");
        if (validation.errorResponse) return validation.errorResponse;

        const { credential, clientRow, logActivity, authType } = validation;
        
        let files = [];

        if (credential.type === "KEY_CERT" && credential.detailsKeyCert) {
            const certDetails = credential.detailsKeyCert;
            
            if (certDetails.certificateChain || certDetails.certificateFile) {
                files.push({ 
                    fileId: 'certificate', 
                    name: 'certificate.crt', // Standard convention since DB doesn't store cert filename
                    type: 'CERTIFICATE' 
                });
            }
            
            if (certDetails.privateKeyEnc) {
                files.push({ 
                    fileId: 'privateKey', 
                    name: certDetails.privateKeyFileName || 'private.key', 
                    type: 'PRIVATE_KEY' 
                });
            }
            
            if (certDetails.publicKey) {
                files.push({ 
                    fileId: 'publicKey', 
                    name: certDetails.publicKeyFileName || 'public.key', 
                    type: 'PUBLIC_KEY' 
                });
            }
        } else if (credential.type === "FILE" && credential.detailsFile) {
            files.push({ 
               fileId: 'fileContent', 
               name: credential.detailsFile.fileName || 'file.bin', 
               type: credential.detailsFile.fileType || 'FILE' 
            });
        }

        await logActivity({ credentialId: id, application: credential.category || "", environment: credential.environment || "", apiClientId: clientRow.api_client_id, clientName: clientRow.client_name, authType, responseStatus: "SUCCESS", httpStatusCode: 200 });
        
        return NextResponse.json({ data: files });
    } catch (e) {
        console.error("List Files API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
