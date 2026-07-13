import Link from "next/link";

interface MarketingFooterProps {
    applicationName: string;
    companyName: string;
}

export function MarketingFooter({ applicationName, companyName }: MarketingFooterProps) {
    return (
        <footer className="border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#020617]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                    {/* Brand */}
                    <div className="space-y-2 md:col-span-6">
                        <div className="flex items-center -mt-1.5">
                            <img
                                src="/full-logo.png"
                                alt="CredSecure By INNODHEE Logo"
                                className="h-16 object-contain dark:invert dark:brightness-125"
                            />
                        </div>
                        <p className="text-[13px] sm:text-[14px] text-slate-605 dark:text-slate-500 max-w-sm leading-relaxed">
                            Operational credential governance infrastructure for enterprises managing application credentials, service accounts, and integration ecosystems.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="md:col-span-6 grid grid-cols-2 gap-8 w-full md:justify-items-end">
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Product</h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/platform" className="text-xs text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors font-medium">
                                        Platform
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/features" className="text-xs text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors font-medium">
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/security" className="text-xs text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors font-medium">
                                        Security
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Solutions</h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/use-cases" className="text-xs text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors font-medium">
                                        Use Cases
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/request-demo" className="text-xs text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors font-medium">
                                        Request Demo
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
