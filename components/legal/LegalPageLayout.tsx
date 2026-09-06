import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Calendar, Building2, Mail, ExternalLink, Globe } from 'lucide-react';
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { FloatingCredentialWidget } from '@/components/shared/FloatingCredentialWidget';

interface LegalPageLayoutProps {
    title: string;
    description: string;
    lastUpdated?: string;
    category?: string;
    applicationName: string;
    companyName: string;
    isLoggedIn: boolean;
    children: React.ReactNode;
}

export function LegalPageLayout({
    title,
    description,
    lastUpdated = "September 2026",
    category = "Trust & Governance",
    applicationName,
    companyName,
    isLoggedIn,
    children,
}: LegalPageLayoutProps) {
    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-400">
            <MarketingNavbar applicationName={applicationName} isLoggedIn={isLoggedIn} />

            <main className="relative z-10 pt-20 pb-20">
                {/* Header Banner */}
                <section className="relative border-b border-slate-200 dark:border-white/[0.06] bg-slate-100/60 dark:bg-white/[0.015] py-12 md:py-16">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to Home
                                </Link>
                                <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    <Shield className="w-3 h-3" />
                                    {category}
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                                {title}
                            </h1>

                            <p className="text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                                {description}
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                <span className="inline-flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                    Last Updated: {lastUpdated}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                                    Official Domain: getcredsecure.com
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content Area */}
                <section className="pt-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Legal Body */}
                        <div className="lg:col-span-8 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {children}
                        </div>

                        {/* Sidebar Information Card */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="sticky top-28 space-y-6">
                                <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#090d16] shadow-xs space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                        Legal Entity Details
                                    </h3>
                                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="flex items-start gap-2.5">
                                            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-slate-900 dark:text-slate-200 block">
                                                    Innodhee Services Pvt. Ltd.
                                                </span>
                                                <p className="mt-1 text-slate-500 leading-normal">
                                                    RI Elegance, Parappana Agrahara Main Rd,<br />
                                                    Sai Sree Layout, Parappana Agrahara,<br />
                                                    Bengaluru, Karnataka 560100, India
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-start gap-2.5">
                                            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-semibold text-slate-900 dark:text-slate-200 block">
                                                    Contact Email
                                                </span>
                                                <a
                                                    href="mailto:customer-support@getcredsecure.com"
                                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all"
                                                >
                                                    customer-support@getcredsecure.com
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                    <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        Deployment Model Notice
                                    </h4>
                                    <p className="leading-relaxed">
                                        Under the standard CredSecure deployment model, the application, database and customer credential data are deployed within the customer's designated infrastructure or landscape and are not centrally hosted by Innodhee.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <MarketingFooter applicationName={applicationName} companyName={companyName} />
            <FloatingCredentialWidget />
        </div>
    );
}
