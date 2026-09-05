"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    LockKeyhole,
    Fingerprint,
    ShieldCheck,
    Server,
    FileCheck,
    Globe,
    Database,
    Key,
    Award,
    Palette,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
} from "lucide-react";

interface FeatureItem {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    accentColor: string;
    hoverBorderColor: string;
}

const navFeatures: FeatureItem[] = [
    {
        id: "credential-vault",
        icon: LockKeyhole,
        title: "Credential Vault",
        description: "Securely store and manage enterprise credentials.",
        accentColor: "text-blue-500 dark:text-blue-400",
        hoverBorderColor: "hover:border-blue-500/50 dark:hover:border-blue-500/40",
    },
    {
        id: "identity-access-management",
        icon: Fingerprint,
        title: "Identity & Access Management",
        description: "Control who can access what using roles, scopes and permissions.",
        accentColor: "text-indigo-500 dark:text-indigo-400",
        hoverBorderColor: "hover:border-indigo-500/50 dark:hover:border-indigo-500/40",
    },
    {
        id: "authentication-security",
        icon: ShieldCheck,
        title: "Authentication & Security",
        description: "Protect access with MFA, session controls and security policies.",
        accentColor: "text-purple-500 dark:text-purple-400",
        hoverBorderColor: "hover:border-purple-500/50 dark:hover:border-purple-500/40",
    },
    {
        id: "api-gateway",
        icon: Server,
        title: "API Gateway",
        description: "Provide governed programmatic access to authorized credentials.",
        accentColor: "text-cyan-500 dark:text-cyan-400",
        hoverBorderColor: "hover:border-cyan-500/50 dark:hover:border-cyan-500/40",
    },
    {
        id: "audit-compliance",
        icon: FileCheck,
        title: "Audit & Compliance",
        description: "Track credential activity, changes and access history.",
        accentColor: "text-emerald-500 dark:text-emerald-400",
        hoverBorderColor: "hover:border-emerald-500/50 dark:hover:border-emerald-500/40",
    },
    {
        id: "external-vendor-access",
        icon: Globe,
        title: "External Vendor Access",
        description: "Provide controlled, scoped and time-bound third-party access.",
        accentColor: "text-violet-500 dark:text-violet-400",
        hoverBorderColor: "hover:border-violet-500/50 dark:hover:border-violet-500/40",
    },
    {
        id: "database-management",
        icon: Database,
        title: "Database Management",
        description: "Manage application database configuration and operational controls.",
        accentColor: "text-amber-500 dark:text-amber-400",
        hoverBorderColor: "hover:border-amber-500/50 dark:hover:border-amber-500/40",
    },
    {
        id: "one-time-secret-sharing",
        icon: Key,
        title: "One-Time Secret Sharing",
        description: "Share sensitive values through controlled, temporary access.",
        accentColor: "text-rose-500 dark:text-rose-400",
        hoverBorderColor: "hover:border-rose-500/50 dark:hover:border-rose-500/40",
    },
    {
        id: "licensing-system-governance",
        icon: Award,
        title: "Licensing & System Governance",
        description: "Manage platform licensing, integrity and administrative governance.",
        accentColor: "text-teal-500 dark:text-teal-400",
        hoverBorderColor: "hover:border-teal-500/50 dark:hover:border-teal-500/40",
    },
    {
        id: "custom-branding-whitelabeling",
        icon: Palette,
        title: "Custom Branding & Whitelabeling",
        description: "Adapt CredSecure presentation to customer branding requirements.",
        accentColor: "text-pink-500 dark:text-pink-400",
        hoverBorderColor: "hover:border-pink-500/50 dark:hover:border-pink-500/40",
    },
];

interface FeatureNavigatorProps {
    onSelectFeature?: (id: string) => void;
}

export function FeatureNavigator({ onSelectFeature }: FeatureNavigatorProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Quadruple list for 100% infinite seamless continuous drift
    const displayFeatures = [...navFeatures, ...navFeatures, ...navFeatures, ...navFeatures];

    const triggerTemporaryPause = useCallback((durationMs: number = 5000) => {
        setIsPaused(true);
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = setTimeout(() => setIsPaused(false), durationMs);
    }, []);

    const handleCardClick = (id: string) => {
        triggerTemporaryPause(5000);
        if (onSelectFeature) {
            onSelectFeature(id);
        } else {
            const target = document.getElementById(id);
            if (target) {
                const navbarOffset = 90;
                const elementPosition = target.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: Math.max(0, elementPosition - navbarOffset),
                    behavior: "smooth",
                });
            }
        }
    };

    // Continuous pixel-accumulated auto-drift
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        let animId: number;
        let accumulatedPx = 0;

        const animate = () => {
            if (!isPaused && scrollContainerRef.current) {
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
            scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
        }
    };

    const handleNext = () => {
        triggerTemporaryPause(5000);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
        }
    };

    return (
        <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quick Feature Navigator
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                    Explore CredSecure Capabilities
                </h2>
            </div>

            {/* Cards Track Container with Side Gutters */}
            <div className="relative px-12 sm:px-14">
                {/* Previous Arrow Button */}
                <button
                    onClick={handlePrev}
                    aria-label="Previous capabilities"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-slate-200 dark:border-white/[0.15] bg-white dark:bg-slate-900 shadow-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-none py-2 px-1 w-full"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {displayFeatures.map((feat, index) => {
                        const isDuplicate = index >= navFeatures.length;
                        const Icon = feat.icon;
                        return (
                            <button
                                key={`${feat.id}-${index}`}
                                onClick={() => handleCardClick(feat.id)}
                                onMouseEnter={() => setIsPaused(true)}
                                onMouseLeave={() => setIsPaused(false)}
                                aria-hidden={isDuplicate ? true : undefined}
                                tabIndex={isDuplicate ? -1 : 0}
                                className={`group/card relative text-left p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] ${feat.hoverBorderColor} hover:shadow-lg dark:hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between shrink-0 w-[270px] sm:w-[300px] h-[210px] overflow-hidden cursor-pointer`}
                            >
                                {/* Top subtle hover accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover/card:via-indigo-500/80 transition-all duration-300" />

                                <div className="space-y-2">
                                    {/* Icon */}
                                    <div className="flex items-start justify-between gap-3 mb-1">
                                        <div className={`p-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] group-hover/card:bg-slate-200/60 dark:group-hover/card:bg-white/[0.08] transition-colors ${feat.accentColor}`}>
                                            <Icon className="w-5 h-5" strokeWidth={1.75} />
                                        </div>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-300 transition-colors line-clamp-1">
                                        {feat.title}
                                    </h3>

                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                                        {feat.description}
                                    </p>
                                </div>

                                {/* Explore Action (Hover reveal text) */}
                                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover/card:text-indigo-500 transition-colors shrink-0 flex items-center justify-center gap-1">
                                    <span>Explore Capability</span>
                                    <ArrowRight className="w-3 h-3 group-hover/card:translate-x-0.5 transition-transform" />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Next Arrow Button */}
                <button
                    onClick={handleNext}
                    aria-label="Next capabilities"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-slate-200 dark:border-white/[0.15] bg-white dark:bg-slate-900 shadow-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </section>
    );
}
