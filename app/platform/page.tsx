import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import { PlatformHeroVisual } from "@/components/marketing/PlatformHeroVisual";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    ChevronRight,
    Database,
    Fingerprint,
    FileSearch,
    Server,
    AlertTriangle,
    Activity,
    KeyRound,
    FileKey,
    FileText,
    FileLock,
    FileCode,
    Shield,
} from "lucide-react";

export const metadata = {
    title: "Platform | CredSecure — Operational Credential Governance",
    description: "Explore how CredSecure governs credential operations across six integrated domains: credential lifecycle, access governance, audit compliance, API security, threat protection, and operational infrastructure.",
};

export default async function PlatformPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 font-sans">
            <MarketingNavbar
                applicationName={settings.applicationName || "CredSecure"}
                isLoggedIn={!!session?.user}
            />

            <main className="relative z-10 pt-16">

                {/* Hero */}
                <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 space-y-6">
                            <div>
                                <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400/70 mb-3 font-semibold">Platform Overview</div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    One Platform to Secure, Control and Track Your Credentials
                                </h1>
                            </div>
                            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                                See how CredSecure brings credential security, access control, lifecycle management and audit together in one governed platform.
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Link href="#credential-governance">
                                    <Button className="h-11 px-6 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-semibold rounded-lg shadow-sm cursor-pointer flex items-center gap-2">
                                        Explore Capabilities <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/request-demo">
                                    <Button variant="outline" className="h-11 px-6 bg-transparent border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                                        Request Demo
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="lg:col-span-5">
                            <PlatformHeroVisual />
                        </div>
                    </div>
                </section>

                {/* Governance Lifecycle Flow */}
                <section className="border-y border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-6 text-center">Operational Governance Lifecycle</div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">
                            {[
                                { label: "Provision", desc: "Register & organize" },
                                { label: "Govern", desc: "Control access" },
                                { label: "Monitor", desc: "Track activity" },
                                { label: "Enforce", desc: "Apply policies" },
                                { label: "Revoke", desc: "Expire access" },
                                { label: "Audit", desc: "Record every change" },
                            ].map((step, idx) => (
                                <div key={idx} className="flex items-center">
                                    <div className="text-center px-4 py-3 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] min-w-[120px]">
                                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{step.label}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{step.desc}</div>
                                    </div>
                                    {idx < 5 && (
                                        <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-600 mx-1 hidden sm:block shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 6 Governance Domain Deep-Dives */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">

                    {/* Domain 1: Credential Governance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start" id="credential-governance">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Database className="w-5 h-5 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Credential Governance</h2>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Complete lifecycle control for every credential type in your organization. From provisioning through expiry, every credential is classified, encrypted, tracked, and governed.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Six specialized credential types — passwords, API/OAuth, keys & certificates, tokens, encrypted files, and secure notes",
                                    "AES-256-GCM encryption with unique initialization vectors per record",
                                    "Ownership attribution with creator and modifier tracking",
                                    "Expiry monitoring with configurable alert windows",
                                    "Version tracking across credential updates",
                                    "Personal and shared credential isolation",
                                    "CSV bulk import with row-level validation",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <div className="w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-500/60 mt-2 shrink-0" />
                                        <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white/80 dark:bg-white/[0.02] p-6">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-4">Supported Credential Types</div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { name: "Password", desc: "Database, application, service accounts", icon: KeyRound },
                                    { name: "API / OAuth", desc: "Client credentials, tokens, endpoints", icon: Server },
                                    { name: "Keys & Certificates", desc: "SSL, SSH, PGP, TLS, signing keys", icon: FileKey },
                                    { name: "Token", desc: "Bearer, JWT, session tokens", icon: Shield },
                                    { name: "Encrypted File", desc: "ZIP, TAR, protected documents", icon: FileLock },
                                    { name: "Secure Note", desc: "Recovery keys, operational notes", icon: FileText },
                                ].map((type, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01]">
                                        <type.icon className="w-4 h-4 text-slate-500 mb-2" strokeWidth={1.5} />
                                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{type.name}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{type.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/[0.04]" />

                    {/* Domain 2: Access Governance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start" id="access-governance">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Fingerprint className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Governance</h2>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Granular, policy-driven access control that enforces least-privilege principles across every credential interaction. No implicit trust at any layer.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Five-level permission hierarchy: Full Access, Scoped Access, View, Masked View, No Access",
                                    "Dynamic user groups with category and environment scoping",
                                    "Access group policies with per-feature permission assignments",
                                    "Highest-wins aggregation across multiple group memberships",
                                    "Sensitive field masking for restricted visibility roles",
                                    "External vendor isolation with time-bound credential-level scoping",
                                    "Session-embedded RBAC context for sub-millisecond authorization",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500/60 mt-2 shrink-0" />
                                        <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white/80 dark:bg-white/[0.02] p-6">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-4">Permission Hierarchy</div>
                            <div className="space-y-2">
                                {[
                                    { level: "ALL", desc: "Full global access — view, create, edit, delete, unmask", color: "text-emerald-400", border: "border-emerald-500/20" },
                                    { level: "ALL_SCOPED", desc: "Full access restricted to assigned categories and environments", color: "text-blue-400", border: "border-blue-500/20" },
                                    { level: "VIEW", desc: "Read-only with plaintext decryption allowed", color: "text-indigo-400", border: "border-indigo-500/20" },
                                    { level: "VIEW_MASKED", desc: "Read-only with sensitive fields masked", color: "text-amber-400", border: "border-amber-500/20" },
                                    { level: "NO_ACCESS", desc: "Complete denial — feature invisible", color: "text-rose-400", border: "border-rose-500/20" },
                                ].map((perm, idx) => (
                                    <div key={idx} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${perm.border} bg-slate-50 dark:bg-white/[0.01]`}>
                                        <span className={`text-[10px] font-mono font-bold ${perm.color} min-w-[90px]`}>{perm.level}</span>
                                        <span className="text-[11px] text-slate-600 dark:text-slate-500">{perm.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/[0.04]" />

                    {/* Domain 3: Audit & Compliance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start" id="audit-compliance">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileSearch className="w-5 h-5 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Audit & Compliance</h2>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Immutable, tamper-evident audit trails across every operational action. Built for SOC 2 readiness, regulatory inquiries, and forensic investigations.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Transactional audit logging for all state-changing operations",
                                    "Differential auditing with structured before/after change tracking",
                                    "Automatic sensitive data sanitization in audit records",
                                    "Login activity logging with risk classification and geo-tracking",
                                    "Configurable log archival with batch traceability",
                                    "SIEM-ready structured JSON output for security monitoring integration",
                                    "Configurable personal credential audit policy",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <div className="w-1 h-1 rounded-full bg-violet-500/60 mt-2 shrink-0" />
                                        <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white/80 dark:bg-white/[0.02] p-6">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-4">Audit Event Categories</div>
                            <div className="space-y-2">
                                {[
                                    "Credential create, update, delete, and view events",
                                    "Access grant, modify, and revocation events",
                                    "Authentication success, failure, and block events",
                                    "API client registration and usage events",
                                    "Settings and configuration change events",
                                    "User invite, activation, and status change events",
                                    "IP block and unblock administrative events",
                                    "Bulk import and one-time secret lifecycle events",
                                ].map((event, idx) => (
                                    <div key={idx} className="flex items-start gap-2 px-3 py-2 rounded border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01]">
                                        <FileCode className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" strokeWidth={1.5} />
                                        <span className="text-[11px] text-slate-600 dark:text-slate-500">{event}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/[0.04]" />

                    {/* Domain 4: API Security */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start" id="api-security">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">API Security</h2>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Controlled external API access with three security tiers, configurable rate governance, and comprehensive activity logging for every request.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Three security tiers: Standard, Secure (mTLS), and Enterprise (mTLS + HMAC)",
                                    "OAuth 2.0 Client Credentials flow with encrypted client secrets",
                                    "Per-endpoint configurable rate limiting with sliding windows",
                                    "Global API access toggle for instant exposure control",
                                    "Application and environment scope enforcement per client",
                                    "Comprehensive API activity logging with request tracing",
                                    "Rate limit violation escalation to IP abuse prevention",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <div className="w-1 h-1 rounded-full bg-purple-500/60 mt-2 shrink-0" />
                                        <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white/80 dark:bg-white/[0.02] p-6">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-4">Security Tiers</div>
                            <div className="space-y-3">
                                {[
                                    { tier: "STANDARD", desc: "OAuth 2.0 Client Credentials authentication", color: "text-blue-400", border: "border-l-blue-500/30" },
                                    { tier: "SECURE", desc: "OAuth 2.0 + Mutual TLS certificate verification", color: "text-indigo-400", border: "border-l-indigo-500/30" },
                                    { tier: "ENTERPRISE", desc: "OAuth 2.0 + mTLS + HMAC request signature validation", color: "text-purple-400", border: "border-l-purple-500/30" },
                                ].map((t, idx) => (
                                    <div key={idx} className={`px-4 py-3 rounded-lg border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] border-l-2 ${t.border}`}>
                                        <div className={`text-[10px] font-mono font-bold ${t.color} mb-1`}>{t.tier}</div>
                                        <div className="text-[11px] text-slate-605 dark:text-slate-500">{t.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/[0.04]" />

                    {/* Domain 5: Threat Protection */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start" id="threat-protection">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Threat Protection</h2>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Adaptive, escalating defense against brute-force attacks, credential stuffing, and API abuse with automatic progressive response.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Progressive user-level throttling: CAPTCHA → account lock",
                                    "Multi-tier IP blocking: temporary → extended → permanent ban",
                                    "Cross-functional enforcement across login, password reset, 2FA, and API flows",
                                    "Automatic failure counter reset on successful authentication",
                                    "Administrative IP management with search and manual override",
                                    "Audit-logged unblock actions for administrative accountability",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <div className="w-1 h-1 rounded-full bg-rose-500/60 mt-2 shrink-0" />
                                        <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white/80 dark:bg-white/[0.02] p-6">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-4">Escalation Model</div>
                            <div className="space-y-0">
                                {[
                                    { level: "Level 1", action: "Adaptive CAPTCHA Challenge", trigger: "Suspicious login pattern detected", color: "text-amber-400", border: "border-amber-500/20" },
                                    { level: "Level 2", action: "Temporary Account Lock", trigger: "Repeated authentication failures", color: "text-orange-400", border: "border-orange-500/20" },
                                    { level: "Level 3", action: "Temporary IP Block", trigger: "Sustained abuse from single source", color: "text-rose-400", border: "border-rose-500/20" },
                                    { level: "Level 4", action: "Extended IP Block", trigger: "Repeated block within time window", color: "text-red-400", border: "border-red-500/20" },
                                    { level: "Level 5", action: "Permanent IP Ban", trigger: "Cumulative abuse threshold exceeded", color: "text-red-500", border: "border-red-600/20" },
                                ].map((esc, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-7 h-7 rounded-full border ${esc.border} bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center text-[9px] font-mono font-bold ${esc.color}`}>
                                                {idx + 1}
                                            </div>
                                            {idx < 4 && <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.06]" />}
                                        </div>
                                        <div className="pb-4">
                                            <div className={`text-xs font-semibold ${esc.color}`}>{esc.action}</div>
                                            <div className="text-[10px] text-slate-600 dark:text-slate-500">{esc.trigger}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/[0.04]" />

                    {/* Domain 6: Operational Infrastructure */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start" id="operational-infrastructure">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="w-5 h-5 text-emerald-605 dark:text-emerald-400" strokeWidth={1.5} />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Operational Infrastructure</h2>
                            </div>
                            <p className="text-sm text-slate-605 dark:text-slate-400 leading-relaxed mb-6">
                                Platform integrity, schema governance, and deployment observability for production-grade credential governance operations.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Automated schema drift detection comparing definitions against live database state",
                                    "One-click schema synchronization from the administration interface",
                                    "Boot-time auto-sync for zero-downtime deployment integrity",
                                    "Cryptographically verified licensing with grace period management",
                                    "User limit enforcement against license parameters",
                                    "Health endpoints for load balancer and monitoring integration",
                                    "Structured JSON logging for SIEM ingestion",
                                    "Dynamic base URL detection for reverse proxy compatibility",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500/60 mt-2 shrink-0" />
                                        <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white/80 dark:bg-white/[0.02] p-6">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-4">System Health Indicators</div>
                            <div className="space-y-3">
                                {[
                                    { label: "Database Connection", status: "Monitored", desc: "Connection health, latency, and drift status" },
                                    { label: "License State", status: "Verified", desc: "Cryptographic verification at boot and runtime" },
                                    { label: "Schema Integrity", status: "Auto-Sync", desc: "Automated detection and resolution of schema drift" },
                                    { label: "SMTP Delivery", status: "Configurable", desc: "Email delivery with test connection verification" },
                                ].map((health, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-3 py-2.5 rounded border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01]">
                                        <div>
                                            <div className="text-xs font-semibold text-slate-900 dark:text-white">{health.label}</div>
                                            <div className="text-[10px] text-slate-500">{health.desc}</div>
                                        </div>
                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded">{health.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01]">
                    <div className="max-w-2xl mx-auto px-4 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
                            Ready to Govern Your Credential Operations?
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            Explore how six integrated governance domains can transform your organization&apos;s operational credential security posture.
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
