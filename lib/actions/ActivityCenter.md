# Activity Center - Specification

## 1. Overview
The Activity Center is a consolidated, enterprise-grade viewing pane designed to provide centralized observability across all governance, authentication, network blocks, and API access events in CRED Secure. Operating in strict adherence to Section 3.4 of the SDD (Governance & Audit Logging), this feature delivers unified visibility through robust, natively paginated data layers.

## 2. Core Tab Capabilities

### 2.1 System Logs (AuditLogs)
- **Primary Source**: `audit_log` table (accessed via `getAuditLogs()`)
- **Scope**: Tracks creation, modification, and deletion events across Credentials, System Settings, Users, and Groups.
- **Fields Displayed**: Configurable columns mapping to Action, Entity Target (Credential/Setting), Performed By (Actor), Before/After value diffs, IP Address, and timestamp.
- **Security Posture**: 
  - Global Admins receive unrestricted access.
  - Standard users (if granted proxy access) interact through `getUserAccessContext` strict filtering, viewing only logs matching `allowedCategories` and `allowedEnvironments`.

### 2.2 Login Activity Logs (Security Events)
- **Primary Source**: `security_login_logs` table (accessed via `getLoginLogs()`)
- **Scope**: Specialized Auth telemetry including Authentications, MFA challenges, account lockouts, and risk signaling.
- **Fields Displayed**: Email, Outcome (SUCCESS/FAILURE/BLOCKED), Reason String, Risk Level Mapping (LOW/MEDIUM/HIGH), IP Address, and Geo/UA Fingerprints.
- **Archival Context**: Seamless contextual link to `security_login_logs_archive` records, driven by cron triggers as per operational thresholds.
- **Security Posture**: STRICTLY restricted to internal `ADMIN` or `SUPERUSER` contexts.

### 2.3 IP Security Blocks
- **Primary Source**: `security_ip_blocks` table (accessed via `getIpSecurityRecords()`)
- **Scope**: Represents network-level automated blocks executed by the system against repeated failed attempts.
- **Fields Displayed**: IP Address, Failed Attempts, Blocked Until, Block Counts (24h/Total), and Last Block Timestamp.
- **Actions**: Includes `Unblock IP` capabilities invoking `unblockIp()`.
- **Security Posture**: STRICTLY restricted to internal `ADMIN` or `SUPERUSER` contexts.

### 2.4 API Logs (API Telemetry)
- **Primary Source**: `api_activity_log` table (accessed via `getApiLogs()`)
- **Scope**: OAuth token endpoints, payload retrievals, certificate-based authentications parsing headless system clients.
- **Fields Displayed**: Client Context, Requested Endpoint, Status Codes (Success vs Failure thresholds), Validation Traces.
- **Security Posture**: STRICTLY restricted to internal `ADMIN` or `SUPERUSER` contexts.

## 3. Implementation Blueprint
- **Routing**: `app/(dashboard)/admin/activity-center/page.tsx`
- **Structure**: Utilizing standard Next.js App Router conventions with custom-built Tailwind CSS / Lucide React Tabs to segregate views efficiently without external UI library dependencies.
- **Data Rendering**: Leverage Next.js Server Components for secure data loading to eliminate client-side secret mapping strings. Tables must support search, filtering (Date range and Actions), and cursor-based/offset pagination natively coupled to Prisma ORM.

## 4. Required Server Actions Validation
Ensure `audit.ts`, `login-activity.ts`, `ip-blocks.ts`, and `api-logs.ts` within `lib/actions` contain robust authorization wrappers and support standard pagination paradigms where applicable.