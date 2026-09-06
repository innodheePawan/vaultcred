import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Privacy & Data Protection Policy",
    description: "Learn how Innodhee Services Pvt. Ltd. handles limited website enquiry data and maintains customer-controlled deployment standards for CredSecure.",
    path: "/privacy",
});

export default async function PrivacyPolicyPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <LegalPageLayout
            title="Privacy & Data Protection Policy"
            description="How Innodhee Services Pvt. Ltd. handles limited business enquiry information collected through the CredSecure public website."
            lastUpdated="September 2026"
            category="Privacy & Data Protection"
            applicationName={settings.applicationName || "CredSecure"}
            companyName={settings.companyName || "Innodhee Services Pvt. Ltd."}
            isLoggedIn={!!session?.user}
        >
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    1. Scope
                </h2>
                <p>
                    This Privacy Policy applies to the public CredSecure website (<code>getcredsecure.com</code>) and business interactions with Innodhee Services Pvt. Ltd. It covers information voluntarily provided through "Contact Us", "Request Demo", and business enquiry channels.
                </p>
                <p className="p-4 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs font-mono">
                    Under the standard CredSecure deployment model, the application, database and customer credential data are deployed within the customer's designated infrastructure or landscape and are not centrally hosted by Innodhee.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    2. Information We Collect
                </h2>
                <p>
                    We collect limited business contact information when you choose to contact us or request a demonstration, including:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li>Full Name;</li>
                    <li>Business email address;</li>
                    <li>Company or organization name;</li>
                    <li>Role or job function;</li>
                    <li>Stated use case, requirement, subject, or message details.</li>
                </ul>
                <p>
                    Limited technical information may also be processed where reasonably necessary to operate, secure and troubleshoot the public website.
                </p>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                    <strong>Notice:</strong> We do <strong>not</strong> ask website visitors to submit production credentials, passwords, API keys, private tokens, or customer secrets through website forms.
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    3. Customer Credential Data
                </h2>
                <p>
                    Under the standard CredSecure deployment model, customer credential data and the CredSecure application database remain within the customer's designated infrastructure and are not centrally hosted by Innodhee.
                </p>
                <p>
                    Innodhee does not maintain standing access to customer credential data. Any exceptional access required for implementation, troubleshooting or support must be explicitly authorized by the customer and limited to the agreed purpose.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    4. How We Use Website Information
                </h2>
                <p>We process website enquiry data to:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li>Respond to enquiries and demonstration requests;</li>
                    <li>Understand the organization’s stated business requirement or use case;</li>
                    <li>Communicate about CredSecure where requested or reasonably related to the enquiry;</li>
                    <li>Manage business relationships and requested follow-up;</li>
                    <li>Protect the website and investigate misuse or security incidents; and</li>
                    <li>Meet applicable legal obligations.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    5. Legal Bases (GDPR / UK GDPR)
                </h2>
                <p>
                    Depending on the circumstances, processing may rely on steps requested before entering a contract, performance of a contract, legitimate interests in responding to business enquiries and operating our business securely, compliance with legal obligations, or consent where required.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    6. Sharing &amp; Service Providers
                </h2>
                <p>
                    We do not sell personal information and currently do not use third-party advertising or marketing analytics providers on the CredSecure public website.
                </p>
                <p>
                    The public website is hosted using AWS infrastructure in the Asia Pacific (India) region. Infrastructure providers may process limited technical information necessary to host, secure and deliver the website.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    7. International Access
                </h2>
                <p>
                    The public website is hosted in India and is accessible globally. Where applicable law requires safeguards for international transfers of personal information, appropriate legally recognized measures will be considered based on the actual processing arrangement.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    8. Retention
                </h2>
                <p>
                    Innodhee retains enquiry information only for as long as reasonably necessary for the enquiry, business relationship, security, legal or legitimate record-keeping purposes.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    9. Security Safeguards
                </h2>
                <p>
                    Innodhee applies appropriate technical and organizational measures designed to protect personal information against unauthorized access, disclosure, alteration, loss or misuse. Depending on the processing context, these measures may include access restrictions, authentication controls, secure transmission, infrastructure security, logging and monitoring, and administrative safeguards appropriate to the nature of the information processed.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    10. Your Privacy Rights
                </h2>
                <p>
                    Depending on applicable data-protection law, you may have rights to request access, correction, deletion, restriction, objection, portability, or withdrawal of consent where applicable.
                </p>
                <p>
                    Requests concerning website data managed by Innodhee may be submitted to{" "}
                    <a href="mailto:customer-support@getcredsecure.com" className="text-blue-600 dark:text-blue-400 underline font-medium">
                        customer-support@getcredsecure.com
                    </a>.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    11. Children
                </h2>
                <p>
                    The CredSecure website and product are intended for business and enterprise audiences and are not intended for children.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    12. Cookie Policy
                </h2>
                <p>
                    Please refer to the CredSecure <Link href="/cookies" className="text-blue-600 dark:text-blue-400 underline font-medium">Cookie Policy</Link> for information about cookies and browser technologies.
                </p>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    13. Contact Information
                </h2>
                <div className="text-xs sm:text-sm space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">Innodhee Services Pvt. Ltd.</p>
                    <p>RI Elegance, Parappana Agrahara Main Rd, Sai Sree Layout, Parappana Agrahara,</p>
                    <p>Bengaluru, Karnataka 560100, India</p>
                    <p className="pt-2">
                        Contact Email:{" "}
                        <a href="mailto:customer-support@getcredsecure.com" className="text-blue-600 dark:text-blue-400 underline font-medium">
                            customer-support@getcredsecure.com
                        </a>
                    </p>
                    <p>Phone: +91-7406663433</p>
                </div>
            </section>
        </LegalPageLayout>
    );
}
