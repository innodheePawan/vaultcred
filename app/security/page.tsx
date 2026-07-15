import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Lock,
    Database,
    ShieldCheck,
    KeyRound,
    Fingerprint,
    AlertTriangle,
    Server,
    CheckCircle2,
} from "lucide-react";

export const metadata = {
    title: "Security Architecture | CredSecure — Built for Enterprise Trust",
    description: "Explore the security architecture behind CredSecure: AES-256-GCM encryption, runtime-only decryption, zero trust RBAC, multi-tier threat protection, and cryptographic license verification.",
};

export default async function SecurityPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 font-sans">
            <MarketingNavbar
                applicationName={settings.applicationName || "CredSecure"}
                isLoggedIn={!!session?.user}
            />            <main className="relative z-10 pt-16">

                {/* Hero */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="max-w-4xl">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-4 font-semibold">Security Architecture</div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1] max-w-3xl">
                            Cryptographic Integrity & Operational Guarantees
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                            CredSecure is built on a foundation of cryptographic isolation, non-repudiation, and runtime protection boundaries. Discover the structural guarantees designed to protect sensitive identity variables and ensure absolute compliance.
                        </p>
                    </div>
                </section>

                {/* Technical Trust Strip */}
                <section className="border-y border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-[#090d16]/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">SECURITY MODEL GUARANTEES</span>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                {[
                                    "CRYPTOGRAPHIC ISOLATION",
                                    "RUNTIME PROTECTION BOUNDARY",
                                    "IMPLICIT ZERO-TRUST RBAC",
                                    "NON-REPUDIATION AUDITING",
                                    "SOVEREIGN AIR-GAPPED AUTHORITY",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                        <span className="text-[9px] font-mono text-slate-650 dark:text-slate-400 tracking-wider">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 1: Encryption Model */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Lock className="w-4 h-4" strokeWidth={2} />
                                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">LAYER 01</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Cryptographic Secret Protection</h2>
                            <p className="text-xs text-slate-605 dark:text-slate-400 leading-relaxed max-w-sm">
                                Guarantees regarding the storage, isolation, and processing bounds of encrypted secret variables within the system.
                            </p>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { 
                                    title: "Cryptographic Isolation Boundary", 
                                    desc: "Guarantees complete cryptographic separation at the database level. Each credential payload is individually encrypted using AES-256-GCM with a unique, cryptographically secure initialization vector (IV), ensuring identical secrets yield entirely unique ciphertexts.",
                                    meta: "AES-256-GCM • UNIQUE IV PER RECORD • INTEGRITY AUTHENTICATION"
                                },
                                { 
                                    title: "Runtime Memory Boundary Protection", 
                                    desc: "Guarantees that plaintext secrets exist exclusively in volatile server-side memory during active execution. Decrypted values are never persisted to disk, cached in transit, or written to swap files, eliminating permanent exposure vectors.",
                                    meta: "ZERO-PERSISTENCE MEMORY • SERVER-SIDE DECRYPTION BOUNDARY • CACHE-SAFE"
                                },
                                { 
                                    title: "Symmetric Payload Disassociation", 
                                    desc: "Guarantees absolute separation of access. Credential metadata (identifiers, schedules, policies) and the encrypted secret payloads reside in decoupled storage schemas. Compromising metadata provides zero pathway to decrypting the associated payload.",
                                    meta: "SCHEMA DECOUPLING • ISOLATED PAYLOAD REGISTERS • ZERO-KNOWLEDGE DIRECTORY"
                                },
                                { 
                                    title: "Sovereign Key Lifecycle Hygiene", 
                                    desc: "Guarantees that database contents remain entirely inert without active runtime-injected key variables. Keys are bound strictly to isolated runtime environments and rotated systematically, never co-located with ciphertext.",
                                    meta: "ENVIRONMENT-BOUND KEYS • CRYPTOGRAPHICALLY INERT REST STATE • ANTI-CO-LOCATION"
                                },
                            ].map((card, idx) => (
                                <div key={idx} className="p-5 rounded-md border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#090d16]/30 hover:bg-slate-100 dark:hover:bg-[#090d16]/60 transition-colors flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{card.title}</h3>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500/80 tracking-wider uppercase mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04]">
                                        {card.meta}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-white/[0.04]" />

                {/* Section 2: Access Control Model */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Fingerprint className="w-4 h-4" strokeWidth={2} />
                                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">LAYER 02</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Zero Trust Access Governance</h2>
                            <p className="text-xs text-slate-605 dark:text-slate-400 leading-relaxed max-w-sm">
                                Guarantees regarding identity validation, runtime-computed access scopes, and real-time permission evaluation.
                            </p>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { 
                                    title: "Granular Feature-Level RBAC", 
                                    desc: "Guarantees access verification at the precise feature boundary rather than coarse system roles. Every platform capability evaluates independent, granular permission matrices before executing reads, writes, or rotations.",
                                    meta: "FEATURE BOUNDARY RBAC • 5-TIER PERMISSION DEPTH • CONTEXTUAL AUTHORIZATION"
                                },
                                { 
                                    title: "Dynamic Least-Privilege Scoping", 
                                    desc: "Guarantees that access authorization is dynamically constrained to specific environment tiers, credential classifications, or individual records. Access limits are verified continuously at the request boundary.",
                                    meta: "ENVIRONMENT ISOLATION • RUNTIME ACCESS SCOPING • CATEGORY LIMIT BOUNDS"
                                },
                                { 
                                    title: "Server-Boundary Sensitive Data Masking", 
                                    desc: "Guarantees that sensitive credential values are masked at the server-side API boundary. Masking logic is executed in secure memory before serialization, preventing plaintext leakages to the client UI or network layer.",
                                    meta: "SERVER-SIDE SERIALIZATION MASKING • SCHEMATIC REDACTION • NO CLIENT EXPOSURE"
                                },
                                { 
                                    title: "Immediate Session Revocation Propagation", 
                                    desc: "Guarantees that session state invalidation is propagated instantaneously across all execution environments. Any administrative revocation or policy violation immediately terminates active requests and scopes.",
                                    meta: "REAL-TIME INVALIDATION • INSTANT REVOCATION PROPAGATION • ZERO-TRUST RE-EVALUATION"
                                },
                            ].map((card, idx) => (
                                <div key={idx} className="p-5 rounded-md border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#090d16]/30 hover:bg-slate-100 dark:hover:bg-[#090d16]/60 transition-colors flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{card.title}</h3>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500/80 tracking-wider uppercase mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04]">
                                        {card.meta}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-white/[0.04]" />

                {/* Section 3: Threat Protection */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">LAYER 03</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Adaptive Threat Containment</h2>
                            <p className="text-xs text-slate-605 dark:text-slate-400 leading-relaxed max-w-sm">
                                Guarantees protecting platform workflows against malicious intrusion, credential abuse, and brute-force actions.
                            </p>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { 
                                    title: "Intrusion Pattern Containment", 
                                    desc: "Guarantees proportional escalation of defensive actions when anomalies are detected. Suspicious authentication and query patterns trigger progressive, real-time rate boundaries and multi-factor validation requirements.",
                                    meta: "DYNAMIC ESCALATION • RATE BARRIER ENFORCEMENT • ANOMALY DETECTION"
                                },
                                { 
                                    title: "Network Boundary Threat Isolation", 
                                    desc: "Guarantees progressive, automated isolation of abusing IP ranges. The system escalates network-level blocks dynamically from initial throttling to extended border bans, preserving system integrity.",
                                    meta: "AUTOMATED IP CONTAINMENT • BORDER RATE REGULATION • PROGRESSIVE BLOCKLIST"
                                },
                                { 
                                    title: "Unified Authentication Attack Mitigation", 
                                    desc: "Guarantees that threat detection models are shared instantly across all auth surfaces (login, password reset, 2FA setup, and API nodes), shutting down concurrent cross-flow attacks.",
                                    meta: "CROSS-FLOW THREAT MODELING • CONSOLIDATED AUTH SHIELD • ABUSE PATTERN TRACKING"
                                },
                                { 
                                    title: "Immutable Custody Auditing & Control", 
                                    desc: "Guarantees security administrators absolute visibility and override capabilities over active blocklists. Provides an audited custody path for reviewing, overriding, and forensic analyzing all automated blocks.",
                                    meta: "CUSTODY PATH LOGGING • ADMINISTRATIVE OVERRIDE AUDITS • FORENSIC ACTION TRAIL"
                                },
                            ].map((card, idx) => (
                                <div key={idx} className="p-5 rounded-md border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#090d16]/30 hover:bg-slate-100 dark:hover:bg-[#090d16]/60 transition-colors flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{card.title}</h3>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500/80 tracking-wider uppercase mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04]">
                                        {card.meta}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-white/[0.04]" />

                {/* Section 4: Authentication */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <ShieldCheck className="w-4 h-4" strokeWidth={2} />
                                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">LAYER 04</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Identity & Session Governance</h2>
                            <p className="text-xs text-slate-605 dark:text-slate-400 leading-relaxed max-w-sm">
                                Guarantees regarding identity assertion, strong multi-factor compliance, and session lifespan enforcement.
                            </p>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { 
                                    title: "Multi-Factor Access Verification", 
                                    desc: "Guarantees that a second, high-entropy factor is cryptographically verified for all identity validation events. TOTP secrets are individually encrypted at rest, preventing authenticator bypass.",
                                    meta: "MANDATORY TOTP 2FA • ENCRYPTED SECRET REST SECURITY • SECURE ASSERTION"
                                },
                                { 
                                    title: "Algorithmic Complexity Governance", 
                                    desc: "Guarantees strict adherence to high-entropy enterprise password policies. Enforces length, character diversity, and structural requirements during every credential creation or update flow.",
                                    meta: "HIGH-ENTROPY POLICY ENFORCEMENT • STRUCTURAL PATTERN CHECKS • COMPLIANCE AUDITED"
                                },
                                { 
                                    title: "Deterministic Inactivity Expire", 
                                    desc: "Guarantees absolute protection against physical session compromises. Automatically invalidates sessions and purges transient memory access structures after configured inactivity windows.",
                                    meta: "AUTOMATIC INACTIVITY TIMEOUT • MEMORY STRUCTURE PURGING • LIFECYCLE GOVERNANCE"
                                },
                                { 
                                    title: "Anti-Enumeration Recovery Boundaries", 
                                    desc: "Guarantees that user recovery and credential resets use single-use, cryptographically signed tokens with aggressive rate regulation and anti-enumeration schemas to prevent account discovery.",
                                    meta: "SIGNED RECOVERY TOKENS • ANTI-ENUMERATION ARCHITECTURE • SINGLE-USE EXPIRY"
                                },
                            ].map((card, idx) => (
                                <div key={idx} className="p-5 rounded-md border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#090d16]/30 hover:bg-slate-100 dark:hover:bg-[#090d16]/60 transition-colors flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{card.title}</h3>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500/80 tracking-wider uppercase mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04]">
                                        {card.meta}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-white/[0.04]" />

                {/* Section 5: API Security */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Server className="w-4 h-4" strokeWidth={2} />
                                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">LAYER 05</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">API Security & Integrity</h2>
                            <p className="text-xs text-slate-605 dark:text-slate-400 leading-relaxed max-w-sm">
                                Guarantees regarding automated machine-to-machine integrations, token validity, and cryptographic validation.
                            </p>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { 
                                    tier: "Federated API Authorization", 
                                    desc: "Guarantees secure machine-to-machine validation using OAuth 2.0 Client Credentials. Enforces strictly scoped access policies, short-lived tokens, and environment isolation.", 
                                    color: "border-t-blue-500/40",
                                    meta: "OAUTH 2.0 CLIENT CREDS • SCPOED MACH TOKENS"
                                },
                                { 
                                    tier: "Mutual TLS Client Verification", 
                                    desc: "Guarantees strict cryptographic identity validation by requiring mutual TLS certificate verification (mTLS) for all incoming API requests, preventing man-in-the-middle exploits.", 
                                    color: "border-t-indigo-500/40",
                                    meta: "mTLS CRYPTOGRAPHIC CERT • MitM SAFEGUARD"
                                },
                                { 
                                    tier: "HMAC Request Signature Integrity", 
                                    desc: "Guarantees absolute tamper-evident request delivery. Validates HMAC signatures with unique keys and strict time-windows to eliminate replay attacks and request alteration.", 
                                    color: "border-t-purple-500/40",
                                    meta: "HMAC HASH SIGNATURE • ANTI-REPLAY WINDOW"
                                },
                            ].map((t, idx) => (
                                <div key={idx} className={`p-5 rounded-md border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#090d16]/30 hover:bg-slate-100 dark:hover:bg-[#090d16]/60 border-t-2 ${t.color} transition-colors flex flex-col justify-between`}>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{t.tier}</h3>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{t.desc}</p>
                                    </div>
                                    <div className="text-[8px] font-mono text-slate-500/80 tracking-wider uppercase mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04]">
                                        {t.meta}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-white/[0.04]" />

                {/* Section 6: License Integrity */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <KeyRound className="w-4 h-4" strokeWidth={2} />
                                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">LAYER 06</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Sovereign Air-Gapped Authority</h2>
                            <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed max-w-sm">
                                Guarantees regarding license self-verification, air-gapped system isolation, and systematic boundary compliance.
                            </p>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { 
                                    title: "Independent Cryptographic Autonomy", 
                                    desc: "Guarantees complete air-gapped compatibility. The platform validates its operational license terms entirely locally using digital signatures, requiring zero external internet communication or cloud callbacks.",
                                    meta: "ZERO CALLBACKS • AIR-GAPPED VERIFICATION • SIGNATURE CRYPTO"
                                },
                                { 
                                    title: "Tamper-Proof Parameter Signatures", 
                                    desc: "Guarantees the integrity of license scopes. Any direct DB alteration to seat limits, expiry bounds, or feature flags breaks the cryptographic signature, preventing unauthorized state changes.",
                                    meta: "SIGNED RESOURCE FLAGS • INTEGRITY PROTECTION • WRITE REDACTION"
                                },
                                { 
                                    title: "Graceful Operational Continuity", 
                                    desc: "Guarantees predictable, non-disruptive platform behavior. Impending license renewals trigger progressive administrative notices and a controlled grace period, preventing abrupt runtime failures.",
                                    meta: "NON-DISRUPTIVE NOTIFICATION • CONTROLLED GRACE WINDOWS • OPERATION SAFE"
                                },
                                { 
                                    title: "Deterministic Resource Constraints", 
                                    desc: "Guarantees compliance with structural licensing terms by validating active registry counts against digital limits prior to authorization, ensuring systematic governance of platform growth.",
                                    meta: "ACTIVE SEAT GOVERNANCE • BOUNDARY CHECKS • LICENSE ENFORCEMENT"
                                },
                            ].map((card, idx) => (
                                <div key={idx} className="p-5 rounded-md border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#090d16]/30 hover:bg-slate-100 dark:hover:bg-[#090d16]/60 transition-colors flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{card.title}</h3>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500/80 tracking-wider uppercase mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04]">
                                        {card.meta}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-[#090d16]/20">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
                            Security You Can Trust, Architecture You Can Verify
                        </h2>
                        <p className="text-sm text-slate-605 dark:text-slate-400 mb-8 leading-relaxed">
                            Schedule a technical deep-dive or request cryptographic isolation specs designed for your enterprise infrastructure.
                        </p>
                        <Link href="/request-demo">
                            <Button className="h-10 px-6 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-2">
                                Request Technical Walkthrough
                                <ArrowRight className="w-3.5 h-3.5" />
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
