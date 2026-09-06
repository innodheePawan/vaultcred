import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { AlertCircle } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Data Processing Addendum",
    description: "Optional contractual terms for processor relationships where Innodhee processes personal data on customer behalf.",
    path: "/dpa",
});

export default async function DPAPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <LegalPageLayout
            title="Data Processing Addendum — Where Applicable"
            description="Optional contractual terms for situations where Innodhee Services Pvt. Ltd. processes personal data on a customer's behalf."
            lastUpdated="September 2026"
            category="Customer Terms & DPA"
            applicationName={settings.applicationName || "CredSecure"}
            companyName={settings.companyName || "Innodhee Services Pvt. Ltd."}
            isLoggedIn={!!session?.user}
        >
            {/* Notice on Applicability */}
            <section className="space-y-4">
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        Notice on DPA Applicability
                    </div>
                    <p className="text-xs sm:text-sm font-semibold">
                        This DPA is not automatically applicable to every CredSecure customer.
                    </p>
                    <p className="text-xs leading-relaxed">
                        Under the standard CredSecure deployment model, the application, database and customer credential data remain within the customer's designated infrastructure with no standing Innodhee access.
                    </p>
                    <p className="text-xs leading-relaxed">
                        This DPA applies where a specific customer engagement requires Innodhee Services Pvt. Ltd. to process personal data on behalf of the customer, such as certain authorized implementation, support or managed-service arrangements.
                    </p>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    1. Roles and Scope
                </h2>
                <p>
                    Where this DPA applies, Customer acts as Controller (or Processor for another Controller) and Innodhee acts as Processor only for the Personal Data and activities expressly covered by the applicable service arrangement.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    2. Customer-Controlled Environment
                </h2>
                <p>
                    Customer retains control of the CredSecure infrastructure, database, credentials, users, access rights, retention, backups and integrations. This DPA does not transfer control of the customer's CredSecure environment to Innodhee.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    3. Authorized Access &amp; Security
                </h2>
                <p>
                    Innodhee personnel access Customer systems or Personal Data only when expressly authorized for the agreed service purpose, subject to confidentiality obligations and least-privilege access controls.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    4. Incident Notification
                </h2>
                <p>
                    Innodhee will notify Customer without undue delay after becoming aware of a confirmed Personal Data Breach affecting Personal Data processed by Innodhee on Customer's behalf under an applicable DPA.
                </p>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    5. Contact &amp; Execution
                </h2>
                <p className="text-xs sm:text-sm">
                    To request a formal DPA execution schedule for a specialized enterprise engagement, please contact{" "}
                    <a href="mailto:customer-support@getcredsecure.com" className="text-blue-600 dark:text-blue-400 underline font-medium">
                        customer-support@getcredsecure.com
                    </a>.
                </p>
            </section>
        </LegalPageLayout>
    );
}
