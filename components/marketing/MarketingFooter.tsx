import Link from "next/link";

interface MarketingFooterProps {
    applicationName: string;
    companyName: string;
}

const FOOTER_LINKS = [
    { label: "Platform", href: "/platform" },
    { label: "Security", href: "/security" },
    { label: "Use Cases", href: "/use-cases" },
    { label: "Features", href: "/features" },
    { label: "Request Demo", href: "/request-demo" },
];

export function MarketingFooter({ applicationName, companyName }: MarketingFooterProps) {
    return (
        <footer className="border-t border-white/[0.06] bg-[#020617]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    {/* Brand */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400 tracking-tight">
                                CS
                            </div>
                            <span className="text-sm font-semibold text-white tracking-tight">
                                {applicationName || "CredSecure"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                            Operational credential governance infrastructure for enterprises managing application credentials, service accounts, and integration ecosystems.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap gap-x-8 gap-y-2">
                        {FOOTER_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-[11px] text-slate-600">
                        &copy; {new Date().getFullYear()} {companyName || "Innodhee Services Pvt Ltd"}. All rights reserved.
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                        Credential Governance &middot; Access Traceability &middot; Operational Security
                    </p>
                </div>
            </div>
        </footer>
    );
}
