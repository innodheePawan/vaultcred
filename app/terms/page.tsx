import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Terms of Use",
    description: "Terms governing access to and use of the CredSecure public website at getcredsecure.com.",
    path: "/terms",
});

export default async function TermsOfUsePage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <LegalPageLayout
            title="Terms of Use"
            description="Terms governing access to and use of the public CredSecure website at getcredsecure.com operated by Innodhee Services Pvt. Ltd."
            lastUpdated="September 2026"
            category="Legal & Governance"
            applicationName={settings.applicationName || "CredSecure"}
            companyName={settings.companyName || "Innodhee Services Pvt. Ltd."}
            isLoggedIn={!!session?.user}
        >
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    1. Scope of Terms
                </h2>
                <p>
                    These Terms of Use govern access to and use of the public CredSecure website at <code>getcredsecure.com</code> operated by Innodhee Services Pvt. Ltd.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    2. Enterprise Software &amp; Customer Agreements
                </h2>
                <p className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
                    Licensing, implementation, deployment, maintenance, support and enterprise use of CredSecure software are governed by the applicable customer agreement, order form, statement of work or other written agreement executed between the customer organization and Innodhee Services Pvt. Ltd.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    3. Permitted Use
                </h2>
                <p>
                    You may use the website for legitimate informational and business purposes. You must not attempt to interfere with website operation, gain unauthorized access, introduce malicious code, perform unauthorized security testing, scrape the website in a manner that materially affects its operation, or use the website for unlawful purposes.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    4. Website Information
                </h2>
                <p>
                    Information published on <code>getcredsecure.com</code> is provided for general product and business information. Product capabilities, deployment arrangements, support commitments and contractual obligations applicable to a particular customer are determined by the applicable written customer agreement.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    5. Intellectual Property
                </h2>
                <p>
                    All content, trademarks, branding, logos, and materials on <code>getcredsecure.com</code> are the property of Innodhee Services Pvt. Ltd. and are protected by applicable intellectual property laws.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    6. Third-Party Links
                </h2>
                <p>
                    The website may contain links to third-party websites or services. Innodhee does not control those third-party resources and is not responsible for their content, availability or privacy practices.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    7. Website Availability
                </h2>
                <p>
                    Innodhee may modify, suspend or discontinue portions of the public website from time to time and does not guarantee uninterrupted availability of the public website.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    8. Disclaimer
                </h2>
                <p>
                    The public website and its contents are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    9. Limitation of Liability
                </h2>
                <p>
                    To the maximum extent permitted by applicable law, Innodhee Services Pvt. Ltd. shall not be liable for any indirect, incidental, consequential, or punitive damages arising out of your access to or use of the public website.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    10. Changes to These Terms
                </h2>
                <p>
                    We may update these Terms of Use from time to time. The "Last Updated" date at the top of this page will be revised accordingly.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    11. Governing Law &amp; Jurisdiction
                </h2>
                <p className="p-4 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs font-mono text-slate-600 dark:text-slate-400">
                    [GOVERNING LAW / JURISDICTION — TO BE CONFIRMED]
                </p>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    12. Contact
                </h2>
                <div className="text-xs sm:text-sm space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">Innodhee Services Pvt. Ltd.</p>
                    <p>RI Elegance, Parappana Agrahara Main Rd, Sai Sree Layout, Parappana Agrahara,</p>
                    <p>Bengaluru, Karnataka 560100, India</p>
                    <p className="pt-2">
                        Contact Email:{" "}
                        <a href="mailto:customer-support@getcredsecure.com" className="text-blue-600 dark:text-blue-400 underline font-medium whitespace-nowrap">
                            customer-support@getcredsecure.com
                        </a>
                    </p>
                    <p>Phone: +91-7406663433</p>
                </div>
            </section>
        </LegalPageLayout>
    );
}
