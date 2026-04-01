import { env } from 'process';
// Inject dummy keys for test if missing to avoid crypto throw
process.env.MASTER_KEY = process.env.MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

import { POST } from "./app/api/v1/auth/token/route";
import { GET as GET_CREDS } from "./app/api/v1/credentials/route";
import { prisma } from "./lib/prisma";
import crypto from 'crypto';
import { encrypt } from "./lib/crypto";

async function runTests() {
  console.log("=== Starting API Integration Tests ===");

  // Ensure an admin user exists to link
  let admin = await prisma.user.findFirst();
  if (!admin) {
    admin = await prisma.user.create({
      data: { email: "testadmin@test.com", role: "ADMIN", status: "ACTIVE" }
    });
  }

  // Generate test client
  const clientId = crypto.randomUUID();
  const rawSecret = crypto.randomBytes(32).toString('hex');
  const encSecret = encrypt(rawSecret);

  const apiClient = await prisma.apiClient.create({
    data: {
      name: "Test Runner Client",
      clientId,
      clientSecretHash: encSecret,
      scopes: JSON.stringify({ applications: [], environments: [], credentialTypes: [], accessMode: "READ_ONLY" }),
      tokenValiditySeconds: 60,
      createdById: admin.id
    }
  });

  console.log("-> Created API Client:", clientId);

  // 1. Test POST /auth/token
  const tokenReq = new Request("http://localhost/api/v1/auth/token", {
    method: "POST",
    headers: { "x-client-verify": "SUCCESS" },
    body: JSON.stringify({ clientId, clientSecret: rawSecret })
  });

  const tokenRes = await POST(tokenReq);
  const tokenData = await tokenRes.json();
  
  if (!tokenRes.ok) {
     console.error("Token Auth Failed:", tokenData);
     return process.exit(1);
  }

  const token = tokenData.access_token;
  console.log("-> Token Issued Successfully!");

  // 2. Test GET /credentials
  const timestamp = Date.now().toString();
  const reqUrl = "/api/v1/credentials";
  const dataToSign = `${reqUrl}:${timestamp}`;
  const signature = crypto.createHmac("sha256", rawSecret).update(dataToSign).digest("hex");

  const credsReq = new Request("http://localhost/api/v1/credentials", {
    method: "GET",
    headers: {
      "x-client-verify": "SUCCESS",
      "Authorization": `Bearer ${token}`,
      "x-api-timestamp": timestamp,
      "x-api-signature": signature
    }
  });

  const credsRes = await GET_CREDS(credsReq);
  const credsData = await credsRes.json();

  if (!credsRes.ok) {
     console.error("Credentials Fetch Failed:", credsData);
     await prisma.apiClient.delete({ where: { id: apiClient.id } });
     return process.exit(1);
  }

  console.log("-> Credentials Fetched:", credsData.data?.length, "records found.");

  // Clean up
  await prisma.apiClient.delete({ where: { id: apiClient.id } });
  
  console.log("=== All Tests Passed ===");
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
