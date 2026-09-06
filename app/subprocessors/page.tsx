import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Info } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Service Providers & Subprocessors",
    description: "Overview of public website hosting providers and customer deployment architecture.",
    path: "/subprocessors",
});

export default async function SubprocessorsPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <LegalPageLayout
            title="Service Providers & Subprocessors"
            description="Clear information regarding infrastructure providers for the getcredsecure.com public website vs. customer-controlled deployments."
            lastUpdated="September 2026"
            category="Trust & Transparency"
            applicationName={settings.applicationName || "CredSecure"}
            companyName={settings.companyName || "Innodhee Services Pvt. Ltd."}
            isLoggedIn={!!session?.user}
        >
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    1. Why This Page Is Different for CredSecure
                </h2>
                <p>
                    CredSecure is normally deployed inside the customer's designated infrastructure. Innodhee therefore does not maintain a standard central hosting stack that processes every customer's CredSecure database or credential data.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    2. Public Website Service Provider
                </h2>
                <div className="overflow-x-auto border border-slate-200 dark:border-white/[0.06] rounded-xl">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-100 dark:bg-white/[0.03] text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/[0.06] font-semibold">
                            <tr>
                                <th className="p-3">Provider</th>
                                <th className="p-3">Purpose</th>
                                <th className="p-3">Region / Scope</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                            <tr>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">Amazon Web Services (AWS)</td>
                                <td className="p-3">Infrastructure hosting for the public CredSecure website</td>
                                <td className="p-3 text-blue-600 dark:text-blue-400 font-medium">Asia Pacific (India)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                        <strong>Important Distinction:</strong> AWS hosting of the public <code>getcredsecure.com</code> website does not mean that customer CredSecure instances, databases, credentials or security material are hosted by Innodhee on AWS.
                    </p>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    3. Customer Infrastructure Providers
                </h2>
                <p>
                    Cloud, database, network, backup or other infrastructure providers selected and contracted by the customer for its CredSecure deployment are customer providers and are not Innodhee subprocessors.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    4. Customer Credential Data Subprocessors
                </h2>
                <p>
                    Under the current standard deployment model, Innodhee does not engage a centrally operated hosting subprocessor to store or process customer CredSecure credential data.
                </p>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    5. Contact
                </h2>
                <p className="text-xs sm:text-sm">
                    Inquiries regarding subprocessor governance should be sent to{" "}
                    <a href="mailto:customer-support@getcredsecure.com" className="text-blue-600 dark:text-blue-400 underline font-medium">
                        customer-support@getcredsecure.com
                    </a>.
                </p>
            </section>
        </LegalPageLayout>
    );
}
