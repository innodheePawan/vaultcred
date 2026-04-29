
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/actions/settings";
import { headers } from "next/headers";
import {
    Shield,
    Lock,
    Zap,
    History,
    Users,
    ShieldCheck,
    ShieldAlert,
    ArrowRight,
    KeyRound,
    CheckCircle2,
    Code,
    Terminal,
    ChevronRight,
} from "lucide-react";

export default async function LandingPage() {
    const session = await auth();
    const settings = await getSystemSettings();
    const headersList = await headers();
    const host = headersList.get('host') || 'vault.credsecure.io';

    return (
        <div className="relative min-h-screen bg-[#030712] text-slate-50 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-900/10 blur-[100px]" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#030712]/60 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative flex items-center justify-center p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-indigo-500/20">
                                <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white">
                                {settings.applicationName || "CredSecure"}
                            </span>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                                <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                                <Link href="#compliance" className="hover:text-white transition-colors">Compliance</Link>
                            </div>
                            {session?.user ? (
                                <Link href="/dashboard">
                                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-5 rounded-full transition-all duration-300 shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.6)]">
                                        Open Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        Sign In
                                    </Link>
                                    <Link href="/login">
                                        <Button className="bg-white hover:bg-slate-200 text-slate-900 font-bold px-6 py-5 rounded-full transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)]">
                                            Get Started <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 w-full overflow-x-hidden">
                {/* Hero Section */}
                <section className="pt-40 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold tracking-wide mb-8 animate-fade-in hover:bg-indigo-500/20 transition-colors cursor-default backdrop-blur-md">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Enterprise Grade Secret Management</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 text-balance leading-[1.05]">
                        Zero Trust. <br className="hidden sm:block" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">Infinite Scale.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-3xl text-balance leading-relaxed">
                        The ultimate vault for modern engineering teams. Secure, auditable, and automated credential orchestration. Built for uncompromising data integrity.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
                        <Link href="/login" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-14 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl group flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]">
                                Start Securing Free
                                <Zap className="w-5 h-5 fill-current group-hover:text-yellow-300 transition-colors duration-300" />
                            </Button>
                        </Link>
                        {/* <Button variant="outline" className="w-full sm:w-auto h-14 px-10 bg-slate-900/50 hover:bg-slate-800 text-white border-slate-700 font-bold rounded-2xl group flex items-center justify-center gap-3 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95">
                            <Code className="w-5 h-5" />
                            API Documentation
                        </Button> */}
                    </div>

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-slate-500 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> AES-256-GCM
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> SOC2 Compliant
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 99.99% SLA
                        </div>
                    </div>
                </section>

                {/* Dashboard Showcase Mockup */}
                <section className="relative px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-32 -mt-4 lg:-mt-8 w-full" style={{ perspective: "1200px" }}>
                    <div style={{ transform: 'rotateX(4deg) scale(0.98)' }} className="transform-gpu transition-all duration-1000 hover:rotateX-0 hover:scale-100 ease-out">
                        <div className="relative rounded-2xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] p-2 animate-float ring-1 ring-white/10 overflow-hidden">

                            {/* Mockup Header */}
                            <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/80 rounded-t-xl gap-4">
                                <div className="flex gap-2 min-w-fit">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/90 shadow-sm"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500/90 shadow-sm"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm"></div>
                                </div>
                                <div className="mx-auto flex items-center justify-center gap-2 bg-[#020617] px-6 py-1.5 rounded-full border border-slate-800 text-xs text-slate-400 font-mono shadow-inner w-full max-w-md">
                                    <Lock className="w-3 h-3 text-emerald-400" /> {host}
                                </div>
                                <div className="min-w-[48px] hidden sm:block"></div>
                            </div>

                            {/* Mockup Content Layout */}
                            <div className="flex flex-col sm:flex-row bg-[#020617] rounded-b-xl overflow-hidden shadow-inner">
                                {/* Sidebar */}
                                <div className="w-full sm:w-64 bg-slate-900/60 p-4 space-y-4 border-r border-slate-800 hidden sm:block">
                                    <div className="h-8 bg-slate-800/80 rounded-lg w-full mb-8 border border-white/5"></div>
                                    {[1, 2, 3, 4, 5].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-2 rounded-md hover:bg-white/5">
                                            <div className="w-5 h-5 bg-slate-700 rounded-sm"></div>
                                            <div className="h-2.5 bg-slate-600 rounded w-2/3"></div>
                                        </div>
                                    ))}
                                </div>
                                {/* Main Content */}
                                <div className="flex-1 p-4 sm:p-8 space-y-8 bg-gradient-to-br from-[#020617] to-slate-900/20">
                                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-6">
                                        <div className="space-y-2">
                                            <div className="h-6 bg-slate-200 rounded w-48 shadow-sm"></div>
                                            <div className="h-3 bg-slate-600 rounded w-32"></div>
                                        </div>
                                        <div className="h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-lg w-32 flex items-center justify-center">
                                            <div className="h-2.5 bg-indigo-400 rounded w-16"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[1, 2, 3].map((_, i) => (
                                            <div key={i} className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4 shadow-sm hover:border-slate-700 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                                                    <div className="w-3 h-3 rounded-sm bg-slate-600"></div>
                                                </div>
                                                <div className="h-3 bg-slate-500 rounded w-1/2"></div>
                                                <div className="h-6 bg-slate-300 rounded w-3/4"></div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 shadow-sm">
                                        {[1, 2, 3].map((_, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors group">
                                                <div className="flex items-center gap-4 w-1/2">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-center">
                                                        <div className="w-4 h-4 rounded-sm bg-slate-600"></div>
                                                    </div>
                                                    <div className="space-y-2 w-full">
                                                        <div className="h-3 bg-slate-300 rounded w-1/3 group-hover:bg-white transition-colors"></div>
                                                        <div className="h-2.5 bg-slate-600 rounded w-1/2"></div>
                                                    </div>
                                                </div>
                                                <div className="h-6 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400 px-3 py-1.5 flex items-center font-medium shadow-sm">Active</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Inner glow */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none"></div>
                        </div>
                        {/* Glow effect under the mockup */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[60%] h-16 bg-indigo-600/20 blur-[80px] -z-10 rounded-full"></div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 relative bg-slate-900/10 border-t border-slate-800/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Engineered for Paranoia
                            </h2>
                            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                                We designed {settings.applicationName || "CredSecure"} with a "zero trust" architecture. Every action, every secret, and every user is verified, encrypted, and logged.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Feature Cards */}
                            {[
                                { title: "AES-256-GCM Encryption", desc: "Military-grade encryption applied client-side before touching our infrastructure.", icon: Lock, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", border: "hover:border-blue-500/50", glow: "hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]" },
                                { title: "Identity & RBAC", desc: "Granular access controls mapped seamlessly to Environments and Categories.", icon: Users, color: "text-indigo-400", bg: "bg-indigo-400/10 border-indigo-400/20", border: "hover:border-indigo-500/50", glow: "hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)]" },
                                { title: "Immutable Audit Trails", desc: "Cryptographically verifiable logs for every interaction, making compliance effortless.", icon: History, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", border: "hover:border-emerald-500/50", glow: "hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]" },
                                { title: "Threat Protection", desc: "Built-in rate limiting, anomalous login detection, and automatic IP blacklisting.", icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-400/10 border-rose-400/20", border: "hover:border-rose-500/50", glow: "hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]" },
                                { title: "Hardware Key 2FA", desc: "Enforce WebAuthn or TOTP requirements for highly sensitive vault access.", icon: KeyRound, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", border: "hover:border-amber-500/50", glow: "hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]" },
                                { title: "API Integrations", desc: "Developer-first API with scope-enforced tokens and global kill-switches.", icon: Terminal, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", border: "hover:border-purple-500/50", glow: "hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]" },
                            ].map((feature, idx) => (
                                <div key={idx} className={`group p-8 rounded-3xl bg-slate-900/40 border border-slate-800 transition-all duration-300 cursor-default ${feature.border} ${feature.glow}`}>
                                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 transition-colors ${feature.bg}`}>
                                        <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-white transition-colors">{feature.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Metrics/Scale Section */}
                <section id="compliance" className="py-20 border-y border-slate-800/50 bg-[#020617]/50 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
                            {/* <div className="pt-6 sm:pt-0">
                                <div className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-sm">99.99%</div>
                                <div className="text-slate-400 font-medium text-sm uppercase tracking-wider">Uptime SLA</div>
                            </div> */}
                            <div className="pt-6 sm:pt-0">
                                <div className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-sm">10M+</div>
                                <div className="text-slate-400 font-medium text-sm uppercase tracking-wider">Secrets Encrypted</div>
                            </div>
                            <div className="pt-6 sm:pt-0">
                                <div className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-sm">&lt; 50ms</div>
                                <div className="text-slate-400 font-medium text-sm uppercase tracking-wider">API Response Time</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-950/10"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8 text-white">Ready to lock down your infrastructure?</h2>
                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto text-balance">Join forward-thinking teams that prioritize security without sacrificing velocity.</p>
                        <Link href="/login">
                            <Button className="h-16 px-12 text-lg bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.5)]">
                                Initialize Free Sandbox
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 bg-[#020617] border-t border-slate-900 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                            <Shield className="w-6 h-6 text-indigo-500" />
                            <span className="text-xl font-bold tracking-tight text-white">
                                {settings.applicationName || "CredSecure"}
                            </span>
                        </div>

                        <p className="text-sm text-slate-500 text-center">
                            &copy; {new Date().getFullYear()} {settings.companyName || "Innodhee Services Pvt Ltd"}. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

