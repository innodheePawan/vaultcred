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
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "SAP and BTP Credential Use Cases",
    description: "Enterprise use cases for SAP credential governance, production-support access, external vendor access, application credential provisioning, and BTP security-material provisioning.",
    path: "/use-cases",
});

export default async function UseCasesPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    const tier1UseCases: Tier1UseCaseData[] = [
        {
            id: "sap-credential-governance",
            title: "SAP Credential Governance",
            subtitle: "Bring SAP integration credentials under centralized operational control.",
            problem: "SAP landscapes depend on integration credentials, service accounts, API keys, certificates and system connections across multiple applications and environments. When these credentials are managed independently by different teams or stored across spreadsheets, shared locations and system-specific repositories, organizations lose visibility into ownership, access, expiry and change history.",
            pain: [
                "Scattered Credential Management: SAP credentials may be stored across multiple teams, systems and operational repositories.",
                "Unclear Ownership & Access: It can be difficult to determine who owns a credential, who can access it and why access is required.",
                "Expiry & Lifecycle Risk: Credentials may approach expiry without sufficient operational visibility, potentially affecting integrations.",
                "Limited Traceability: Changes and access activity may be difficult to correlate across the credential lifecycle.",
            ],
            solution: "CredSecure provides a governed location for managing SAP-related credentials with ownership, environment and category context. Administrators can control access using roles and scopes, monitor credential lifecycle and expiry, maintain version history, and trace credential activity through centralized audit records.",
            beforeAfterData: {
                traditional: {
                    flow: ["SAP Systems / Integrations", "Multiple Teams", "Shared Credential Stores", "Manual Tracking"],
                    highlights: [
                        { title: "Scattered Ownership", desc: "Credential responsibility is distributed across teams and repositories." },
                        { title: "Manual Lifecycle Tracking", desc: "Expiry and changes may depend on spreadsheets or individual reminders." },
                        { title: "Limited Visibility", desc: "Access and credential history can be difficult to reconstruct." },
                    ],
                },
                governed: {
                    flow: ["SAP Credential", "CredSecure", "Controlled Access", "Lifecycle & Audit"],
                    highlights: [
                        { title: "Centralized Governance", desc: "SAP credentials are registered with environment, category and ownership context." },
                        { title: "Controlled Access", desc: "Users receive access according to configured role and scope." },
                        { title: "Lifecycle Visibility", desc: "Expiry, status and version information remain centrally visible." },
                        { title: "Audit Traceability", desc: "Credential access and changes are recorded through CredSecure." },
                    ],
                },
            },
            workflow: [
                { step: "Register", desc: "Register the SAP credential with the relevant application, environment and category." },
                { step: "Assign Ownership", desc: "Associate the credential with the responsible team or operational owner." },
                { step: "Govern Access", desc: "Apply role- and scope-based access rules for authorized users." },
                { step: "Monitor Lifecycle", desc: "Track status, expiry and relevant credential lifecycle information." },
                { step: "Manage Changes", desc: "Maintain credential updates and version history through CredSecure." },
                { step: "Audit", desc: "Review access and change activity through centralized audit records." },
            ],
            outcomeHeadline: "Know which SAP credentials exist, who owns them, who can access them, and when they need attention.",
            outcomeSub: "CredSecure gives SAP teams a governed credential lifecycle with centralized visibility, controlled access and audit traceability.",
            color: "border-l-blue-500/40",
            dotColor: "bg-blue-500/60",
        },
        {
            id: "production-access",
            title: "Production Access",
            subtitle: "Give production credential access without giving away permanent control.",
            problem: "Engineers and support teams may need temporary access to production credentials during maintenance, troubleshooting or incident response. When credentials are broadly shared or access remains available beyond the required activity, organizations create unnecessary standing access and lose clear accountability.",
            pain: [
                "Standing Production Access: Users may retain credential access after the operational requirement has ended.",
                "Shared Credential Visibility: Multiple people may know or retain sensitive production credential values.",
                "Manual Access Removal: Administrators may depend on manual follow-up to remove temporary access.",
                "Limited Accountability: It may be difficult to establish who accessed a production credential and when.",
            ],
            solution: "CredSecure allows administrators to provide controlled access to production credentials within an authorized scope and defined access period. Access remains associated with an individual user, can be governed by configured policies, and is recorded through CredSecure's audit trail.",
            beforeAfterData: {
                traditional: {
                    flow: ["Production Credential", "Share with Engineer", "Maintenance Activity", "Access Remains"],
                    highlights: [
                        { title: "Standing Access", desc: "Access can continue after maintenance is complete." },
                        { title: "Credential Exposure", desc: "Production values may be shared through operational channels." },
                        { title: "Manual Cleanup", desc: "Removing access depends on administrators remembering to revoke it." },
                        { title: "Weak Attribution", desc: "Shared credential handling makes individual accountability harder." },
                    ],
                },
                governed: {
                    flow: ["CredSecure", "Authorized User", "Scoped / Time-Bound Access", "Automatic Access Expiry"],
                    highlights: [
                        { title: "Controlled Access", desc: "Users access only authorized production credentials." },
                        { title: "Defined Access Period", desc: "Access can be limited according to the approved operational requirement." },
                        { title: "Individual Attribution", desc: "Access remains tied to the authorized user." },
                        { title: "Audit Traceability", desc: "Production credential access is recorded centrally." },
                    ],
                },
            },
            workflow: [
                { step: "Identify Need", desc: "User requires access to a specific production credential for an authorized activity." },
                { step: "Authorize", desc: "Administrator or configured access policy validates the user's permitted scope." },
                { step: "Grant Access", desc: "The user receives controlled access to the authorized credential." },
                { step: "Monitor", desc: "CredSecure records the user's credential access activity." },
                { step: "Expire Access", desc: "Configured time-bound access ends when its permitted period expires." },
                { step: "Audit", desc: "Administrators can review who accessed the credential and when." },
            ],
            governanceNoteTitle: "Governance Note",
            governanceNote: "Time-bound access applies according to the access policy and configuration established by the organization. CredSecure does not replace the customer's operational approval or change-management processes.",
            outcomeHeadline: "Production access when it is needed. Control when it is no longer needed.",
            outcomeSub: "Teams can provide operational access while reducing unnecessary standing credential exposure and maintaining individual accountability.",
            color: "border-l-indigo-500/40",
            dotColor: "bg-indigo-500/60",
        },
        {
            id: "external-vendor-access",
            title: "External Vendor Access",
            subtitle: "Give third parties access only to the credentials they are authorized to use.",
            problem: "Vendors and external partners frequently need access to specific credentials during implementation, support or integration activities. Traditional approaches may require credentials to be shared directly or give vendors broader and longer-lasting access than the engagement actually requires.",
            pain: [
                "Direct Credential Sharing: Sensitive credential values may be sent to vendors through email, chat or other agreed channels.",
                "Over-Scoped Access: A vendor may gain access to more credentials or environments than required.",
                "Access Outliving the Engagement: Vendor access may remain active after the work or contract period has ended.",
                "Limited External-User Traceability: Organizations may struggle to clearly identify which vendor accessed which credential and when.",
            ],
            solution: "CredSecure allows administrators to create controlled external access for vendors and partners. Access can be restricted by credential category, environment and permitted scope, with defined validity periods and audit traceability. Vendors interact only with the credential resources made available to them within their authorized boundary.",
            beforeAfterData: {
                traditional: {
                    flow: ["Internal Team", "Share Credential", "Vendor", "Vendor Retains Copy"],
                    highlights: [
                        { title: "Credential Distribution", desc: "Sensitive values leave the organization's governed workflow." },
                        { title: "Broad Visibility", desc: "Vendors may receive more information than required." },
                        { title: "Persistent Copies", desc: "Credentials can remain in email, chat or vendor systems." },
                        { title: "Manual Offboarding", desc: "Access removal depends on operational follow-up." },
                    ],
                },
                governed: {
                    flow: ["Administrator", "Scoped Vendor Access", "CredSecure", "Authorized Credential"],
                    highlights: [
                        { title: "Controlled Vendor Access", desc: "Vendors access only permitted credential resources." },
                        { title: "Scope Boundaries", desc: "Access can be constrained by environment, category and permissions." },
                        { title: "Defined Validity", desc: "External access can be limited to the required engagement period." },
                        { title: "Centralized Audit", desc: "Vendor credential activity remains traceable through CredSecure." },
                    ],
                },
            },
            workflow: [
                { step: "Configure Vendor", desc: "Administrator creates or authorizes the external vendor relationship." },
                { step: "Assign Scope", desc: "Define the credential categories, environments and permissions available to the vendor." },
                { step: "Establish Validity", desc: "Configure the permitted access period for the external user." },
                { step: "Vendor Access", desc: "Vendor accesses only the credential resources available within its authorized scope." },
                { step: "Monitor", desc: "CredSecure records relevant external-user credential activity." },
                { step: "Expire / Remove Access", desc: "Vendor access ends according to the configured validity or administrative action." },
            ],
            outcomeHeadline: "Vendors get the access they need — without giving them unrestricted credential visibility.",
            outcomeSub: "External credential access stays scoped, time-aware and traceable while the organization retains governance over the credential lifecycle.",
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
            beforeAfterData: {
                traditional: {
                    flow: [".env File", "Developer / Admin", "Manual Share / Copy", "Application"],
                    highlights: [
                        { title: "Credential Exposure", desc: "Sensitive secrets visible in chat, emails, and local drives." },
                        { title: "Manual Distribution", desc: "Environment changes require manually updating multiple team members." },
                        { title: "Unmanaged Copies", desc: "Stale credential files remain on developer laptops and staging servers." },
                    ],
                },
                governed: {
                    flow: ["CredSecure", "Authorized API Access", "Application", "Runtime Config"],
                    highlights: [
                        { title: "Controlled Access", desc: "Applications access only authorized credentials scoped to environment." },
                        { title: "Direct Application Retrieval", desc: "The application retrieves its authorized configuration directly from CredSecure." },
                        { title: "Centralized Governance & Audit", desc: "Every retrieval is identity-validated and fully logged in audit trails." },
                    ],
                },
            },
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
            beforeAfterData: {
                traditional: {
                    flow: ["Vendor Credential", "Internal Teams", "Manual Handling", "BTP Configuration"],
                    highlights: [
                        { title: "Third-Party Credential Sharing", desc: "Vendors communicate sensitive credentials to internal teams." },
                        { title: "Unnecessary Credential Visibility", desc: "Internal teams gain visibility into credentials they only need to configure." },
                        { title: "Manual BTP Provisioning", desc: "Teams manually create or update security material in BTP." },
                        { title: "Operational Dependency", desc: "Requires coordination between vendor, admin, and integration teams." },
                    ],
                },
                governed: {
                    flow: ["Vendor Onboarding", "CredSecure Governance", "Automated Sync", "BTP Integration Suite"],
                    highlights: [
                        { title: "Direct Vendor Onboarding", desc: "Third party creates credentials directly within authorized boundary." },
                        { title: "No Internal Credential Handling", desc: "Internal teams do not receive or manually recreate credentials." },
                        { title: "Automated Provisioning", desc: "Security material provisioned directly to BTP Integration Suite." },
                        { title: "Centralized Governance & Audit", desc: "Creation, access, and sync operations remain fully auditable." },
                    ],
                },
            },
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
