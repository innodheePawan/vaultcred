
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
    Shield,
    Lock,
    Zap,
    History,
    Users,
    Globe,
    Fingerprint,
    ShieldCheck,
    ShieldAlert,
    MousePointer2,
    Database
} from "lucide-react";

export default async function LandingPage() {
    const session = await auth();

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 selection:bg-indigo-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <div className="p-1.5 bg-indigo-600 rounded-lg group-hover:rotate-12 transition-transform duration-300">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-600 to-gray-900 dark:from-white dark:via-indigo-400 dark:to-white">
                                CredSecure
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {session?.user ? (
                                <Link href="/dashboard">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 rounded-full transition-all duration-300 active:scale-95 shadow-lg shadow-indigo-500/25">
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/login">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 rounded-full transition-all duration-300 active:scale-95 shadow-lg shadow-indigo-500/25">
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Enterprise-Grade Digital Fortress
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                            The Future of <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600 animate-gradient-x">Credential Orchestration</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                            Secure, auditable, and intelligent credential management engineered for organizations that prioritize non-negotiable data integrity.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/login">
                                <Button className="h-14 px-10 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-all font-bold rounded-2xl group flex items-center gap-3 active:scale-95">
                                    Initialize Secure Session
                                    <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500" /> AES-256-GCM</span>
                                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /> Granular RBAC</span>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Preview Mockup */}
                    <div className="mt-20 relative px-4 sm:px-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white dark:via-black/5 dark:to-[#0a0a0a] z-10"></div>
                        <div className="rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl shadow-indigo-500/20 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm p-4 animate-float">
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <div className="ml-4 h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-3 space-y-3">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>)}
                                </div>
                                <div className="col-span-9 space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl"></div>)}
                                    </div>
                                    <div className="h-64 bg-gray-100 dark:bg-gray-800/30 rounded-2xl w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16">
                        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
                            Hardened by Design
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Multiple layers of protection for every interaction.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 hover:border-indigo-500/50 transition-all duration-500">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors">
                                <Lock className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">AES-256-GCM Encryption</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Industry-standard authenticated encryption for every secret. Your data is encrypted at the source before ever touching the database.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 hover:border-blue-500/50 transition-all duration-500">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                                <Fingerprint className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Mandatory 2FA</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Zero-exception MFA enforcement. Protect every account with TOTP protection and encrypted secondary secrets.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 hover:border-orange-500/50 transition-all duration-500">
                            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Tiered Rate Limiting</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Persistent IP blocking and account lockout logic that stops brute-force and password spraying in its tracks.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 hover:border-emerald-500/50 transition-all duration-500">
                            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                                <History className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Immutable Audit Trail</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Every view, edit, and system change is serialized and logged. Absolute accountability for every organizational asset.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 hover:border-violet-500/50 transition-all duration-500">
                            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-500 transition-colors">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Access Orchestration</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Dynamic RBAC mapped to Categories and Environments. Grant the right access to the right people, every time.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 hover:border-pink-500/50 transition-all duration-500">
                            <div className="w-12 h-12 bg-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-500 transition-colors">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Cold Storage Archival</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Intelligent data lifecycle management. Millions of security events archived automatically with Batch ID integrity.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Banner */}
            <section className="py-12 border-y border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-2 font-bold text-lg"><Shield className="w-5 h-5" /> SOC 2 READY</div>
                    <div className="flex items-center gap-2 font-bold text-lg"><Fingerprint className="w-5 h-5" /> FIPS 140-2</div>
                    <div className="flex items-center gap-2 font-bold text-lg"><ShieldCheck className="w-5 h-5" /> NIST COMPLIANT</div>
                    <div className="flex items-center gap-2 font-bold text-lg"><Globe className="w-5 h-5" /> GDPR READY</div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-white dark:bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-600" />
                            <span className="text-lg font-bold tracking-tight">CredSecure</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} Innodhee Services Pvt Ltd. Developed with &hearts; for Enterprise Security.
                        </p>
                        <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                            <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
                            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
