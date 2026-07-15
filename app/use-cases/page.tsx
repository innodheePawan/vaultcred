import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    ChevronRight,
    Workflow,
    Server,
    Users,
    Globe,
    KeyRound,
    FileSearch,
    AlertTriangle,
} from "lucide-react";

export const metadata = {
    title: "Use Cases | CredSecure — Operational Workflows We Secure",
    description: "Discover how CredSecure governs SAP integration credentials, production support access, vendor access control, service accounts, API security, compliance investigations, and incident response.",
};

export default async function UseCasesPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    const tier1UseCases = [
        {
            icon: Server,
            title: "SAP Landscape Integration Credential Governance",
            problem: "SAP landscapes rely on middleware tokens, RFC connections, and system-to-system credentials that are often permanently active, shared across teams, and invisible to security governance.",
            pain: [
                "Middleware API keys with zero rotational constraints",
                "Shared SAP landscape accounts lacking individual non-repudiation",
                "Permanent standing access on RFC database connections",
                "Undocumented integration-to-credential registry mappings",
            ],
            solution: "CredSecure enforces complete cryptographic lifecycle management for the entire SAP ecosystem. Each token, connection string, and RFC account is symmetrically isolated, dynamically scoped, and audited continuously through immutable ledger paths.",
            workflow: [
                { step: "Register", desc: "Classify SAP credential with environment and category scoping" },
                { step: "Govern", desc: "Assign RBAC policies restricting access to authorized SAP Basis teams" },
                { step: "Monitor", desc: "Track every access event with full user attribution and timestamps" },
                { step: "Enforce", desc: "Set expiry policies and receive proactive alerts before credential rotation deadlines" },
                { step: "Audit", desc: "Generate compliance-ready access reports for any time window instantly" },
            ],
            outcome: "Complete visibility and operational custody over SAP credential transactions. Access is systematically authorized and cryptographically isolated.",
            color: "border-l-blue-500/40",
            dotColor: "bg-blue-500/60",
        },
        {
            icon: KeyRound,
            title: "Production maintenance access with automatic revocation",
            problem: "Engineers need access to production credentials during maintenance windows and incident response. Without governance, these become permanent backdoors that persist long after the work is complete.",
            pain: [
                "Standing production privileges outlasting active maintenance intervals",
                "Anonymous shared database profiles lacking individual attribution",
                "Absence of systematic revocation boundaries at task completion",
                "Unverified operator actions during forensic incident reviews",
            ],
            solution: "Enables dynamic, transient production scopes featuring scheduled automatic revocation and high-density operational auditing. Operators obtain cryptographically constrained access only during pre-authorized maintenance intervals.",
            workflow: [
                { step: "Request", desc: "Engineer requests access to specific production credentials" },
                { step: "Authorize", desc: "RBAC policies validate the engineer's group membership and scope" },
                { step: "Deliver", desc: "Time-bound access granted with individual session tracking" },
                { step: "Monitor", desc: "Real-time visibility into active access and credential usage" },
                { step: "Revoke", desc: "Automatic access termination when the time window expires" },
            ],
            outcome: "Zero standing credentials in production environments. Every operator transaction is time-bound, attributed, and dynamically revoked.",
            color: "border-l-indigo-500/40",
            dotColor: "bg-indigo-500/60",
        },
        {
            icon: Globe,
            title: "External Vendor Access Custody",
            problem: "External vendors and contractors need access to specific credentials for implementation, support, or integration work. Without governance, vendor access becomes permanent, over-scoped, and invisible.",
            pain: [
                "Over-scoped vendor permissions exceeding structural requirements",
                "Indefinite contractor credentials persisting post-contract lifecycle",
                "Lack of record-level boundary constraints for external entities",
                "Absent cryptographic validation trails of external agent requests",
            ],
            solution: "Enforces purpose-built, perimeter-restricted vendor access scopes containing strict runtime bounds and mandatory multi-factor validation. External actors are confined exclusively to designated identity variables.",
            workflow: [
                { step: "Invite", desc: "Send vendor invite with pre-configured scope and access window" },
                { step: "Scope", desc: "Restrict access to specific credential IDs, categories, and environments" },
                { step: "Activate", desc: "Vendor completes onboarding with mandatory 2FA enrollment" },
                { step: "Monitor", desc: "Track all vendor access events with full attribution" },
                { step: "Terminate", desc: "Access automatically expires at the configured end date" },
            ],
            outcome: "Deterministic vendor confinement with automatic boundary termination. All external interactions are fully audited and compliance-validated.",
            color: "border-l-violet-500/40",
            dotColor: "bg-violet-500/60",
        },
    ];

    const tier2UseCases = [
        {
            icon: Users,
            title: "Automated Service Account Lifecycle Governance",
            desc: "Establishes systematic ownership, cryptographic rotation bounds, and access visibility for system-to-system interfaces across cloud and physical environments.",
            outcomes: ["Sovereign ownership mapping for all active system accounts", "Automated rotation constraints with early expiry alerts", "Environment-isolated access policies with zero-trust RBAC"],
        },
        {
            icon: Server,
            title: "Federated API Security & Boundary Protection",
            desc: "Governs external API consumer integrations utilizing high-trust certificate verification, request rate regulation, and request-level signature audits.",
            outcomes: ["Three-tier API security enforcement (Standard, Secure, Enterprise)", "Boundary-level endpoint rate limitation", "Systematic environment and tenant scope auditing"],
        },
        {
            icon: FileSearch,
            title: "Immutable Forensic Audit Preservation",
            desc: "Facilitates real-time compliance audits and post-incident forensic reviews through deterministic change tracking and tamper-proof event ledgers.",
            outcomes: ["Immutable write-once operational audit trails", "Differential payload audit histories", "Activity reporting mapped to administrative custody indices"],
        },
        {
            icon: AlertTriangle,
            title: "Emergency Custody & Break-Glass Governance",
            desc: "Authorizes emergency access paths with automated revocation boundaries, continuous administrative notifications, and post-event audit generation.",
            outcomes: ["Monitored break-glass emergency workflows", "Proactive administrative session revocation triggers", "Consolidated post-event compliance logs"],
        },
    ];

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 font-sans">
            <MarketingNavbar
                applicationName={settings.applicationName || "CredSecure"}
                isLoggedIn={!!session?.user}
            />

            <main className="relative z-10 pt-16">

                {/* Hero */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="max-w-3xl">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400/70 mb-4">Use Cases</div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
                            Operational Workflows We Secure
                        </h1>
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                            Enterprise credential governance for the operational workflows that create the most risk — and the most value when governed properly.
                        </p>
                    </div>
                </section>

                {/* Category Hook */}
                <section className="border-y border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01]">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                            &ldquo;Most credential risks begin after storage. These use cases show how governance addresses the operational lifecycle — not just the encryption.&rdquo;
                        </p>
                    </div>
                </section>

                {/* Tier 1: Full Deep-Dive Use Cases */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-20">
                    {tier1UseCases.map((uc, idx) => (
                        <div key={idx} className={`border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white dark:bg-white/[0.02] border-l-2 ${uc.color} overflow-hidden`}>
                            {/* Header */}
                            <div className="px-6 sm:px-8 pt-8 pb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <uc.icon className="w-5 h-5 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{uc.title}</h2>
                                </div>

                                {/* Problem */}
                                <div className="mb-6">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-2">The Problem</div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{uc.problem}</p>
                                </div>

                                {/* Pain Points */}
                                <div className="mb-6">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-2">Operational Pain</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {uc.pain.map((p, pIdx) => (
                                            <div key={pIdx} className="flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-rose-500/50 mt-2 shrink-0" />
                                                <span className="text-xs text-slate-600 dark:text-slate-500">{p}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Solution */}
                                <div className="mb-6">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-2">How CredSecure Solves It</div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{uc.solution}</p>
                                </div>
                            </div>

                            {/* Workflow */}
                            <div className="px-6 sm:px-8 py-6 border-t border-slate-200 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-4">Governance Workflow</div>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
                                    {uc.workflow.map((step, sIdx) => (
                                        <div key={sIdx} className="flex items-center flex-1">
                                            <div className="text-center flex-1 px-2">
                                                <div className="text-xs font-semibold text-slate-900 dark:text-white">{step.step}</div>
                                                <div className="text-[10px] text-slate-600 dark:text-slate-500 mt-0.5">{step.desc}</div>
                                            </div>
                                            {sIdx < uc.workflow.length - 1 && (
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-700 shrink-0 hidden sm:block" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Outcome */}
                            <div className="px-6 sm:px-8 py-4 border-t border-slate-200 dark:border-white/[0.04] bg-slate-100/20 dark:bg-white/[0.02]">
                                <div className="flex items-start gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${uc.dotColor} mt-1.5 shrink-0`} />
                                    <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">{uc.outcome}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Tier 2: Structured Cards                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-555 dark:text-slate-600 mb-6">Additional Use Cases</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tier2UseCases.map((uc, idx) => (
                            <div key={idx} className="p-5 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-slate-355 dark:hover:border-white/[0.1] transition-colors">
                                <div className="flex items-center gap-2 mb-3">
                                    <uc.icon className="w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{uc.title}</h3>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed mb-4">{uc.desc}</p>
                                <div className="space-y-1.5">
                                    {uc.outcomes.map((o, oIdx) => (
                                        <div key={oIdx} className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500/50 mt-1.5 shrink-0" />
                                            <span className="text-[11px] text-slate-600 dark:text-slate-400">{o}</span>
                                        </div>
                                    ))}   ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01]">
                    <div className="max-w-2xl mx-auto px-4 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
                            Which Workflow Matters Most to You?
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            Schedule a tailored walkthrough focused on the operational credential workflows most critical to your organization.
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
