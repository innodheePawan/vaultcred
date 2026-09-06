import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Data Protection & GDPR",
    description: "How CredSecure customer-controlled deployment model separates website personal data from customer credential data.",
    path: "/data-protection",
});

export default async function DataProtectionPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <LegalPageLayout
            title="Data Protection & GDPR Statement"
            description="How CredSecure's customer-controlled deployment model separates website personal data from customer credential data."
            lastUpdated="September 2026"
            category="Data Protection & Compliance"
            applicationName={settings.applicationName || "CredSecure"}
            companyName={settings.companyName || "Innodhee Services Pvt. Ltd."}
            isLoggedIn={!!session?.user}
        >
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    1. Two Distinct Data Contexts
                </h2>
                <div className="overflow-x-auto border border-slate-200 dark:border-white/[0.06] rounded-xl">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-100 dark:bg-white/[0.03] text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/[0.06] font-semibold">
                            <tr>
                                <th className="p-3">Context</th>
                                <th className="p-3">Who Controls It?</th>
                                <th className="p-3">Innodhee Position</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                            <tr>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">Public website / Demo / Contact Us</td>
                                <td className="p-3">Innodhee Services Pvt. Ltd.</td>
                                <td className="p-3">Limited business contact data processed by Innodhee</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">Customer CredSecure deployment</td>
                                <td className="p-3">Customer Organization</td>
                                <td className="p-3 font-medium text-blue-600 dark:text-blue-400">Hosted in customer-designated infrastructure; Innodhee has <strong>no standing access</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    2. Customer-Controlled Deployment Model
                </h2>
                <p>
                    Under the standard CredSecure deployment model, customer credentials, security material, application databases and access records are maintained within the customer's designated infrastructure or landscape and are not centrally hosted by Innodhee.
                </p>
                <p>
                    The customer retains full control over users, roles, scopes, retention, backups, infrastructure, integrations, and credential access.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    3. Processor vs Controller Status
                </h2>
                <p>
                    Because standard CredSecure deployments remain within the customer's environment and Innodhee does not maintain standing access, Innodhee is not automatically processing the contents of the customer's CredSecure database merely by licensing or supplying the software.
                </p>
                <p>
                    If a specific support, implementation or managed-service arrangement requires Innodhee to process personal data on the customer's behalf, the parties should assess whether processor obligations and a DPA are required for that specific arrangement.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    4. Supporting Data Protection Controls
                </h2>
                <p>
                    CredSecure includes enterprise capabilities—such as role- and scope-based access control, credential masking, authentication controls, credential lifecycle and expiry visibility, audit traceability, controlled third-party access, and governed credential synchronization/provisioning.
                </p>
                <p className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
                    These capabilities may support customers in implementing security and governance controls relevant to their data-protection obligations under GDPR or other applicable frameworks. CredSecure should be described as supporting data-protection controls, not as universally or automatically GDPR compliant by itself.
                </p>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    5. Contact
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
                </div>
            </section>
        </LegalPageLayout>
    );
}
