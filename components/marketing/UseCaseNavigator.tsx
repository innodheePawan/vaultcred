'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Server, KeyRound, Globe, FileCode, Layers, ChevronLeft, ChevronRight } from "lucide-react";

interface UseCaseItem {
    id: string;
    icon: React.ElementType;
    title: string;
    tagline: string;
    description: string;
    accentColor: string;
    hoverBorderColor: string;
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
    },
    {
        id: "production-access",
        icon: KeyRound,
        title: "Production Access",
        tagline: "Give access without giving away control.",
        description: "Provide controlled, time-bound access to production credentials while maintaining accountability and complete audit traceability.",
        accentColor: "text-indigo-500 dark:text-indigo-400",
        hoverBorderColor: "hover:border-indigo-500/50 dark:hover:border-indigo-500/40",
    },
    {
        id: "external-vendor-access",
        icon: Globe,
        title: "External Vendor Access",
        tagline: "Secure third-party credential access.",
        description: "Allow vendors and partners to access only the credentials they need, within defined scope and access periods.",
        accentColor: "text-violet-500 dark:text-violet-400",
        hoverBorderColor: "hover:border-violet-500/50 dark:hover:border-violet-500/40",
    },
    {
        id: "application-credential-provisioning",
        icon: FileCode,
        title: "Application Credential Provisioning",
        tagline: "Deploy applications without manually distributing .env or credential files.",
        description: "Applications retrieve their authorized .env or credential configuration directly from CredSecure during setup or startup, reducing manual credential distribution and exposure.",
        accentColor: "text-emerald-500 dark:text-emerald-400",
        hoverBorderColor: "hover:border-emerald-500/50 dark:hover:border-emerald-500/40",
    },
    {
        id: "btp-security-material-provisioning",
        icon: Layers,
        title: "BTP Security Material Provisioning",
        tagline: "From vendor onboarding to BTP — without internal credential handling.",
        description: "Allow third parties to securely create authorized credentials in CredSecure and automatically provision supported security material to configured BTP Integration Suite targets.",
        accentColor: "text-amber-500 dark:text-amber-400",
        hoverBorderColor: "hover:border-amber-500/50 dark:hover:border-amber-500/40",
    },
];

export function UseCaseNavigator() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Quadruple list for 100% infinite seamless continuous drift
    const displayUseCases = [...navUseCases, ...navUseCases, ...navUseCases, ...navUseCases];

    const triggerTemporaryPause = useCallback((durationMs: number = 5000) => {
        setIsPaused(true);
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = setTimeout(() => setIsPaused(false), durationMs);
    }, []);

    const scrollToSection = (id: string) => {
        triggerTemporaryPause(5000);
        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Continuous pixel-accumulated auto-drift (Guarantees DOM integer scroll steps)
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        let animId: number;
        let accumulatedPx = 0;

        const animate = () => {
            if (!isPaused && scrollContainerRef.current) {
                // Accumulate ~25px per second (0.45px per 60fps frame)
                accumulatedPx += 0.45;
                if (accumulatedPx >= 1) {
                    const step = Math.floor(accumulatedPx);
                    accumulatedPx -= step;

                    const el = scrollContainerRef.current;
                    el.scrollLeft += step;

                    const setWidth = el.scrollWidth / 4;
                    if (el.scrollLeft >= setWidth * 2) {
                        el.scrollLeft -= setWidth;
                    }
                }
            }
            animId = requestAnimationFrame(animate);
        };

        animId = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(animId);
            if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        };
    }, [isPaused]);

    const handlePrev = () => {
        triggerTemporaryPause(5000);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -336, behavior: 'smooth' });
        }
    };

    const handleNext = () => {
        triggerTemporaryPause(5000);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 336, behavior: 'smooth' });
        }
    };

    return (
        <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quick Discovery Navigator
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                    Explore Solutions by Use Case
                </h2>
            </div>

            {/* Cards Track Container with Side Gutters for Arrow Buttons */}
            <div className="relative px-12 sm:px-14">
                {/* Previous Arrow Button (Positioned in left gutter, never overlapping text) */}
                <button
                    onClick={handlePrev}
                    aria-label="Previous use cases"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-slate-200 dark:border-white/[0.15] bg-white dark:bg-slate-900 shadow-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-none py-2 px-1 w-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {displayUseCases.map((uc, index) => {
                        const isDuplicate = index >= navUseCases.length;
                        const Icon = uc.icon;
                        return (
                            <button
                                key={`${uc.id}-${index}`}
                                onClick={() => scrollToSection(uc.id)}
                                onMouseEnter={() => setIsPaused(true)}
                                onMouseLeave={() => setIsPaused(false)}
                                aria-hidden={isDuplicate ? true : undefined}
                                tabIndex={isDuplicate ? -1 : 0}
                                className={`group/card relative text-left p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] ${uc.hoverBorderColor} hover:shadow-lg dark:hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between shrink-0 w-[280px] sm:w-[320px] h-[240px] overflow-hidden cursor-pointer`}
                            >
                                {/* Top subtle hover accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover/card:via-indigo-500/80 transition-all duration-300" />

                                <div className="space-y-2">
                                    {/* Icon */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className={`p-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] group-hover/card:bg-slate-200/60 dark:group-hover/card:bg-white/[0.08] transition-colors ${uc.accentColor}`}>
                                            <Icon className="w-5 h-5" strokeWidth={1.75} />
                                        </div>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-300 transition-colors line-clamp-1">
                                        {uc.title}
                                    </h3>

                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug line-clamp-1">
                                        {uc.tagline}
                                    </p>

                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                                        {uc.description}
                                    </p>
                                </div>

                                {/* Explore Action (Center Aligned, No Arrow) */}
                                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover/card:text-indigo-500 transition-colors shrink-0">
                                    Explore Use Case
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Next Arrow Button (Positioned in right gutter, never overlapping text) */}
                <button
                    onClick={handleNext}
                    aria-label="Next use cases"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-slate-200 dark:border-white/[0.15] bg-white dark:bg-slate-900 shadow-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </section>
    );
}
