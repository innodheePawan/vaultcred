import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
    title: "Responsible Disclosure Policy",
    description: "Guidelines for reporting potential security vulnerabilities in CredSecure.",
    path: "/responsible-disclosure",
});

export default async function ResponsibleDisclosurePage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <LegalPageLayout
            title="Security & Responsible Disclosure Policy"
            description="Guidelines and safe-harbor principles for reporting potential security vulnerabilities in CredSecure responsibly."
            lastUpdated="September 2026"
            category="Security & Disclosure"
            applicationName={settings.applicationName || "CredSecure"}
            companyName={settings.companyName || "Innodhee Services Pvt. Ltd."}
            isLoggedIn={!!session?.user}
        >
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    1. Reporting Security Vulnerabilities
                </h2>
                <p>
                    If you believe you have discovered a potential security vulnerability in the CredSecure public website (<code>getcredsecure.com</code>), please report it to us privately:
                </p>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs font-mono space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">Security Contact Email: <a href="mailto:customer-support@getcredsecure.com" className="text-blue-600 dark:text-blue-400 underline whitespace-nowrap">customer-support@getcredsecure.com</a></p>
                    <p className="text-slate-500 dark:text-slate-400">Subject Line: Security Vulnerability Report — CredSecure</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Please do not send live credentials, production tokens, private keys, or unnecessary personal information in your initial report.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    2. Good-Faith Research Rules
                </h2>
                <p>Researchers participating in vulnerability discovery must:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li>Test only systems you are authorized to test;</li>
                    <li>Minimise impact and avoid data destruction or service disruption;</li>
                    <li>Stop testing immediately if customer credentials or sensitive data are unexpectedly exposed;</li>
                    <li>Do not disrupt services, introduce persistence, extort, phish or pivot to unrelated systems; and</li>
                    <li>Allow reasonable time for investigation before any public disclosure.</li>
                </ul>
            </section>

            {/* Prominent Exclusion Alert */}
            <section className="space-y-4">
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        3. Customer Environments Are Not Public Test Targets
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">
                        CredSecure is deployed in customer-controlled infrastructure. <strong>This policy does not grant permission to test any customer CredSecure deployment, network, database, or integrated system.</strong>
                    </p>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                        Testing a customer environment requires explicit, separate written authorization from that specific customer organization. Unauthorized testing of customer infrastructure constitutes illegal activity.
                    </p>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    4. Encouraged Issues
                </h2>
                <p>We encourage responsible reports regarding:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li>Authentication or authorization bypass;</li>
                    <li>Privilege escalation;</li>
                    <li>Unauthorized credential or secret exposure in public endpoints;</li>
                    <li>Material API authorization weaknesses;</li>
                    <li>Reproducible security vulnerabilities materially affecting confidentiality, integrity or availability.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    5. Safe Harbor Intent
                </h2>
                <p>
                    Innodhee supports good-faith security research conducted lawfully and in accordance with this policy. Where a researcher makes a genuine effort to comply with this policy, avoids harm, promptly reports the issue, and does not misuse information obtained during testing, Innodhee intends to treat the activity as responsible security research rather than malicious activity.
                </p>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    6. Contact
                </h2>
                <p className="text-xs sm:text-sm">
                    Contact Email:{" "}
                    <a href="mailto:customer-support@getcredsecure.com" className="text-blue-600 dark:text-blue-400 underline font-medium whitespace-nowrap">
                        customer-support@getcredsecure.com
                    </a>  
                    <br />
                    Innodhee Services Pvt. Ltd., Bengaluru, Karnataka, India
                </p>
            </section>
        </LegalPageLayout>
    );
}
