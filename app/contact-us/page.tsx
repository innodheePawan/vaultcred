import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ContactUsForm } from "./ContactUsForm";
import { FloatingCredentialWidget } from "@/components/shared/FloatingCredentialWidget";
import { QuickActionsFloatingWidget } from "@/components/marketing/QuickActionsFloatingWidget";
import { Mail, Phone, Linkedin, ExternalLink, ShieldCheck, Clock, MessageSquare, Building2 } from "lucide-react";

export const metadata = {
    title: "Contact Us | CredSecure",
    description: "Get in touch with the CredSecure team at Innodhee Services. Contact customer support, schedule enterprise consultations, or inquire about credential governance solution deployments.",
};

export default async function ContactUsPage() {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 font-sans">
            <MarketingNavbar
                applicationName={settings.applicationName || "CredSecure"}
                isLoggedIn={!!session?.user}
            />

            <main className="relative z-10 pt-16">
                <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                        {/* Left Column: Contact Details & Copy */}
                        <div className="space-y-6 pt-2">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-4">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Customer Support & Sales
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Get in Touch with Our Team
                                </h1>
                                <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Have questions regarding CredSecure platform capabilities, pricing, enterprise deployment, or technical support? We are ready to assist you.
                                </p>
                            </div>

                            {/* Direct Contact Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-xs space-y-1.5">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Email Us</span>
                                    </div>
                                    <a
                                        href="mailto:customer-support@innodhee.com"
                                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block break-all"
                                    >
                                        customer-support@innodhee.com
                                    </a>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Response within 2 business hours</p>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-xs space-y-1.5">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <Phone className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Call Us</span>
                                    </div>
                                    <a
                                        href="tel:+917406663433"
                                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                                    >
                                        +91-7406663433
                                    </a>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Mon &ndash; Fri, 9 AM &ndash; 7 PM IST</p>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-xs space-y-1.5">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <Linkedin className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">LinkedIn</span>
                                    </div>
                                    <a
                                        href="https://www.linkedin.com/company/innodhee-services/?viewAsMember=true"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                                    >
                                        Innodhee Services
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </a>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Official LinkedIn Page</p>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] shadow-xs space-y-1.5">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <Building2 className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Company</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                                        Innodhee Services Pvt Ltd
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Enterprise Security Solutions</p>
                                </div>
                            </div>

                            {/* Service Highlights */}
                            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                                {[
                                    "Dedicated technical architecture & solution guidance",
                                    "Enterprise deployment on-premise & hybrid support",
                                    "SAP Basis, API Security & Credential Governance audit readiness",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Contact Us Form */}
                        <div>
                            <ContactUsForm />
                        </div>
                    </div>
                </section>

                {/* Highlights Section */}
                <section className="border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01] py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-6 text-center">
                            Our Support Commitments
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    title: "Rapid Response Guarantee",
                                    desc: "All inquiries receive a qualified response from our technical team within 2 business hours."
                                },
                                {
                                    title: "Security Consultation",
                                    desc: "Get expert advice on structuring zero-trust credential rotation and access traceability."
                                },
                                {
                                    title: "Full Confidentiality",
                                    desc: "Your organization details and infrastructure requirements remain completely confidential under strict NDA standards."
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="p-5 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <MarketingFooter
                applicationName={settings.applicationName || "CredSecure"}
                companyName={settings.companyName || "Innodhee Services Pvt Ltd"}
            />

            {/* Quick Actions Floating Right Button */}
            <QuickActionsFloatingWidget />

            {/* Floating Credential Utility */}
            <FloatingCredentialWidget />
        </div>
    );
}
