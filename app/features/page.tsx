import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CapabilityMapVisual } from "@/components/marketing/CapabilityMapVisual";
import { FeaturesSection, FeatureModuleData } from "@/components/marketing/FeaturesSection";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown, Layers } from "lucide-react";

export const metadata = {
    title: "Features | CredSecure — Full Platform Capabilities",
    description: "Explore the complete capability breakdown of CredSecure: credential vault, IAM, authentication, API gateway, audit compliance, vendor access, one-time secrets, branding, database management, and licensing.",
};

export default async function FeaturesPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    const featureModules: FeatureModuleData[] = [
        {
            id: "credential-vault",
            title: "Credential Vault",
            items: [
                "Six specialized credential types: Password, API/OAuth, Keys & Certificates, Token, Encrypted File, Secure Note",
                "AES-256-GCM encryption with unique initialization vectors per record",
                "Decoupled storage — metadata and encrypted payloads in separate layers",
                "Credential lifecycle: create, view, edit, delete with version tracking",
                "Expiry monitoring with configurable alert windows (60-day default)",
                "Personal vs. shared credential isolation with strict visibility controls",
                "Status management: Active, Expired, Revoked",
                "Ownership attribution with creator and last-modifier tracking",
                "Full-text search across name, description, username, and file names",
                "Multi-axis filtering by type, category, environment, expiry status, and scope",
                "Server-side pagination with configurable page size",
                "CSV bulk import with row-level Zod validation, deduplication, and error reporting",
            ],
        },
        {
            id: "identity-access-management",
            title: "Identity & Access Management",
            items: [
                "Multi-tiered roles: User, Admin, Super Admin",
                "Dynamic user groups with organizational classification",
                "Many-to-many user-group mapping with assignment audit trail",
                "Category-scoped and environment-scoped permissions per group membership",
                "Named access group policies with per-feature permission assignments",
                "Five-level permission hierarchy: ALL, ALL_SCOPED, VIEW, VIEW_MASKED, NO_ACCESS",
                "Five enforcement actions per feature: View, Create, Edit, Delete, Unmask",
                "Highest-wins permission aggregation across multiple group memberships",
                "Automatic sensitive field masking with deep-clone server-side enforcement",
                "Runtime validation ensuring every sensitive schema field is registered",
                "Version-based RBAC cache invalidation for session coherence",
                "Session-embedded access context for sub-millisecond authorization",
            ],
        },
        {
            id: "authentication-security",
            title: "Authentication & Security",
            items: [
                "Mandatory TOTP-based Two-Factor Authentication with encrypted secret storage",
                "QR code generation for authenticator app enrollment",
                "2FA reconfiguration flow with time-limited email tokens for lost devices",
                "Organization-wide mandatory 2FA toggle",
                "Enterprise password policy: 12+ characters, uppercase, lowercase, number, special character",
                "Secure password reset with rate-limited, single-use tokens (1-hour expiry)",
                "Anti-enumeration protection on login and password reset flows",
                "Adaptive CAPTCHA triggered after suspicious authentication patterns",
                "Configurable session timeout with automatic invalidation (default 15 minutes)",
                "Pre-login security check validating IP blocks, user locks, and CAPTCHA before session creation",
            ],
        },
        {
            id: "api-gateway",
            title: "API Gateway",
            items: [
                "Global API access toggle for instant exposure control",
                "Three security tiers: Standard (OAuth 2.0), Secure (+ mTLS), Enterprise (+ HMAC)",
                "OAuth 2.0 Client Credentials flow with encrypted client secrets",
                "Mutual TLS certificate verification with thumbprint binding",
                "HMAC request signature validation with timing-safe comparison",
                "Configurable token validity per client",
                "Per-endpoint rate limiting with sliding window enforcement",
                "Optional rate limit response headers (X-RateLimit-Limit, Remaining, Reset)",
                "Application and environment scope enforcement per API client",
                "Comprehensive API activity logging with unique request ID tracing",
                "Rate limit violations feed into IP abuse escalation model",
                "Client secret expiry tracking for rotation reminders",
            ],
        },
        {
            id: "audit-compliance",
            title: "Audit & Compliance",
            items: [
                "Transactional audit logging for all state-changing operations",
                "Differential auditing with structured before/after change tracking",
                "Automatic sensitive data sanitization in audit records",
                "Login activity logging with outcome, category, reason code, and risk classification",
                "Risk level derivation: Blocked → High, MFA failure → Medium, Standard failure → Low",
                "Login log archival to cold storage with batch traceability",
                "SIEM-ready structured JSON log output (Splunk, Datadog, CloudWatch compatible)",
                "Configurable personal credential audit policy",
                "Audit throttling for repeated forbidden-access attempts to prevent log flooding",
            ],
        },
        {
            id: "external-vendor-access",
            title: "External Vendor Access",
            items: [
                "External user flag with vendor organization identification",
                "Access type control: API or Portal modes",
                "Time-bound access windows with automatic session termination on expiry",
                "Credential-level scoping — vendors see only explicitly shared credential IDs",
                "Category and environment scoping for external users",
                "Route-level restrictions blocking admin, settings, and internal features",
                "External invite flow with pre-configured scope and vendor metadata",
                "Search isolation preventing external users from discovering internal users",
            ],
        },
        {
            id: "one-time-secret-sharing",
            title: "One-Time Secret Sharing",
            items: [
                "Ephemeral encrypted secrets with configurable maximum view count",
                "Time-to-live (TTL) in hours with automatic expiry",
                "Two sharing methods: Link (copy URL) or Email (branded email with link)",
                "Two-step reveal flow — metadata shown first, explicit click required to decrypt",
                "Manual revocation by creator or administrator",
                "Bulk cleanup utility for expired and revoked secrets",
                "Public access links work without authentication",
                "RBAC-protected creation and management",
            ],
        },
        {
            id: "custom-branding-whitelabeling",
            title: "Custom Branding & Whitelabeling",
            items: [
                "Configurable application name displayed across the entire platform",
                "Company name for footer and branding contexts",
                "Custom logo upload (Base64, max 500KB) displayed in header, login, and emails",
                "Theme color configuration for UI accent customization",
                "Dynamic email branding — all automated emails pull logo and app name",
                "Dynamic sender identity formatted with application name",
            ],
        },
        {
            id: "database-management",
            title: "Database Management",
            items: [
                "Database info panel: type, host, port, user, SSL status, connection latency",
                "Automated schema drift detection comparing definitions against live database",
                "Detection of missing tables, missing columns, and orphaned tables",
                "One-click schema synchronization from the administration interface",
                "Boot-time auto-sync for zero-downtime deployments",
                "Multi-path schema resolution for AWS Amplify and various deployment topologies",
            ],
        },
        {
            id: "licensing-system-governance",
            title: "Licensing & System Governance",
            items: [
                "Encrypted license parameter storage with individual key-value encryption",
                "Cryptographic signature verification preventing offline tampering",
                "Five license states: Valid, Grace, Locked, Unactivated, Compromised",
                "Graceful degradation with grace period alerts before capability restriction",
                "User limit enforcement against license-defined active user counts",
                "In-memory license cache for sub-200ms authorization checks",
                "Boot-time license evaluation via server startup hooks",
                "Milestone-based alert logging to prevent duplicate notifications",
            ],
        },
    ];

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 font-sans">
            <MarketingNavbar
                applicationName={settings.applicationName || "CredSecure"}
                isLoggedIn={!!session?.user}
            />

            <main className="relative z-10 pt-16">

                {/* Redesigned Features Hero */}
                <section className="py-14 sm:py-18 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                        
                        {/* Left Content Column */}
                        <div className="lg:col-span-7 space-y-5 text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    FEATURES
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-[2.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25] max-w-2xl">
                                <div>Everything You Need to Control</div>
                                <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 mt-1">
                                    Credential Operations.
                                </div>
                            </h1>

                            <p className="text-base sm:text-lg text-slate-650 dark:text-slate-300 leading-relaxed max-w-xl">
                                From secure storage and access control to API security, audit, vendor access and credential provisioning, CredSecure brings the capabilities needed to manage credential operations in one governed platform.
                            </p>

                            {/* CTA Actions */}
                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                <a href="#quick-feature-navigator">
                                    <Button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all inline-flex items-center gap-2">
                                        Explore Capabilities
                                        <ArrowDown className="w-4 h-4" />
                                    </Button>
                                </a>

                                <Link href="/request-demo">
                                    <Button variant="outline" className="h-11 px-6 border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-lg transition-colors">
                                        Request Demo
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Right Column: Capability Map Visual */}
                        <div className="lg:col-span-5">
                            <CapabilityMapVisual />
                        </div>

                    </div>
                </section>

                {/* Features Section (Navigator Carousel + Single-Open Accordion) */}
                <FeaturesSection modules={featureModules} />

                {/* CTA */}
                <section className="py-20 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01]">
                    <div className="max-w-2xl mx-auto px-4 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
                            See These Capabilities in Action
                        </h2>
                        <p className="text-sm text-slate-650 dark:text-slate-400 mb-8 leading-relaxed">
                            Schedule a walkthrough tailored to the modules most relevant to your credential governance requirements.
                        </p>
                        <Link href="/request-demo">
                            <Button className="h-11 px-8 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2">
                                Request Demo
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <MarketingFooter
                applicationName={settings.applicationName || "CredSecure"}
                companyName={settings.companyName || "Innodhee Services Pvt Ltd"}
            />

            {/* Floating Credential Utility */}
            <FloatingCredentialWidget />
        </div>
    );
}
