# CRED Secure - Specification-Driven Development (SDD)

## 1. Executive Summary
**CRED Secure** is an enterprise-grade credential management system designed to serve as an on-premise or private-cloud vault securely storing highly sensitive artifacts including API keys, Server Passwords, Database Credentials, and Secure Notes. 
Built on a strictly decoupled cryptographically enforced architecture using Next.js 15 and MySQL via Prisma, it ensures data is encrypted at rest and in memory securely, bound by an immutable, mathematically verifiable licensing engine.

---

## 2. Technology Stack & Architecture
- **Framework**: Next.js 15 (App Router with Server Actions).
- **Runtime**: Node.js >= 18.x
- **Database**: MySQL (Accessed exclusively via Prisma ORM).
- **Security & Cryptography**: 
  - Standard AES-256-GCM for structural vault encryption.
  - OpenPGP.js for decentralized offline digital signature activation/licensing.
  - bcrypt.js for standard user/admin authentication hashing.
- **Styling**: Tailwind CSS & Lucide React Icons.

### 2.1 Component Architecture
The application runs as a monolith, with logical separations:
- **Client Tier**: React Server Components rendering HTML directly, augmented with strict `"use client"` hydration only where interactive DOM manipulation is required.
- **Action Tier**: Next.js Server Actions encapsulate all database and cryptographic logic, ensuring zero decryption keys or plaintexts ever enter the browser DOM.
- **Data Tier**: Prisma connected to MySQL. Encrypted payloads are stored as `LongBlob` or `LongText` natively preventing DBA snooping.

---

## 3. Core Functional Modules

### 3.1 Vault & Credential Management (The Core)
- **Supported Paradigms**: Login/Passwords, DB Admin Tokens, SSH keys (PEM/RSA), Server Data, Secure Notes.
- **Encryption Flow**: 
  1. User inputs raw secret in the browser.
  2. TLS pipes the raw secret into Server Actions.
  3. Server fetches global `MASTER_KEY` environment variable.
  4. Natively executes AES-256-GCM cipher appending IV and Auth tag natively to the ciphertext block.
  5. The ciphertext is piped into the SQL tier.

### 3.2 Enterprise Licensing Engine (Deterministic State)
- **Mechanism**: On-Boot and On-Request deterministic mathematical checking.
- **Verification Loop**: At the `/activation` layer, the Application fetches [Keys/license-public.asc](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/Keys/license-public.asc), verifying PGP signatures over 6 distinct permutations of JSON serialization representations (Minified, 2-spaced, 4-spaced, etc.) ensuring robust state extraction regardless of upstream APi stringification paradigms. 
- **States**: 
  - `UNACTIVATED`: Pre-setup.
  - `VALID`: Operations running optimally.
  - `GRACE`: Time boundary exceeded, alerts firing, standard operations unimpeded.
  - `LOCKED`: Freezes decrypt APIs throwing HTTP 403 blocks for all standard IAM routes allowing only SuperUser UI resolution.

### 3.3 IAM & Role-Based Access Control (RBAC)
- **Roles**: `USER`, `ADMIN`, `SUPERUSER`.
- **User Limits**: Evaluated sequentially upon Invite Generation. Binds to `entitlements.activeUsers` embedded within the cryptographic license envelope.
- **Groups**: Native many-to-many relationship defining structural vault access (e.g., DevOps Group gets SSH keys; Finance Group gets Billing API keys).

### 3.4 Governance & Audit Logging
The application relies on structural idempotency tracing.
- **Audit Views**: `System Settings`, `Users`, and [Credentials](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/lib/actions/credentials.ts#271-420) all fire transactionally coupled [AuditLog](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/lib/actions/audit.ts#75-205) entries. 
- **Security Event Logs**: Dedicated `LoginLog` structure preventing SQL logs mapping IP addresses, Risk Levels (High/Low), Device Fingerprints, and MFA failure limits.

---

## 4. Database Schema Specifications (Prisma Definitions)

### 4.1 Authentication & IAM
- **User**: Primary actor node ([id](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/middleware.ts#99-160), `email`, `passwordHash`, `role`, `status`, `lastLogin`).
- **Group**: Structural aggregator for credentials ([id](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/middleware.ts#99-160), `name`, `description`).
- *(Many-to-Many Maps)*: `UserGroup`, `CredentialGroup`.

### 4.2 Decoupled Credentials Tier
- **Credential**: Core node metadata ([id](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/middleware.ts#99-160), `name`, `type`, `username`, `website`).
- **CredentialSecret**: Isolated Table physically decoupled from [Credential](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/lib/actions/credentials.ts#271-420) storing exclusively the AES-encrypted secrets ensuring rapid table scans against metadata without dumping massive BLOB streams into memory context.

### 4.3 Governance
- **AuditLog**: Contains `userId`, `action`, `entityType`, `metadata`.
- **SystemSettings**: Singleton Row (`id=1`) containing `applicationName`, `smtpConfig`, `twoFactorMandatory`.

### 4.4 License & Signature Persistence
- **LicenseRegistry**: Symmetrically encrypted KV store. (Keys e.g: `ACTIVATION_STATUS`, `VALIDITY_TILL`, `RAW_PAYLOAD`). Secures parameters from local DBA tamper rendering the system `COMPROMISED` structurally upon mismatch.

---

## 5. Security Threat Model & Mitigations

### 5.1 Symmetric Key Extraction (Threat)
If an attacker attains SQL privileges, they still possess zero ability to view passwords without extracting the NextJS Server runtime memory or `.env` file explicitly.
**Mitigation**: Air-gapping the `.env` `MASTER_KEY` away from standard ops.

### 5.2 License Tampering (Threat)
Organization edits the `LicenseRegistry` manually extending `validityTill` by 10 years.
**Mitigation**: The PGP mathematical trace asserts upon the original stringified `RAW_PAYLOAD`. Mismatched signatures yield a `COMPROMISED` locked state instantly.

### 5.3 Internal Credential Exfiltration (Threat)
Standard user iterates the [Credential](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/lib/actions/credentials.ts#271-420) table ID parameters horizontally fetching secrets outside their group.
**Mitigation**: The NextJS server action (`getCredentialDecrypted`) asserts natively: `if (user_not_superuser && user_not_in_group) -> HTTP 403 Forbidden`.

---

## 6. End-to-End Application Flows

### 6.1 Initial Provisioning (Zero-State)
1. User hits `https://vaultcred.company.local/`
2. Next.js Middleware asserts `license-enforcement` algorithm.
3. Fails asserting `UNACTIVATED` boundary. Natively structurally redirects browser to `/activation`.
4. User pastes the `.txt` Enterprise PGP manifest Keys.
5. Server signs a Hardware fingerprint (`timestamp`, `nonce`, `MAC/OS signature`), authenticates against Central Amplify APIs, stores signed JSON locally.
6. System reboots internal states yielding `VALID`.
7. Bootstraps single SuperUser Setup Screen `/setup`.

### 6.2 Standard Access (Day 2 Ops)
1. `USER` opens `.local/login`. Enters credentials. 
2. OTP/2FA generated native to the Auth pipeline. 
3. User dashboard resolves active Groups.
4. User queries for "Production DB Password".
5. Next.js locates Secret inside [CredentialSecret](file:///d:/RakeshProjects/credentialManagement-PB/vaultcred/components/credentials/CredentialSecrets.tsx#7-204).
6. Node.js `crypto` parses cipher, rips initialization vector, validates AES-GCM AuthTag natively.
7. Plaintext strings are mapped strictly into React Context memory state and injected into DOM natively (bypassing localstorage).
8. DOM is stripped upon page nav.

---

## 7. System Monitoring & Expansion Points
- **Alerting**: The system natively incorporates Cron evaluation via `LicenseAlertLog` bridging missing event triggers, issuing SMTP blocks mapping natively down to T-0 thresholds (60/30/15/7/3/1 days).
- **Future Scale**: Next.js Server Components native design easily maps to horizontal clustering, as cryptography explicitly bounds linearly with single-CPU overhead constraints. State relies entirely on MySQL Row Locks. 

---
*(End of Specification)*
