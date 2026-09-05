import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import { UseCaseWorkflowVisual } from "@/components/marketing/UseCaseWorkflowVisual";
import { UseCasesSection } from "@/components/marketing/UseCasesSection";
import { Tier1UseCaseData } from "@/components/marketing/ExpandableUseCaseCard";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    ArrowDown,
    Server,
    Users,
    FileSearch,
    AlertTriangle,
    Workflow,
} from "lucide-react";

export const metadata = {
    title: "Use Cases | CredSecure — Real Credential Problems, Solved",
    description: "Discover how CredSecure governs SAP integration credentials, production support access, vendor access custody, application credential provisioning, and BTP security material provisioning.",
};

export default async function UseCasesPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    const tier1UseCases: Tier1UseCaseData[] = [
        {
            id: "sap-credential-governance",
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
            id: "production-access",
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
            id: "external-vendor-access",
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
        {
            id: "application-credential-provisioning",
            title: "Application Credential Provisioning",
            subtitle: "Deploy applications without manually distributing .env or credential files.",
            problem: "Applications commonly depend on .env files and credential configurations during deployment. Manually sharing these files with developers or deployment teams increases credential exposure and creates unmanaged copies outside centralized governance.",
            pain: [
                "Manual Credential Sharing: Developers or administrators require access to sensitive files simply to configure and deploy an application",
                "Uncontrolled Copies: Credential files can remain on developer machines, shared locations, deployment servers or unmanaged paths",
                "Unnecessary Credential Visibility: Deployment teams may gain access to credential values simply to configure the application, even when direct knowledge of those credentials isn't required",
                "Credential Updates: When credentials change, updated files may need to be manually redistributed and applied to the application",
            ],
            solution: "Instead of distributing the .env file to developers or deployment teams, the application is configured with an authorized CredSecure API Client. During application setup, deployment or startup, the application authenticates securely and retrieves only its authorized configuration directly from CredSecure.",
            workflow: [
                { step: "API Client", desc: "Application configured with authorized CredSecure API Client" },
                { step: "Authenticate", desc: "Application authenticates securely using assigned API Client" },
                { step: "Authorize", desc: "CredSecure validates authorized credential file & environment" },
                { step: "Retrieve", desc: "Application retrieves permitted .env configuration via API" },
                { step: "Configure", desc: "Application loads retrieved values into runtime environment" },
                { step: "Audit", desc: "Credential retrieval is logged and traceable in audit ledgers" },
            ],
            updateNote: "When the credential is updated in CredSecure, the application retrieves the latest authorized version during its next startup or deployment. Applying updated environment variables may require an application restart depending on the application architecture.",
            outcomeHeadline: "Developers deploy the application. CredSecure delivers the credentials.",
            outcomeSub: "Applications consume only the credential configuration they are authorized to access, while credential governance and audit remain centralized in CredSecure.",
            color: "border-l-emerald-500/40",
            dotColor: "bg-emerald-500/60",
            visualType: "env",
        },
        {
            id: "btp-security-material-provisioning",
            title: "BTP Security Material Provisioning",
            subtitle: "From third-party credential onboarding to BTP Integration Suite — without internal credential handling.",
            problem: "Enterprise integrations frequently depend on credentials, OAuth configurations, secure notes, keys and other supported security material provided by third parties. Traditionally, internal teams must receive these credentials and manually recreate the required security material in BTP Integration Suite. This introduces unnecessary credential handling, additional exposure and operational dependency between vendors and internal teams.",
            pain: [
                "Third-Party Credential Sharing: Vendors may need to communicate sensitive credentials to internal teams through an agreed exchange mechanism",
                "Unnecessary Credential Visibility: Internal integration or administration teams may gain visibility into credential values they only need to configure, rather than know",
                "Manual BTP Provisioning: Internal teams must manually create or update corresponding security material in BTP Integration Suite",
                "Operational Dependency: Credential onboarding requires coordination between the vendor, administrators and integration teams before the integration can consume the required security material",
            ],
            solution: "An administrator configures the BTP Integration Suite synchronization target and grants the third party controlled access to the required credential category/scope in CredSecure. The vendor creates the credential directly within its authorized boundary. CredSecure then provisions the applicable security material to the configured BTP Integration Suite target — without requiring internal teams to manually receive or recreate the credential. Credential creation, access and provisioning remain governed and auditable through CredSecure.",
            workflow: [
                { step: "Configure Target", desc: "Administrator configures the BTP Integration Suite synchronization target in CredSecure." },
                { step: "Grant Vendor Access", desc: "Administrator grants the vendor controlled access to the required credential category/scope." },
                { step: "Create Credential", desc: "Vendor creates the required credential directly within CredSecure." },
                { step: "Govern", desc: "CredSecure applies access control, ownership, scope and audit policies." },
                { step: "Provision", desc: "CredSecure provisions the applicable security material to the configured BTP Integration Suite target." },
                { step: "Consume", desc: "The integration consumes the provisioned security material from BTP Integration Suite." },
            ],
            extensibilityTitle: "Built for BTP Integration Suite today. Designed to evolve.",
            extensibilityNote: "BTP Integration Suite is the currently implemented provisioning target. Additional target-system integrations can be explored through co-innovation based on customer architecture, security and business requirements.",
            outcomeHeadline: "Vendors provide the credential. CredSecure governs and delivers it.",
            outcomeSub: "Third-party credentials can move from controlled vendor onboarding to BTP Integration Suite security material while reducing internal credential handling and maintaining centralized governance and audit traceability.",
            color: "border-l-amber-500/40",
            dotColor: "bg-amber-500/60",
            visualType: "btp",
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

                {/* Redesigned Use Cases Hero */}
                <section className="py-14 sm:py-18 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                        
                        {/* Left Content Column */}
                        <div className="lg:col-span-7 space-y-5 text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                <Workflow className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    USE CASES
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-[2.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25] max-w-2xl">
                                <div>Real Credential Problems.</div>
                                <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 mt-1">
                                    Practical Ways CredSecure Solves Them.
                                </div>
                            </h1>

                            <p className="text-base sm:text-lg text-slate-650 dark:text-slate-300 leading-relaxed max-w-xl">
                                See how CredSecure helps organizations control credential access, reduce manual handling, automate credential delivery, and maintain visibility across real operational workflows.
                            </p>

                            {/* CTA Actions */}
                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                <a href="#quick-discovery-navigator">
                                    <Button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all inline-flex items-center gap-2">
                                        Explore Use Cases
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

                        {/* Right Column: Where CredSecure Fits Visual */}
                        <div className="lg:col-span-5">
                            <UseCaseWorkflowVisual />
                        </div>

                    </div>
                </section>

                {/* Single-Open Accordion Use Cases Section (Navigator + Tier-1 Expandable Cards) */}
                <UseCasesSection tier1UseCases={tier1UseCases} />

                {/* Tier 2: Structured Cards (Standard 2x2 Grid) */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-6">Additional Use Cases</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tier2UseCases.map((uc, idx) => {
                            const CardIcon = uc.icon;
                            return (
                                <div key={idx} className="p-5 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.1] transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CardIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{uc.title}</h3>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed mb-4">{uc.desc}</p>
                                    <div className="space-y-1.5">
                                        {uc.outcomes.map((o, oIdx) => (
                                            <div key={oIdx} className="flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-indigo-500/50 mt-1.5 shrink-0" />
                                                <span className="text-[11px] text-slate-600 dark:text-slate-400">{o}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
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
