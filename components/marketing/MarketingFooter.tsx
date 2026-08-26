import Link from "next/link";
import { Mail, Phone, Linkedin, ExternalLink } from "lucide-react";

interface MarketingFooterProps {
    applicationName: string;
    companyName: string;
}

export function MarketingFooter({ applicationName, companyName }: MarketingFooterProps) {
    return (
        <footer className="border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#020617]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="space-y-4 lg:col-span-4">
                        <div className="flex items-center">
                            {/* <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs inline-flex"> */}
                            <img
                                src="/full-logo.png"
                                alt="CredSecure By INNODHEE Logo"
                                className="h-[58px] sm:h-[68px] object-contain"
                            />
                            {/* </div> */}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed font-normal">
                            Operational credential governance infrastructure for enterprises managing application credentials, service accounts, and integration ecosystems.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div className="space-y-3 lg:col-span-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Product
                        </h4>
                        <ul className="space-y-2.5">
                            <li>
                                <Link
                                    href="/platform"
                                    className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                >
                                    Platform
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/features"
                                    className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                >
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/security"
                                    className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                >
                                    Security
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Solutions Links */}
                    <div className="space-y-3 lg:col-span-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Solutions
                        </h4>
                        <ul className="space-y-2.5">
                            <li>
                                <Link
                                    href="/use-cases"
                                    className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                >
                                    Use Cases
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/request-demo"
                                    className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                >
                                    Request Demo
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Us Column */}
                    <div className="space-y-3 lg:col-span-4">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Contact Us
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2.5">
                                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Email</span>
                                    <a
                                        href="mailto:customer-support@innodhee.com"
                                        className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium break-all"
                                    >
                                        customer-support@innodhee.com
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Phone</span>
                                    <a
                                        href="tel:+917406663433"
                                        className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                                    >
                                        +91-7406663433
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <Linkedin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">LinkedIn</span>
                                    <a
                                        href="https://www.linkedin.com/company/innodhee-services/?viewAsMember=true"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium inline-flex items-center gap-1"
                                    >
                                        Innodhee Services
                                        {/* <ExternalLink className="w-3 h-3 text-slate-400" /> */}
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                        &copy; {new Date().getFullYear()} {companyName || "Innodhee Services Pvt Ltd"}. All rights reserved.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                        Credential Governance &middot; Access Traceability &middot; Operational Security
                    </p>
                </div>
            </div>
        </footer>
    );
}

