import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

// ── API JWT SECRET VALIDATION ────────────────────────────────────────────────
// Must NOT throw at module load \u2014 Edge Runtime crash would affect all routes.
// Logs prominently and uses a random per-boot secret so every API token
// verification fails with 401 (safe degraded state) instead of 500.
function resolveApiJwtSecret(): string {
  const secret = process.env.API_JWT_SECRET || process.env.MASTER_KEY;
  if (secret) return secret;

  const isSetupMode =
    String(process.env.SETUP_MODE || '').trim().toLowerCase() === 'true';

  if (isSetupMode) {
    return 'credsecure-setup-mode-api-placeholder-not-for-production-use';
  }

  console.error(
    '\n🔴 [CredSecure] CRITICAL: API_JWT_SECRET or MASTER_KEY is not configured.\n' +
    '   All API token generation and verification will fail (401 Unauthorized).\n' +
    '   Set API_JWT_SECRET in AWS Amplify (or your local .env) and redeploy.\n'
  );
  return `credsecure-misconfigured-api-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}
// ─────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = resolveApiJwtSecret();
const secretKey = new TextEncoder().encode(JWT_SECRET);


export interface ApiClientContext {
  clientId: string;
  scopes: {
    applications: string[];
    environments: string[];
    credentialTypes: string[];
    accessMode: string;
  };
}

export async function generateApiJwt(client: any): Promise<string> {
  const payload = {
    clientId: client.clientId,
    scopes: typeof client.scopes === 'string' ? JSON.parse(client.scopes) : client.scopes,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${client.tokenValiditySeconds || 300}s`)
    .sign(secretKey);

  return token;
}

export async function verifyApiJwt(token: string): Promise<ApiClientContext | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as ApiClientContext;
  } catch (error) {
    console.error("JWT Verification failed", error);
    return null;
  }
}

export function validateApiHmacContext(reqUrl: string, signature: string, timestamp: string, clientSecret: string): boolean {
  // Check timestamp validity (e.g., within 5 minutes)
  const timeDiff = Math.abs(Date.now() - parseInt(timestamp, 10));
  if (timeDiff > 5 * 60 * 1000) return false;

  const dataToSign = `${reqUrl}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", clientSecret)
    .update(dataToSign)
    .digest("hex");

  // Time-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch(e) {
      return signature === expectedSignature;
  }
}

export function getApiDynamicBaseUrl(req: Request): string {
  const url = new URL(req.url);
  const protocol = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  return `${protocol}://${host}`;
}

export function verifyMTLSHeaders(req: Request): { isSuccess: boolean; thumbprint?: string; error?: string } {
  const verifyHeader = req.headers.get("x-client-verify");
  const thumbprint = req.headers.get("x-client-fingerprint") || undefined;
  
  if (verifyHeader === "SUCCESS") {
    return { isSuccess: true, thumbprint };
  }
  return { isSuccess: false, error: "Missing or invalid x-client-verify header." };
}
