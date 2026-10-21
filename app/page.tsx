import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ExpandableFeatureCard } from "@/components/marketing/ExpandableFeatureCard";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import { BeforeAfterHeroVisual } from "@/components/marketing/BeforeAfterHeroVisual";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { GuessModelVisual } from "@/components/marketing/GuessModelVisual";
import {
    ArrowRight,
    ArrowDown,
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
    Shield,
    Sliders,
} from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({ path: "/" });

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
                <MarketingHero
                    eyebrow={{
                        icon: Shield,
                        label: "CREDENTIAL GOVERNANCE",
                    }}
                    title={{
                        line1: "Manage Credentials. Connect Systems.",
                        gradientLine: "Stay in Control.",
                    }}
                    description={
                        <>
                            <p className="text-base sm:text-lg text-slate-650 dark:text-slate-300 leading-relaxed max-w-xl">
                                CredSecure helps businesses securely manage credentials, control access and connect applications and systems through APIs and supported integrations.
                            </p>
                            <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-200 leading-relaxed max-w-xl">
                                Reduce manual credential sharing, improve visibility and simplify how credentials are managed across your organization.
                            </p>
                        </>
                    }
                    primaryCta={{
                        label: "Request a Demo",
                        href: "/request-demo",
                        icon: <ArrowRight className="w-4 h-4" />,
                    }}
                    secondaryCta={{
                        label: "Explore Integrations",
                        href: "/integrations",
                    }}
                    visual={
                        <div className="opacity-95 hover:opacity-100 transition-opacity duration-200">
                            <div className="relative border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#0b0f19] p-6 shadow-2xl min-h-[460px] flex flex-col justify-between select-none">
                                {/* Ambient Background Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                                {/* Header */}
                                <div className="relative z-10 flex flex-col items-center justify-center border-b border-slate-100 dark:border-white/[0.06] pb-3 space-y-1.5">
                                    <div className="flex items-center justify-center gap-2.5">
                                        <img src="/shield-logo.png" alt="CredSecure Shield Logo" className="h-7 w-7 object-contain" />
                                        <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white font-mono uppercase">
                                            CRED<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">SECURE</span>
                                        </span>
                                    </div>
                                    <span className="text-[9.5px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/50 shadow-2xs">
                                        Credential Governance Platform
                                    </span>
                                </div>

                                {/* Central Connection Diagram */}
                                <div className="relative z-10 flex flex-col items-center gap-2 py-3">
                                    {/* Top: Teams & Admins */}
                                    <div className="flex gap-2 justify-center">
                                        <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                            <span>👤</span> Teams &amp; Admins
                                        </div>
                                        <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                            <span>🏢</span> Applications
                                        </div>
                                    </div>
                                    {/* Down arrows */}
                                    <div className="flex gap-6">
                                        <ArrowDown className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
                                        <ArrowDown className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
                                    </div>
                                    {/* Center: CredSecure Hub with Logo */}
                                    <div className="px-5 py-2.5 rounded-xl border-2 border-indigo-500/40 dark:border-indigo-400/40 bg-indigo-50/90 dark:bg-indigo-950/40 text-center shadow-md flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-center justify-center gap-2">
                                            <img src="/shield-logo.png" alt="CredSecure Logo" className="h-5 w-5 object-contain" />
                                            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                                                CRED<span className="text-indigo-600 dark:text-indigo-400">SECURE</span>
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">Centralized governance &amp; control</div>
                                    </div>
                                    {/* Down arrow */}
                                    <ArrowDown className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
                                    {/* Bottom: Connected Systems */}
                                    <div className="flex gap-2 justify-center">
                                        <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                            <span>🔗</span> API Integrations
                                        </div>
                                        <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                            <span>⚙️</span> Connected Systems
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Strip: Manage • Connect • Control with icons */}
                                <div className="relative z-10 p-2.5 rounded-xl border border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/5 dark:bg-indigo-500/10 flex items-center justify-around gap-2">
                                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
                                        <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        <span>Manage</span>
                                    </div>
                                    <span className="text-indigo-300 dark:text-indigo-700 font-bold">•</span>
                                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
                                        <Network className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        <span>Connect</span>
                                    </div>
                                    <span className="text-indigo-300 dark:text-indigo-700 font-bold">•</span>
                                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
                                        <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        <span>Control</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                />

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 1.5 — VISUAL EXPLANATION (TODAY vs WITH CREDSECURE)
                ═══════════════════════════════════════════════════════════ */}
                <BeforeAfterHeroVisual />

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 2 — ONE PLATFORM. MULTIPLE WAYS TO CONNECT.
                ═══════════════════════════════════════════════════════════ */}
                <section className="border-y border-slate-200 dark:border-white/[0.05] bg-slate-100/80 dark:bg-[#060a13] py-10">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                                One Platform. Multiple Ways to Connect.
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
                                CredSecure sits at the center of your credential operations, connecting people, applications and systems.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-5 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-center space-y-2">
                                <div className="text-2xl">👤</div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Teams &amp; Administrators</div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Manage credentials and control who can access them, with full audit visibility.</p>
                            </div>
                            <div className="p-5 rounded-xl border-2 border-indigo-500/25 dark:border-indigo-400/25 bg-indigo-50/60 dark:bg-indigo-950/20 text-center space-y-2">
                                <div className="h-8 flex items-center justify-center">
                                    <img src="/shield-logo.png" alt="CredSecure Logo" className="h-7 w-7 object-contain" />
                                </div>
                                <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">CredSecure</div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Centralized credential management, access control and activity tracking.</p>
                            </div>
                            <div className="p-5 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-center space-y-2">
                                <div className="text-2xl">🔗</div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Applications &amp; Systems</div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Retrieve authorized credentials through APIs or receive them through supported integrations.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 2.5 — THE CREDENTIAL OPERATIONS MODEL (GUESS)
                ═══════════════════════════════════════════════════════════ */}
                <GuessModelVisual showSectionHeader={true} />

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
                                { title: "Credential Governance", desc: "Lifecycle control for application, database, API, and infrastructure credentials across environments.", icon: Database, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "Ownership Tracking • Expiry Triggers • Version Tracking" },
                                { title: "Access Governance", desc: "Scoped permissions, role-based controls, and time-limited vendor access. Vendor access windows expire within CredSecure and do not revoke credentials in connected systems.", icon: Fingerprint, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "Time-Limited Vendor Access • Scoped RBAC • Masked Views" },
                                { title: "Audit & Compliance", desc: "Immutable audit visibility across operational actions, access events, and credential lifecycle changes.", icon: FileSearch, accent: "border-l-indigo-500/30 hover:border-l-indigo-400", meta: "Immutable Event Trail • Differential Auditing • Access Attestation" },
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
                            <div className="text-[9px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-semibold mb-2">Live Product Preview</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                                Operational Visibility in One Place
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                                Monitor credential health, track upcoming expirations, review access activity, and maintain visibility into supported system integrations—all from one centralized dashboard.
                            </p>
                        </div>

                        {/* Matte browser UI mockup */}
                        <div className="border border-slate-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-[#0b0f19] shadow-2xl overflow-hidden font-sans text-slate-800 dark:text-slate-200">
                            {/* Browser Header Bar */}
                            <div className="bg-slate-50 dark:bg-[#060a13] px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/10 shrink-0" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/10 shrink-0" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/10 shrink-0" />
                                    <div className="ml-3 sm:ml-4 flex items-baseline gap-2">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                                            CredSecure Dashboard
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                                            Credential Governance Overview
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded">
                                        Status: Protected
                                    </span>
                                </div>
                            </div>

                            {/* Summary Metrics Bar - 3 Illustrative summary cards */}
                            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/[0.06] border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#080c14]/60">
                                {[
                                    { value: "128", label: "Credentials", sub: "Active governed secrets", color: "text-slate-900 dark:text-white" },
                                    { value: "06", label: "Expiring Soon", sub: "Alert threshold active", color: "text-amber-600 dark:text-amber-400" },
                                    { value: "04", label: "Integrations", sub: "Supported connections", color: "text-indigo-600 dark:text-indigo-400" },
                                ].map((stat, idx) => (
                                    <div key={idx} className="p-3.5 sm:p-4 text-center">
                                        <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${stat.color}`}>{stat.value}</div>
                                        <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{stat.label}</div>
                                        <div className="text-[9px] text-slate-500 font-mono hidden sm:block">{stat.sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Dashboard Body Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/[0.06] bg-slate-50/30 dark:bg-[#080c14]/30">

                                {/* Col 1: Credential Health & Expiry (5 cols) */}
                                <div className="p-5 space-y-4 md:col-span-5">
                                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                                        <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Credential Health & Expiry</div>
                                        <span className="text-[8px] font-mono text-slate-400 uppercase">Sample Records</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {[
                                            {
                                                name: "ERP Integration API",
                                                desc: "OAuth Client Credential",
                                                status: "Active",
                                                badgeStyle: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
                                                iconColor: "bg-emerald-500",
                                            },
                                            {
                                                name: "Production TLS Certificate",
                                                desc: "Expires in 21 days",
                                                status: "Expiring Soon",
                                                badgeStyle: "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10",
                                                iconColor: "bg-amber-500",
                                            },
                                            {
                                                name: "Vendor Support Credential",
                                                desc: "Restricted access",
                                                status: "Restricted",
                                                badgeStyle: "text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
                                                iconColor: "bg-indigo-500",
                                            },
                                        ].map((item, idx) => (
                                            <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b0f19] space-y-1.5 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${item.iconColor} shrink-0`} />
                                                        <span className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">{item.name}</span>
                                                    </div>
                                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold border shrink-0 ${item.badgeStyle}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono pl-3.5">
                                                    {item.desc}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Col 2: Recent Governance Activity (7 cols) */}
                                <div className="p-5 space-y-4 md:col-span-7">
                                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                                        <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Recent Governance Activity</div>
                                        <span className="text-[8px] font-mono text-slate-400 uppercase">Audit Stream</span>
                                    </div>
                                    <div className="space-y-2 font-mono text-[10px] leading-relaxed">
                                        {[
                                            { time: "16:01", tag: "SYSTEM", tagColor: "text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/10", text: "Expiry alert generated for Production TLS Certificate." },
                                            { time: "15:58", tag: "USER", tagColor: "text-slate-600 dark:text-slate-300 border-slate-400/20 bg-slate-400/10", text: "Credential record updated; change captured in audit history." },
                                            { time: "15:54", tag: "ACCESS", tagColor: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10", text: "Authorized application retrieved permitted credential through API." },
                                            { time: "15:40", tag: "VENDOR", tagColor: "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10", text: "Vendor access validity period expired." },
                                            { time: "15:32", tag: "SYNC", tagColor: "text-cyan-600 dark:text-cyan-400 border-cyan-500/20 bg-cyan-500/10", text: "Credential synchronization completed for configured integration." },
                                        ].map((ev, idx) => (
                                            <div key={idx} className="flex items-start gap-2 pb-1.5 border-b border-slate-100 dark:border-white/[0.03] last:border-b-0">
                                                <span className="text-slate-400 dark:text-slate-500 shrink-0">[{ev.time}]</span>
                                                <span className={`text-[8px] font-bold px-1 rounded border shrink-0 ${ev.tagColor}`}>[{ev.tag}]</span>
                                                <span className="text-slate-700 dark:text-slate-300">{ev.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard Footer Info */}
                            <div className="bg-slate-50 dark:bg-[#060a13] px-4 py-2.5 border-t border-slate-200 dark:border-white/[0.06] text-center text-[9px] font-mono text-slate-500 tracking-wider uppercase">
                                ILLUSTRATIVE GOVERNANCE PREVIEW • COUNTS, RECORDS, AND TIMESTAMPS SHOWN FOR DEMONSTRATION PURPOSES
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
                                Cryptographic and architectural constraints designed to protect credentials after storage.
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
                            {[{ title: "Enterprise Integration Credential Governance", desc: "Govern middleware tokens, RFC connections, and system-to-system credentials across SAP and other integration landscapes.", tier: 1 },
                                { title: "Production access with time-bound controls", desc: "Give engineers controlled access to production credentials for authorized support activities, with access expiry and audit trail.", tier: 1 },
                                { title: "Third-party vendor credential access", desc: "Provide controlled external access scoped by credential category, environment and permitted period — with centralized audit traceability.", tier: 1 },
                                { title: "Application credential provisioning", desc: "Allow applications to retrieve their authorized credential configuration directly through the CredSecure API at startup or deployment.", tier: 2 },
                                { title: "API Client Scope Security", desc: "External API access governed with client credentials, mTLS validation and configurable rate controls.", tier: 2 },
                                { title: "Audit & Compliance Visibility", desc: "Review credential access and change history through centralized, structured audit records.", tier: 2 },
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
                                    "Structured JSON audit log output",
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-slate-200/60 dark:bg-white/[0.06] rounded-lg overflow-hidden">
                            {[
                                { label: "Vendor Access Windows", val: "100%", desc: "Time-limited enforcement" },
                                { label: "Immutable Audit Visibility", val: "Complete", desc: "Structured audit ready" },
                                { label: "Runtime Payload Isolation", val: "Always-On", desc: "No plaintext persistence" },
                                { label: "Access Scopes Computed", val: "Per-Request", desc: "Zero trust evaluation" },
                                { label: "External Support Enforced", val: "Controlled", desc: "Time & Space Scoped" },
                            ].map((metric, idx) => (
                                <div key={idx} className="p-5 bg-slate-100/80 dark:bg-[#060a13] space-y-1">
                                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">{metric.label}</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">{metric.val}</div>
                                    <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{metric.desc}</div>
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

            {/* Floating Credential Utility */}
            <FloatingCredentialWidget />
        </div>
    );
}
