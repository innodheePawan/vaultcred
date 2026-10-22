import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import {
    ArrowRight,
    Code2,
    Send,
    Shield,
    Lock,
    Key,
    FileCode,
    CheckCircle2,
    ChevronRight,
    Layers,
    Globe,
    Puzzle,
} from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Integrations & APIs",
    description: "Connect CredSecure to your business applications. Applications retrieve authorized credentials through CredSecure APIs, and supported integrations can receive credentials in connected target systems.",
    path: "/integrations",
});

export default async function IntegrationsPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 font-sans">
            <MarketingNavbar
                applicationName={settings.applicationName || "CredSecure"}
                isLoggedIn={!!session?.user}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "@id": "https://getcredsecure.com/integrations#webpage",
                        "url": "https://getcredsecure.com/integrations",
                        "name": "Integrations & APIs | CredSecure",
                        "description": "Connect CredSecure to your business applications. Applications retrieve authorized credentials through CredSecure APIs, and supported integrations can receive credentials in connected target systems.",
                        "breadcrumb": {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                {
                                    "@type": "ListItem",
                                    "position": 1,
                                    "name": "Home",
                                    "item": "https://getcredsecure.com"
                                },
                                {
                                    "@type": "ListItem",
                                    "position": 2,
                                    "name": "Integrations & APIs",
                                    "item": "https://getcredsecure.com/integrations"
                                }
                            ]
                        }
                    })
                }}
            />

            <main className="relative z-10 pt-16">

                {/* ═══════════════════════════════════════════════════════════
                    HERO
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="max-w-3xl mx-auto text-center space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                INTEGRATIONS & APIS
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                            Connect CredSecure to Your{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400">
                                Business Applications
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                            CredSecure helps applications securely access the credentials they need and supports delivery of credentials to configured target systems — reducing manual handling and improving governance.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                            <Link href="/request-demo">
                                <Button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all inline-flex items-center gap-2">
                                    Request a Demo
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Link href="/use-cases">
                                <Button variant="outline" className="h-11 px-6 border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors">
                                    Explore Use Cases
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    TWO INTEGRATION PATHS
                ═══════════════════════════════════════════════════════════ */}
                <section className="border-t border-slate-200 dark:border-white/[0.05] py-16 px-4 sm:px-6 lg:px-8 bg-slate-100/50 dark:bg-[#05080f]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-semibold mb-2">How It Works</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                                Two Ways to Integrate
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                                API retrieval and target-system provisioning are separate, complementary integration paths.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Path 1: Applications Retrieve Credentials */}
                            <div className="p-8 rounded-2xl border border-indigo-500/20 dark:border-indigo-400/20 bg-white dark:bg-[#0b0f19] shadow-lg">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <Code2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-mono uppercase tracking-widest text-indigo-500 font-bold">Integration Path 1</div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Applications Retrieve Credentials</h3>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                    Instead of manually distributing sensitive configuration files, applications can securely retrieve their permitted credential information through CredSecure APIs. The application authenticates using an assigned API client and retrieves only the credentials it is authorized to access.
                                </p>

                                {/* Flow diagram */}
                                <div className="bg-slate-50 dark:bg-[#060a13] rounded-xl p-4 mb-5 space-y-2">
                                    {[
                                        { step: "1", label: "Application authenticates", detail: "Using assigned API client credentials" },
                                        { step: "2", label: "CredSecure validates", detail: "Authorized client, scope and environment" },
                                        { step: "3", label: "Application retrieves", detail: "Permitted credential configuration via API" },
                                        { step: "4", label: "Access is audited", detail: "Every retrieval is logged centrally" },
                                    ].map((item) => (
                                        <div key={item.step} className="flex items-start gap-3">
                                            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{item.step}</span>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.detail}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-2">Supported Authentication Methods</div>
                                    {[
                                        "OAuth 2.0 Client Credentials flow",
                                        "Mutual TLS (mTLS) certificate verification",
                                        "HMAC request signature validation",
                                        "Per-endpoint configurable rate limiting",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                            <span className="text-xs text-slate-600 dark:text-slate-400">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                                    <Link href="/use-cases#application-credential-provisioning" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 uppercase tracking-wider transition-colors">
                                        See Application Provisioning Use Case <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>

                            {/* Path 2: CredSecure Delivers Credentials */}
                            <div className="p-8 rounded-2xl border border-cyan-500/20 dark:border-cyan-400/20 bg-white dark:bg-[#0b0f19] shadow-lg">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                        <Send className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-500 font-bold">Integration Path 2</div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">CredSecure Delivers Credentials</h3>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                    Supported integrations can send credential information to configured target systems, reducing manual handling and helping teams manage updates. Vendors or administrators create credentials in CredSecure, and CredSecure provisions the applicable security material to the connected target.
                                </p>

                                {/* Flow diagram */}
                                <div className="bg-slate-50 dark:bg-[#060a13] rounded-xl p-4 mb-5 space-y-2">
                                    {[
                                        { step: "1", label: "Administrator configures target", detail: "Set up the integration target in CredSecure" },
                                        { step: "2", label: "Credential is created or updated", detail: "By an authorized user or vendor in CredSecure" },
                                        { step: "3", label: "CredSecure provisions", detail: "Security material sent to the configured target" },
                                        { step: "4", label: "Activity is audited", detail: "Creation, sync and access are fully logged" },
                                    ].map((item) => (
                                        <div key={item.step} className="flex items-start gap-3">
                                            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800/50 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{item.step}</span>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.detail}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-2">Benefits</div>
                                    {[
                                        "Reduce manual credential handling by internal teams",
                                        "Allow vendors to onboard credentials directly in scope",
                                        "Maintain full governance and audit traceability",
                                        "Keep credential values out of email or chat channels",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                            <span className="text-xs text-slate-600 dark:text-slate-400">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                                    <Link href="/use-cases#btp-security-material-provisioning" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 uppercase tracking-wider transition-colors">
                                        See BTP Provisioning Use Case <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    INTEGRATION MATRIX
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/[0.05]">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">Integration Availability</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                                Integration Matrix
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                                Understanding what is available today, what works through standard APIs, and what can be explored as a custom integration.
                            </p>
                        </div>

                        {/* Disclaimer notice */}
                        <div className="mb-8 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20">
                            <div className="flex items-start gap-2.5">
                                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                    <strong>Honest integration availability:</strong> The table below distinguishes between integrations that are implemented today, systems that can connect using standard CredSecure APIs, and possibilities that require further evaluation. We do not list vendor logos as pre-built integrations unless the corresponding integration is actually implemented.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.06]">
                            {/* Table header */}
                            <div className="grid grid-cols-12 bg-slate-100 dark:bg-[#060a13] border-b border-slate-200 dark:border-white/[0.06] px-5 py-3">
                                <div className="col-span-5 text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">System / Platform</div>
                                <div className="col-span-3 text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Availability</div>
                                <div className="col-span-4 text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Notes</div>
                            </div>

                            {/* Rows */}
                            {[
                                {
                                    system: "SAP BTP Integration Suite",
                                    icon: Layers,
                                    availability: "Implemented",
                                    availColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50",
                                    notes: "Security material provisioning to BTP Integration Suite is a supported, implemented integration."
                                },
                                {
                                    system: "Applications supporting CredSecure REST APIs",
                                    icon: Code2,
                                    availability: "Available via API",
                                    availColor: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50",
                                    notes: "Applications integrated with CredSecure can retrieve authorized credentials via the REST API using OAuth 2.0, with progressive tiers adding mTLS and HMAC request signing."
                                },
                                {
                                    system: "CI/CD Pipelines",
                                    icon: FileCode,
                                    availability: "Available via API",
                                    availColor: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50",
                                    notes: "Deployment pipelines can retrieve credentials through the CredSecure API at runtime or deployment."
                                },
                                {
                                    system: "Enterprise Integration Platforms",
                                    icon: Globe,
                                    availability: "Explore with us",
                                    availColor: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06]",
                                    notes: "Organizations can discuss their systems and requirements to evaluate additional provisioning integrations."
                                },
                                {
                                    system: "Custom Target Systems",
                                    icon: Puzzle,
                                    availability: "Custom development",
                                    availColor: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06]",
                                    notes: "Additional target-system integrations can be explored through co-innovation based on your architecture and requirements."
                                },
                            ].map((row, idx) => {
                                const RowIcon = row.icon;
                                return (
                                    <div key={idx} className={`grid grid-cols-12 px-5 py-4 border-b border-slate-200 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors ${idx === 4 ? "border-b-0" : ""}`}>
                                        <div className="col-span-5 flex items-center gap-2.5">
                                            <RowIcon className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.5} />
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{row.system}</span>
                                        </div>
                                        <div className="col-span-3 flex items-center">
                                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${row.availColor}`}>
                                                {row.availability}
                                            </span>
                                        </div>
                                        <div className="col-span-4 flex items-center">
                                            <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{row.notes}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    API AUTHENTICATION DETAILS
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/[0.05] bg-slate-100/50 dark:bg-[#05080f]">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-semibold mb-2">Defense in Depth</div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                                Layered Security Tiers: Standard, Secure, and Enterprise
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                                CredSecure API access is governed by progressive, layered security tiers. Machine-to-machine integrations authenticate via OAuth 2.0, with higher tiers adding mutual TLS verification and cryptographic HMAC request signing.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                            {[
                                {
                                    icon: Key,
                                    title: "OAuth 2.0 Alone",
                                    stack: "OAuth 2.0 Client Credentials",
                                    desc: "Applications authenticate with encrypted client credentials to obtain short-lived, scoped JWT access tokens. Establishes machine identity and RBAC context for standard machine-to-machine integrations.",
                                    badge: "Standard Tier",
                                    badgeColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50",
                                    accentBorder: "border-l-blue-500/50",
                                },
                                {
                                    icon: Lock,
                                    title: "OAuth with mTLS",
                                    stack: "OAuth 2.0 + Mutual TLS",
                                    desc: "Combines OAuth 2.0 bearer authorization with TLS certificate verification (x-client-verify). Ensures requests originate strictly from authorized client hardware or instances, which helps reduce unauthorized use and replay risks when correctly configured.",
                                    badge: "Secure Tier",
                                    badgeColor: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50",
                                    accentBorder: "border-l-indigo-500/50",
                                },
                                {
                                    icon: Shield,
                                    title: "OAuth + mTLS + HMAC",
                                    stack: "Complete Layered Defense",
                                    desc: "The highest protection level: OAuth 2.0 authentication and mTLS certificate verification are layered with HMAC-SHA256 request payload and timestamp signing, which strengthens request integrity and helps reduce unauthorized use and replay risks when correctly configured.",
                                    badge: "Enterprise Tier",
                                    badgeColor: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50",
                                    accentBorder: "border-l-purple-500/50",
                                },
                            ].map((item, idx) => {
                                const ItemIcon = item.icon;
                                return (
                                    <div key={idx} className={`p-6 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] border-l-2 ${item.accentBorder} flex flex-col justify-between`}>
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <ItemIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                                                <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${item.badgeColor}`}>{item.badge}</span>
                                            </div>
                                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1">{item.title}</h3>
                                            <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400/90 mb-2.5 font-medium">{item.stack}</div>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Example workflow */}
                        <div className="p-6 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0b0f19]">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-white/[0.04] pb-3">
                                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">API Retrieval Pipeline: Tiered Enforcement</div>
                                <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-medium">Enterprise Tier Active</span>
                            </div>
                            <div className="font-mono text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                                <div className="text-slate-500 dark:text-slate-500"># Step 1: Obtain scoped JWT token using client credentials</div>
                                <div className="pl-2 border-l border-slate-200 dark:border-white/[0.08]">
                                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">POST</span>
                                    <span className="text-slate-700 dark:text-slate-300"> /oauth/token</span>
                                    <span className="text-slate-500 block text-[11px] mt-0.5">{`Payload: { "client_id": "app_client_...", "client_secret": "..." }`}</span>
                                </div>
                                <div className="text-slate-500 dark:text-slate-500 pt-1"># Step 2: Layered retrieval with mTLS verification + HMAC request signing</div>
                                <div className="pl-2 border-l border-slate-200 dark:border-white/[0.08] space-y-0.5">
                                    <div>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">GET</span>
                                        <span className="text-slate-700 dark:text-slate-300"> /api/v1/credentials/retrieve?id=cred_8f29c</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">Authorization: Bearer &lt;jwt_access_token&gt; <span className="text-slate-400"># Scoped OAuth bearer token</span></div>
                                    <div className="text-[11px] text-slate-500">X-Client-Verify: SUCCESS <span className="text-slate-400"># Mutual TLS certificate validated</span></div>
                                    <div className="text-[11px] text-slate-500">X-Api-Signature: &lt;hmac_sha256_hex&gt; <span className="text-slate-400"># Signed path + timestamp with client secret</span></div>
                                    <div className="text-[11px] text-slate-500">X-Api-Timestamp: 1729505400 <span className="text-slate-400"># Sliding window replay protection</span></div>
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-white/[0.04] text-[11px] text-slate-500 dark:text-slate-400">
                                    ✓ Every retrieval undergoes identity attestation, scope filtering, rate limit evaluation, and differential audit logging.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    CTA
                ═══════════════════════════════════════════════════════════ */}
                <section className="py-20 border-t border-slate-200 dark:border-white/[0.06]">
                    <div className="max-w-2xl mx-auto px-4 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
                            Discuss Your Integration Requirements
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            Organizations can discuss their systems and requirements to evaluate additional integration possibilities. Schedule a conversation with our team.
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

            <FloatingCredentialWidget />
        </div>
    );
}
