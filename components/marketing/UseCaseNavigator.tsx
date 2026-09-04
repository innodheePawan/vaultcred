'use client';

import { Server, KeyRound, Globe, FileCode, ArrowRight } from "lucide-react";

interface UseCaseItem {
    id: string;
    icon: React.ElementType;
    title: string;
    tagline: string;
    description: string;
    accentColor: string;
    hoverBorderColor: string;
    badgeColor: string;
}

const navUseCases: UseCaseItem[] = [
    {
        id: "sap-credential-governance",
        icon: Server,
        title: "SAP Credential Governance",
        tagline: "Control credentials across your SAP landscape.",
        description: "Centralize and govern integration credentials, service accounts, API keys and system connections across SAP environments.",
        accentColor: "text-blue-500 dark:text-blue-400",
        hoverBorderColor: "hover:border-blue-500/50 dark:hover:border-blue-500/40",
        badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
        id: "production-access",
        icon: KeyRound,
        title: "Production Access",
        tagline: "Give access without giving away control.",
        description: "Provide controlled, time-bound access to production credentials while maintaining accountability and complete audit traceability.",
        accentColor: "text-indigo-500 dark:text-indigo-400",
        hoverBorderColor: "hover:border-indigo-500/50 dark:hover:border-indigo-500/40",
        badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
        id: "external-vendor-access",
        icon: Globe,
        title: "External Vendor Access",
        tagline: "Secure third-party credential access.",
        description: "Allow vendors and partners to access only the credentials they need, within defined scope and access periods.",
        accentColor: "text-violet-500 dark:text-violet-400",
        hoverBorderColor: "hover:border-violet-500/50 dark:hover:border-violet-500/40",
        badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
        id: "application-credential-provisioning",
        icon: FileCode,
        title: "Application Credential Provisioning",
        tagline: "Deploy applications without manually distributing .env or credential files.",
        description: "Applications retrieve their authorized .env or credential configuration directly from CredSecure during setup or startup, reducing manual credential distribution and exposure.",
        accentColor: "text-emerald-500 dark:text-emerald-400",
        hoverBorderColor: "hover:border-emerald-500/50 dark:hover:border-emerald-500/40",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
];

export function UseCaseNavigator() {
    const scrollToSection = (id: string) => {
        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Quick Discovery</span>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                        Explore Solutions by Use Case
                    </h2>
                </div>
                <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                    Click any card to jump to detailed workflow ↓
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {navUseCases.map((uc) => {
                    const Icon = uc.icon;
                    return (
                        <button
                            key={uc.id}
                            onClick={() => scrollToSection(uc.id)}
                            className={`group relative text-left p-5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] ${uc.hoverBorderColor} hover:shadow-lg dark:hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between h-full min-h-[220px] overflow-hidden cursor-pointer`}
                        >
                            {/* Top decorative gradient line on hover */}
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/80 transition-all duration-300" />

                            <div>
                                {/* Icon & Title */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className={`p-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] group-hover:bg-slate-200/60 dark:group-hover:bg-white/[0.08] transition-colors ${uc.accentColor}`}>
                                        <Icon className="w-5 h-5" strokeWidth={1.75} />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                        Interactive
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                    {uc.title}
                                </h3>

                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 leading-snug">
                                    {uc.tagline}
                                </p>

                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                    {uc.description}
                                </p>
                            </div>

                            {/* Explore CTA link within card */}
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                <span>Explore Use Case</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
