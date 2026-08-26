import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ExpandableFeatureCard } from "@/components/marketing/ExpandableFeatureCard";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import { QuickActionsFloatingWidget } from "@/components/marketing/QuickActionsFloatingWidget";
import {
    ArrowRight,
    CheckCircle2,
    Timer,
    UserX,
    EyeOff,
    Globe,
    Network,
    SearchX,
    Database,
    ShieldCheck,
    Lock,
    KeyRound,
    Fingerprint,
    Server,
    Activity,
    FileSearch,
    AlertTriangle,
    Workflow,
    ChevronRight,
} from "lucide-react";

export default async function LandingPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
            {/* Navbar */}
            <MarketingNavbar
                applicationName={settings.applicationName || "CredSecure"}
                isLoggedIn={!!session?.user}
            />

            <main className="relative z-10 w-full overflow-x-hidden pt-16">

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 1 — HERO
                ═══════════════════════════════════════════════════════════ */}
                <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left Side: Dominant Copy (7 Cols) */}
                        <div className="space-y-6 lg:col-span-7">
                            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.12] text-slate-900 dark:text-white text-balance">
                                Govern Enterprise Credentials with{" "}
                                <span className="text-indigo-600 dark:text-indigo-400">Visibility, Traceability, and Control.</span>
                            </h1>
                            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                                Secure, govern, and trace system accounts, API client scopes, database keys, and operational credentials across your enterprise landscapes.
                            </p>
                            <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
                                <Link href="/request-demo">
                                    <Button className="h-10 px-5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                                        Request Demo
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                                <Link href="/platform">
                                    <Button variant="outline" className="h-10 px-5 bg-transparent border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                                        Explore Platform
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Right Side: Receding Architectural Visualization (5 Cols) */}
                        <div className="hidden lg:block lg:col-span-5 opacity-90 hover:opacity-100 transition-opacity duration-200">
                            <div className="relative border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white dark:bg-[#0b0f19] p-6 shadow-xl">
                                <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                                    <span>Credential Governance Lifecycle</span>
                                </div>
                                <div className="space-y-0 font-sans">
                                    {[
                                        { step: "01", label: "Request", desc: "Access request initiated", active: false },
                                        { step: "02", label: "Validate", desc: "RBAC policy evaluated", active: false },
                                        { step: "03", label: "Deliver", desc: "Scoped credential issued", active: false },
                                        { step: "04", label: "Monitor", desc: "Real-time usage tracked", active: true },
                                        { step: "05", label: "Revoke", desc: "Time-bound expiry enforced", active: false },
                                        { step: "06", label: "Audit", desc: "Immutable trail recorded", active: false },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-7 h-7 rounded-full border transition-colors flex items-center justify-center text-[9px] font-mono font-bold ${item.active
                                                    ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                                                    : "border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.01] text-slate-500"
                                                    }`}>
                                                    {item.step}
                                                </div>
                                                {idx < 5 && <div className="w-px h-5 bg-slate-200 dark:bg-white/[0.04]" />}
                                            </div>
                                            <div className="pb-4 pt-0.5">
                                                <div className={`text-xs font-semibold tracking-wide ${item.active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}>
                                                    {item.label}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-600 font-mono mt-0.5">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 2 — TRUST BAR
                ═══════════════════════════════════════════════════════════ */}
                <section className="border-y border-slate-200 dark:border-white/[0.05] bg-slate-100/80 dark:bg-[#060a13]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
                            {[
                                "AES-256-GCM Encryption",
                                "Runtime-Only Decryption",
                                "Immutable Audit Logging",
                                "Zero Trust Access Validation",
                                "SAP Landscape Ready",
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-indigo-500/50" />
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 3 — COMBINED ENVIRONMENT STRIP (Social Proof & Continuity)
                ═══════════════════════════════════════════════════════════ */}
                <section className="border-b border-slate-200 dark:border-white/[0.05] bg-slate-100/50 dark:bg-[#05080f] py-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                            BUILT FOR CRITICAL WORKFLOWS:
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {[
                                "Enterprise Operations",
                                "Integration Platforms",
                                "Vendor Governance",
                                "Compliance Reviews",
                                "Production Support",
                            ].map((item, idx) => (
                                <span key={idx} className="text-[9px] px-2 py-0.5 rounded border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#0a0e17] text-slate-600 dark:text-slate-400 font-mono tracking-wider uppercase font-semibold">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 4 — THE REAL PROBLEM
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">Operational Risk</div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                            Most credential risks begin after storage.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
                            Organizations secure static credentials but struggle to govern active usage, operational tracing, external access limits, and lifecycle ownership.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { title: "Permanent Standing Access", desc: "Privileges left open indefinitely, creating persistent operational exposure across landscapes.", icon: Timer },
                            { title: "Unmanaged Service Accounts", desc: "System-to-system connections lacking active ownership, policy boundaries, or lifecycle rotation.", icon: UserX },
                            { title: "Audit Blind Spots", desc: "No unified, traceable log to prove who accessed what credentials, when, and for what purpose.", icon: EyeOff },
                            { title: "External Vendor Exposure", desc: "Third-party access granted without rigid time constraints, scope bounds, or automatic revocation.", icon: Globe },
                            { title: "Integration Credential Sprawl", desc: "Tokens and certificates scattered across middleware platforms without centralized governance.", icon: Network },
                            { title: "Operational Traceability Gaps", desc: "Inability to connect access events back to specific authorized support windows and approvals.", icon: SearchX },
                        ].map((card, idx) => (
                            <div key={idx} className="p-5 rounded-lg border border-slate-200 dark:border-white/[0.05] bg-white/80 dark:bg-[#0b0f19]/40 hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-150">
                                <card.icon className="w-4 h-4 text-slate-500 mb-3.5" strokeWidth={1.5} />
                                <h3 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide uppercase mb-1.5">{card.title}</h3>
                                <p className="text-[11px] text-slate-600 dark:text-slate-500 leading-relaxed font-mono">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 5 — GOVERNANCE DOMAINS
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/[0.05] bg-slate-100/50 dark:bg-[#05080f]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-semibold mb-2">Governance Framework</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                                Built for Operational Credential Governance
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                Six integrated domains designed to establish complete authority, lifecycle traceability, and runtime policy enforcement.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { title: "Credential Governance", desc: "Lifecycle control for application, database, API, and infrastructure credentials across environments.", icon: Database, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "Ownership Tracking • Expiry Triggers • Rotation Scopes" },
                                { title: "Access Governance", desc: "Scoped permissions, temporary access, and approval-driven workflows with time-bound enforcement.", icon: Fingerprint, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "Time-Bound Revocation • Scoped RBAC • Multi-Tier Approval" },
                                { title: "Audit & Compliance", desc: "Immutable audit visibility across operational actions, access events, and credential lifecycle changes.", icon: FileSearch, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "Immutable Event Trail • SIEM Export • Access Attestation" },
                                { title: "API Security", desc: "OAuth, mTLS, HMAC validation, and scoped API exposure controls with configurable rate governance.", icon: Server, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "Cryptographic Handshake • Rate Throttling • Scope Restriction" },
                                { title: "Threat Protection", desc: "Adaptive abuse prevention, IP escalation controls, and runtime enforcement across authentication flows.", icon: AlertTriangle, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "IP Block Lists • Throttling Escalation • Challenge Prompts" },
                                { title: "Operational Infrastructure", desc: "Licensing integrity, schema governance, deployment monitoring, and system health observability.", icon: Activity, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "Cryptographic Signature • Health Checks • Deployment Logs" },
                            ].map((domain, idx) => (
                                <div key={idx} className={`p-5 rounded-lg border border-slate-200 dark:border-white/[0.05] bg-white/80 dark:bg-white/[0.01] border-l-2 ${domain.accent} hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-all duration-150 flex flex-col justify-between`}>
                                    <div className="flex items-start gap-3">
                                        <domain.icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                                        <div>
                                            <h3 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide uppercase mb-1.5">{domain.title}</h3>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-500 leading-relaxed font-mono">{domain.desc}</p>
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-indigo-600 dark:text-indigo-400/80 font-mono tracking-wider uppercase mt-4 border-t border-slate-200 dark:border-white/[0.03] pt-2.5">
                                        {domain.meta}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link href="/platform" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 uppercase tracking-wider transition-colors">
                                Explore Platform <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 5.5 — PRODUCT PREVIEW: "Operational Visibility in One Place"
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/[0.05]">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">Live Product Preview</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                                Operational Visibility in One Place
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                                A centralized dashboard designed for enterprise support teams, landscape integration governance, and real-time compliance audits.
                            </p>
                        </div>

                        {/* Sharp-edged, matte browser UI mockup */}
                        <div className="border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-[#0b0f19] shadow-2xl overflow-hidden font-sans text-slate-800 dark:text-slate-200">
                            {/* Browser Header Bar */}
                            <div className="bg-slate-50 dark:bg-[#060a13] px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest ml-4 font-semibold">CredSecure Dashboard v1.4</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">ALL GOVERNED SYSTEMS OPERATIONAL</span>
                                </div>
                            </div>

                            {/* Dashboard Body Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/[0.06] bg-slate-50/50 dark:bg-[#080c14]/40">

                                {/* Col 1: Access Approvals */}
                                <div className="p-5 space-y-4">
                                    <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200 dark:border-white/5 pb-2">Active Scoped Approvals</div>
                                    <div className="space-y-2">
                                        {[
                                            { id: "REQ-901", target: "Enterprise System Connectivity", status: "Approved", time: "2h remaining" },
                                            { id: "REQ-884", target: "Vendor QA Api-Key Scopes", status: "Approved", time: "18m remaining" },
                                            { id: "REQ-879", target: "Production Patch Deployment", status: "Terminated", time: "0m remaining" },
                                        ].map((req, idx) => (
                                            <div key={idx} className="p-3 rounded border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0b0f19] space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">{req.id}</span>
                                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold border ${req.status === "Approved"
                                                        ? "text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/5"
                                                        : "text-slate-500 border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/[0.01]"
                                                        }`}>{req.status}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">{req.target}</div>
                                                <div className="text-[8.5px] text-slate-500 font-mono uppercase tracking-wide">Revocation: {req.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Col 2: Real-time Audit Timeline */}
                                <div className="p-5 space-y-4 md:col-span-2">
                                    <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200 dark:border-white/5 pb-2">Governed Access Audit Stream</div>
                                    <div className="space-y-1.5 font-mono text-[10px] text-slate-400 leading-relaxed">
                                        <div className="flex items-start gap-2 border-b border-slate-200 dark:border-white/[0.02] pb-1.5">
                                            <span className="text-slate-500 dark:text-slate-600 shrink-0">[16:01:18]</span>
                                            <span className="text-indigo-600 dark:text-indigo-400">[SYSTEM]</span>
                                            <span className="text-slate-700 dark:text-slate-300">Enforcing deterministic check-sum rotation on Enterprise Environment Certificatess.</span>
                                        </div>
                                        <div className="flex items-start gap-2 border-b border-slate-200 dark:border-white/[0.02] pb-1.5">
                                            <span className="text-slate-500 dark:text-slate-600 shrink-0">[15:58:04]</span>
                                            <span className="text-slate-600 dark:text-slate-400">[USER-84]</span>
                                            <span className="text-slate-700 dark:text-slate-300">Requested time-bound decryption of System Integration Connection credential (REQ-901).</span>
                                        </div>
                                        <div className="flex items-start gap-2 border-b border-slate-200 dark:border-white/[0.02] pb-1.5">
                                            <span className="text-slate-500 dark:text-slate-600 shrink-0">[15:54:12]</span>
                                            <span className="text-emerald-600 dark:text-emerald-500">[COMPLIANCE]</span>
                                            <span className="text-slate-700 dark:text-slate-300">Validated 2FA TOTP handshake for administrative security settings sync.</span>
                                        </div>
                                        <div className="flex items-start gap-2 border-b border-slate-200 dark:border-white/[0.02] pb-1.5">
                                            <span className="text-slate-500 dark:text-slate-600 shrink-0">[15:40:00]</span>
                                            <span className="text-rose-600 dark:text-rose-400">[SECURITY]</span>
                                            <span className="text-slate-700 dark:text-slate-300">Enforced automatic session termination on REQ-879 (Support window expired).</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-slate-500 dark:text-slate-600 shrink-0">[15:32:45]</span>
                                            <span className="text-indigo-600 dark:text-indigo-400">[SYSTEM]</span>
                                            <span className="text-slate-700 dark:text-slate-300">Computed zero-trust route permissions check. Target approved: Enterprise Integration Platform.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard Footer Info */}
                            <div className="bg-slate-50 dark:bg-[#060a13] px-4 py-2.5 border-t border-slate-200 dark:border-white/[0.06] text-center text-[9px] font-mono text-slate-500 tracking-wider uppercase">
                                CRITICAL CREDENTIAL ACTIONS ARE SIGNED CRYPTOGRAPHICALLY AND NEVER STORED IN PLAIN TEXT
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 6 — SECURITY ARCHITECTURE
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/[0.05] bg-[#05080f] bg-slate-100/50 dark:bg-[#05080f]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">High-Trust Architecture</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                                Designed for High-Trust Operational Environments
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                                Cryptographic and architectural constraints built to guarantee credential safety after storage.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            {[
                                { title: "Runtime-Only Decryption", desc: "Secrets decrypted only within secure server-memory execution contexts. Never persisted in plaintext at rest or in transit.", icon: Lock },
                                { title: "Decoupled Secret Storage", desc: "Metadata and encrypted payloads architecturally isolated across separate storage layers for defense-in-depth.", icon: Database },
                                { title: "Zero Trust Validation", desc: "Every request validated against dynamic RBAC scopes, session context, and feature-level access policies in real time.", icon: ShieldCheck },
                                { title: "Deterministic License Integrity", desc: "Cryptographically verified licensing prevents unauthorized operation and detects tampering without external dependencies.", icon: KeyRound },
                            ].map((card, idx) => (
                                <div key={idx} className="p-6 rounded-lg border border-slate-200 dark:border-white/[0.05] bg-white/80 dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-150">
                                    <card.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-3.5" strokeWidth={1.5} />
                                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide uppercase mb-2">{card.title}</h3>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-505 leading-relaxed font-mono">{card.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link href="/security" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-555 dark:hover:text-indigo-300 uppercase tracking-wider transition-colors">
                                View Security Architecture <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 7 — USE CASES
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/[0.05]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">Operational Workflows</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                                Operational Workflows We Secure
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                Scoped, traceable access security where credential containment is critical to business continuity.
                            </p>
                        </div>

                        <div className="max-w-3xl mx-auto space-y-2">
                            {/* Replace hardcoded border, bg, and text in use cases list */}
                            {[{ title: "Enterprise Integration Credential Governance", desc: "Govern middleware tokens, RFC connections, and system-to-system credentials across SAP landscapes.", tier: 1 },
                                { title: "Production maintenance access with automatic revocation", desc: "Time-bound engineer access for support workflows with automatic, hard revocation and audit trails.", tier: 1 },
                                { title: "Third-party vendor access governance with zero standing privileges", desc: "Controlled external support access with scoped visibility, strict timers, and automatic termination.", tier: 1 },
                                { title: "Automated service account lifecycle governance", desc: "Centralized ownership attribution, rotation scheduling, and key validity tracking.", tier: 2 },
                                { title: "API Client Scope Security", desc: "External API exposure governed with client credentials, mTLS validation, and rates controls.", tier: 2 },
                                { title: "Compliance Audits & Attestation", desc: "Instant evidence extraction and login differential mapping for regulatory review.", tier: 2 },
                                { title: "Incident Response Playbooks", desc: "Emergency break-glass workflows with instant tracing, isolation, and automated termination.", tier: 2 },
                            ].map((uc, idx) => (
                                <div key={idx} className={`flex items-center justify-between px-5 py-3 rounded-lg border transition-all duration-150 ${uc.tier === 1
                                    ? "border-indigo-500/15 bg-indigo-500/[0.02] hover:border-indigo-500/30"
                                    : "border-slate-200 dark:border-white/[0.04] bg-white/85 dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/[0.08]"
                                    }`}>
                                    <div className="flex items-start gap-3 min-w-0">
                                        <Workflow className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${uc.tier === 1 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`} strokeWidth={1.5} />
                                        <div className="min-w-0">
                                            <h3 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide uppercase">{uc.title}</h3>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-500 leading-relaxed font-mono mt-0.5">{uc.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 ml-3" />
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link href="/use-cases" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 uppercase tracking-wider transition-colors">
                                Explore All Use Cases <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 8 — FEATURE HIGHLIGHTS (Expandable)
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/[0.05] bg-slate-100/50 dark:bg-[#05080f]">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">Platform Capabilities</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                                Platform Capabilities
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                Complete security and compliance modules grouped by technical domain.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <ExpandableFeatureCard
                                title="Identity & Access Management"
                                items={[
                                    "Role-Based Access Control (RBAC) with 5-level permission hierarchy",
                                    "Dynamic access groups with policy-based credential scoping",
                                    "Category and environment-scoped permissions",
                                    "External vendor isolation with time-bound access windows",
                                    "Sensitive field masking for restricted visibility roles",
                                ]}
                                defaultOpen={true}
                            />
                            <ExpandableFeatureCard
                                title="Authentication Security"
                                items={[
                                    "Mandatory TOTP-based Two-Factor Authentication",
                                    "Adaptive CAPTCHA triggered after suspicious activity",
                                    "Configurable session timeout with automatic invalidation",
                                    "Multi-tier IP blocking with progressive escalation",
                                    "Enterprise password policy enforcement",
                                ]}
                            />
                            <ExpandableFeatureCard
                                title="API Gateway Security"
                                items={[
                                    "OAuth 2.0 Client Credentials flow with encrypted secrets",
                                    "Mutual TLS (mTLS) certificate verification",
                                    "HMAC request signature validation with timestamp windows",
                                    "Per-endpoint configurable rate limiting",
                                    "Global API access kill switch",
                                ]}
                            />
                            <ExpandableFeatureCard
                                title="Audit & Compliance"
                                items={[
                                    "Immutable, tamper-evident audit logs for all operations",
                                    "Differential auditing with structured change tracking",
                                    "Login activity logging with risk classification",
                                    "SIEM-ready structured JSON log output",
                                    "Configurable log archival with batch traceability",
                                ]}
                            />
                        </div>

                        <div className="text-center mt-12">
                            <Link href="/features" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 uppercase tracking-wider transition-colors">
                                See Full Breakdown <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 9 — PLATFORM OUTCOMES (Tabular KPI/Retool metrics)
                ═══════════════════════════════════════════════════════════ */}
                <section className="border-y border-slate-200 dark:border-white/[0.05] bg-slate-100/80 dark:bg-[#060a13]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/[0.05] text-left">
                            {[
                                { label: "Time-Bound Access", val: "100%", desc: "Mandatory Revocation" },
                                { label: "Immutable Audit Visibility", val: "Complete", desc: "SIEM & Audits ready" },
                                { label: "Runtime Payload Isolation", val: "Always-On", desc: "No plaintext persistence" },
                                { label: "Access Scopes Computed", val: "Per-Request", desc: "Zero trust evaluation" },
                                { label: "External Support Enforced", val: "Controlled", desc: "Time & Space Scoped" },
                            ].map((metric, idx) => (
                                <div key={idx} className="p-4 space-y-1">
                                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">{metric.label}</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">{metric.val}</div>
                                    <div className="text-[10px] text-slate-600 font-mono">{metric.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 10.5 — DESIGNED FOR OPERATIONAL CONTINUITY
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/[0.05] bg-slate-100/50 dark:bg-[#05080f]">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">Operational Dependability</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                                Designed for Operational Continuity
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                Enterprise-grade reliability guarantees that keep support, integration, and security pipelines unbroken.
                            </p>
                        </div>

                        <div className="space-y-4 font-mono">
                            {[
                                { title: "Runtime Validation", desc: "Scopes, signatures, and environment policies are evaluated in real time at every execution point with sub-millisecond overhead." },
                                { title: "Scoped Access Enforcements", desc: "Decoupled permission layers allow independent fail-safe checks. Even during partial failures, core access bounds remain locked." },
                                { title: "Audit Trail Preservation", desc: "State change events are streamed asynchronously to write-ahead compliance pipelines, preventing database load spikes from dropping audit logs." },
                                { title: "High-Availability Architecture", desc: "Stateless verification routing guarantees active requests failover seamlessly without breaking continuous integration connections." },
                                { title: "Integration-Safe Credential Delivery", desc: "Connectors operate with self-healing backoff schedules and cryptographic checksum validations for resilient Integration & Middleware Operations." },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded border border-slate-200 dark:border-white/[0.04] bg-white/80 dark:bg-white/[0.01]">
                                    <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0 select-none">[{idx + 1}]</div>
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide uppercase">{item.title}</h3>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-505 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 11 — FINAL CTA
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-24 relative overflow-hidden">
                    <div className="max-w-2xl mx-auto px-4 relative z-10 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
                            Operational Security Requires More Than Vaulting.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
                            Improve visibility, governance, operational traceability, and dynamic control across enterprise credential landscapes.
                        </p>
                        <Link href="/request-demo">
                            <Button className="h-10 px-6 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                                Request Demo
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <MarketingFooter
                applicationName={settings.applicationName || "CredSecure"}
                companyName={settings.companyName || "Innodhee Services Pvt Ltd"}
            />

            {/* Quick Actions Floating Right Button */}
            <QuickActionsFloatingWidget />

            {/* Floating Credential Utility */}
            <FloatingCredentialWidget />
        </div>
    );
}
