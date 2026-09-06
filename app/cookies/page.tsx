import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Cookie & Website Technology Policy",
    description: "Clear information about the browser storage technologies and cookies used by the CredSecure public website.",
    path: "/cookies",
});

export default async function CookiePolicyPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <LegalPageLayout
            title="Cookie & Website Technology Policy"
            description="Clear information about the browser storage technologies and cookies used by the CredSecure public website at getcredsecure.com."
            lastUpdated="September 2026"
            category="Trust & Transparency"
            applicationName={settings.applicationName || "CredSecure"}
            companyName={settings.companyName || "Innodhee Services Pvt. Ltd."}
            isLoggedIn={!!session?.user}
        >
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    1. What Are Cookies and Browser Technologies?
                </h2>
                <p>
                    Cookies and browser storage technologies are small pieces of data stored on or accessed from your device that support website navigation, security enforcement, and display preferences.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    2. Current CredSecure Website Position
                </h2>
                <p>
                    The CredSecure public website currently does <strong>not</strong> use third-party analytics, advertising cookies, behavioral profiling, or cross-site tracking scripts.
                </p>
                <p>
                    Website security features, such as our Math CAPTCHA validation challenge, operate dynamically in the browser as interactive security controls and are not cookies.
                </p>
                <p>
                    Authentication and session cookies relate strictly to authenticated CredSecure functionality and are not used for advertising or behavioral tracking.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    3. Categories of Technologies
                </h2>
                <div className="overflow-x-auto border border-slate-200 dark:border-white/[0.06] rounded-xl">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-100 dark:bg-white/[0.03] text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/[0.06] font-semibold">
                            <tr>
                                <th className="p-3">Category</th>
                                <th className="p-3">Purpose</th>
                                <th className="p-3">Current Position</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                            <tr>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">Strictly Necessary</td>
                                <td className="p-3">Session management, authentication tokens, security enforcement</td>
                                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">Used where required for authenticated sessions</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">Preferences</td>
                                <td className="p-3">Remember user-selected interface settings</td>
                                <td className="p-3 text-blue-600 dark:text-blue-400 font-medium">Used in local browser storage where applicable</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">Analytics</td>
                                <td className="p-3">Measure visitor behavior and site performance</td>
                                <td className="p-3 text-slate-500 font-medium">Not currently used</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">Advertising / Marketing</td>
                                <td className="p-3">Profiling, behavioral targeting, or cross-site tracking</td>
                                <td className="p-3 text-slate-500 font-medium">Not currently used</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    4. Hosting Infrastructure
                </h2>
                <p>
                    The public website is hosted using AWS infrastructure in the Asia Pacific (India) region. Hosting infrastructure processes transient technical headers necessary to deliver and protect the site.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    5. Managing Browser Storage
                </h2>
                <p>
                    Most web browsers allow you to view, restrict, or delete cookies and local storage items via browser settings. Blocking strictly necessary session cookies may affect website functionality when logging into an instance.
                </p>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    6. Contact
                </h2>
                <p>
                    Questions regarding website technologies may be sent to{" "}
                    <a href="mailto:customer-support@getcredsecure.com" className="text-blue-600 dark:text-blue-400 underline font-medium whitespace-nowrap">
                        customer-support@getcredsecure.com
                    </a>.
                </p>
            </section>
        </LegalPageLayout>
    );
}
