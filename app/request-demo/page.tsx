import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { RequestDemoForm } from "./RequestDemoForm";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";

export const metadata = {
    title: "Request Demo | CredSecure",
    description: "Schedule a demo of the CredSecure operational credential governance platform. See how enterprise teams govern credentials, trace access, and enforce operational security.",
};

export default async function RequestDemoPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <div className="relative min-h-screen bg-[#030712] text-slate-50 font-sans">
            <MarketingNavbar
                applicationName={settings.applicationName || "CredSecure"}
                isLoggedIn={!!session?.user}
            />

            <main className="relative z-10 pt-16">
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        {/* Left: Copy */}
                        <div className="space-y-6 pt-4">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                                See Credential Governance in Action
                            </h1>
                            <p className="text-base text-slate-400 leading-relaxed">
                                Discover how enterprise teams use CredSecure to govern operational credentials, enforce time-bound access, and maintain complete audit traceability.
                            </p>

                            <div className="space-y-4 pt-4">
                                {[
                                    "Guided walkthrough of governance workflows",
                                    "Architecture overview for your environment",
                                    "SAP, API, and vendor access use case mapping",
                                    "Deployment and integration planning",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 mt-2 shrink-0" />
                                        <span className="text-sm text-slate-400">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/[0.06]">
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Typically scheduled within 2 business days. Tailored to your operational environment and governance requirements.
                                </p>
                            </div>
                        </div>

                        {/* Right: Form */}
                        <RequestDemoForm />
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
