'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from "lucide-react";

interface MarketingNavbarProps {
    applicationName: string;
    isLoggedIn: boolean;
}

const NAV_LINKS = [
    { label: "Platform", href: "/platform" },
    { label: "Security", href: "/security" },
    { label: "Use Cases", href: "/use-cases" },
    { label: "Features", href: "/features" },
];

export function MarketingNavbar({ applicationName, isLoggedIn }: MarketingNavbarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-8 h-8 rounded-lg border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 tracking-tight">
                                CS
                            </div>
                            <span className="text-[15px] font-semibold tracking-tight text-white">
                                {applicationName || "CredSecure"}
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1">
                            {NAV_LINKS.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                                            isActive
                                                ? "text-white bg-white/[0.06]"
                                                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Desktop CTA */}
                        <div className="hidden md:flex items-center gap-3">
                            {isLoggedIn ? (
                                <Link href="/dashboard">
                                    <Button className="h-9 px-4 bg-white hover:bg-slate-100 text-slate-900 text-[13px] font-semibold rounded-lg transition-colors">
                                        Open Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">
                                        Sign In
                                    </Link>
                                    <Link href="/request-demo">
                                        <Button className="h-9 px-4 bg-white hover:bg-slate-100 text-slate-900 text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-1.5">
                                            Request Demo
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-[#030712]/95 backdrop-blur-xl pt-16 md:hidden">
                    <div className="flex flex-col px-6 py-8 gap-1">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                                        isActive
                                            ? "text-white bg-white/[0.06]"
                                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                        <div className="border-t border-white/[0.06] mt-4 pt-4 flex flex-col gap-3">
                            {isLoggedIn ? (
                                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                                    <Button className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg">
                                        Open Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                                        <Button variant="outline" className="w-full h-11 bg-transparent border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/[0.04]">
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Link href="/request-demo" onClick={() => setMobileOpen(false)}>
                                        <Button className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5">
                                            Request Demo
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
