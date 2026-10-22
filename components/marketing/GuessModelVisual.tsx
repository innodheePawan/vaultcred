"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    ShieldCheck,
    RotateCw,
    ArrowLeftRight,
    Database,
    Lock,
    ChevronRight,
    Sparkles,
} from "lucide-react";

interface GuessStage {
    letter: string;
    title: string;
    tagline: string;
    description: string;
    keyActions: string[];
    accentColor: string;
    bgLight: string;
    borderLight: string;
    glowColor: string;
    gradientFrom: string;
    gradientTo: string;
    icon: React.ElementType;
}

const guessStages: GuessStage[] = [
    {
        letter: "G",
        title: "Govern",
        tagline: "Decide who can access credentials and how they are managed",
        description: "Centralized governance ensuring every credential has an assigned owner, clear classification, and defined access controls. Know who is responsible and who is permitted.",
        keyActions: ["Role & group access control", "Owner attribution", "Access policy enforcement"],
        accentColor: "text-indigo-600 dark:text-indigo-400",
        bgLight: "bg-indigo-500/10 dark:bg-indigo-500/15",
        borderLight: "border-indigo-500/40 dark:border-indigo-500/50",
        glowColor: "shadow-indigo-500/15 dark:shadow-indigo-500/25",
        gradientFrom: "from-indigo-600",
        gradientTo: "to-indigo-400",
        icon: ShieldCheck,
    },
    {
        letter: "U",
        title: "Update",
        tagline: "Keep credential information current and maintain change history",
        description: "Manage credential updates and maintain version history in one place. Track what changed, when it changed, and keep credentials current across your operations.",
        keyActions: ["Version tracking", "Change history", "Lifecycle visibility"],
        accentColor: "text-blue-600 dark:text-blue-400",
        bgLight: "bg-blue-500/10 dark:bg-blue-500/15",
        borderLight: "border-blue-500/40 dark:border-blue-500/50",
        glowColor: "shadow-blue-500/15 dark:shadow-blue-500/25",
        gradientFrom: "from-blue-600",
        gradientTo: "to-cyan-400",
        icon: RotateCw,
    },
    {
        letter: "E",
        title: "Exchange",
        tagline: "Share or deliver credentials securely through authorized methods",
        description: "Share credentials with authorized team members, deliver them to applications through APIs, or provision them to connected systems — all through controlled, traceable channels.",
        keyActions: ["API credential delivery", "Vendor access control", "System provisioning"],
        accentColor: "text-cyan-600 dark:text-cyan-400",
        bgLight: "bg-cyan-500/10 dark:bg-cyan-500/15",
        borderLight: "border-cyan-500/40 dark:border-cyan-500/50",
        glowColor: "shadow-cyan-500/15 dark:shadow-cyan-500/25",
        gradientFrom: "from-cyan-600",
        gradientTo: "to-teal-400",
        icon: ArrowLeftRight,
    },
    {
        letter: "S",
        title: "Store",
        tagline: "Keep credentials protected in one managed location",
        description: "Credentials are stored securely in one place, encrypted at rest. Metadata and encrypted payloads are architecturally separated for defense-in-depth. No plaintext at rest.",
        keyActions: ["Encrypted credential storage", "Decoupled architecture", "Multiple credential types"],
        accentColor: "text-violet-600 dark:text-violet-400",
        bgLight: "bg-violet-500/10 dark:bg-violet-500/15",
        borderLight: "border-violet-500/40 dark:border-violet-500/50",
        glowColor: "shadow-violet-500/15 dark:shadow-violet-500/25",
        gradientFrom: "from-violet-600",
        gradientTo: "to-purple-400",
        icon: Database,
    },
    {
        letter: "S",
        title: "Secure",
        tagline: "Protect credentials with access controls and security measures",
        description: "Continuous security through mandatory two-factor authentication, session controls, configurable rate limiting, and a complete audit trail of all credential activity.",
        keyActions: ["Mandatory 2FA", "Full audit trail", "Session & rate controls"],
        accentColor: "text-emerald-600 dark:text-emerald-400",
        bgLight: "bg-emerald-500/10 dark:bg-emerald-500/15",
        borderLight: "border-emerald-500/40 dark:border-emerald-500/50",
        glowColor: "shadow-emerald-500/15 dark:shadow-emerald-500/25",
        gradientFrom: "from-emerald-600",
        gradientTo: "to-teal-400",
        icon: Lock,
    },
];

interface GuessModelVisualProps {
    showSectionHeader?: boolean;
}

export function GuessModelVisual({ showSectionHeader = true }: GuessModelVisualProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isUserHovering, setIsUserHovering] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Default to automatic cycle: advance through G-U-E-S-S stages every 3.8 seconds
    // Temporarily pauses while user is hovering to allow comfortable reading
    useEffect(() => {
        if (isUserHovering) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % guessStages.length);
        }, 3800);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isUserHovering]);

    const handleSelectStage = (idx: number) => {
        setActiveIndex(idx);
    };

    return (
        <section id="guess-model" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
            {/* Optional Section Header */}
            {showSectionHeader && (
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>OPERATIONAL MODEL</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        The Credential Operations Model
                    </h2>
                    <p className="text-sm sm:text-base text-slate-650 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        A dynamic 5-stage framework for how CredSecure operationalizes credentials across their lifecycle.
                    </p>
                </div>
            )}

            {/* Main Interactive Container */}
            <div
                className="relative rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#070b14]/80 p-5 sm:p-7 lg:p-9 backdrop-blur-sm shadow-xl"
                onMouseEnter={() => setIsUserHovering(true)}
                onMouseLeave={() => setIsUserHovering(false)}
            >
                {/* Subtitle Bar: Center aligned */}
                <div className="flex items-center justify-center mb-6 pb-4 border-b border-slate-200/90 dark:border-white/[0.08] text-center">
                    <span className="text-sm sm:text-base font-mono font-black tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/60 shadow-2xs">
                        G.U.E.S.S. Framework Flow
                    </span>
                </div>

                {/* Sliding Expandable Pillar Columns (Accordion Track) - Fixed desktop height to eliminate vertical bottom expansion */}
                <div className="flex flex-col md:flex-row gap-3 md:h-[390px] w-full items-stretch">
                    {guessStages.map((stage, idx) => {
                        const isActive = activeIndex === idx;
                        const Icon = stage.icon;

                        return (
                            <div
                                key={idx}
                                role="button"
                                tabIndex={0}
                                aria-expanded={isActive}
                                aria-label={`Stage: ${stage.letter} - ${stage.title}`}
                                onMouseEnter={() => handleSelectStage(idx)}
                                onClick={() => handleSelectStage(idx)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleSelectStage(idx);
                                    }
                                }}
                                className={`relative rounded-2xl border transition-[flex-grow,flex-shrink,border-color,background-color,box-shadow] duration-500 ease-out cursor-pointer overflow-hidden p-5 sm:p-6 flex flex-col justify-between select-none h-full ${isActive
                                    ? `md:flex-[3.5] ${stage.borderLight} bg-white dark:bg-[#0b101d] shadow-xl ${stage.glowColor} ring-1 ring-black/[0.04] dark:ring-white/10`
                                    : "md:flex-1 border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.12] hover:bg-white dark:hover:bg-white/[0.04] opacity-80 hover:opacity-100"
                                    }`}
                            >
                                {/* Top Progress Bar Indicator on Active Pillar */}
                                {isActive && !isUserHovering && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5 overflow-hidden">
                                        <div
                                            key={activeIndex}
                                            className={`h-full bg-gradient-to-r ${stage.gradientFrom} ${stage.gradientTo}`}
                                            style={{
                                                animation: "guessProgress 3.8s linear forwards",
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col h-full justify-between w-full">
                                    {/* Pillar Header Bar */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 sm:gap-3">
                                            <span
                                                className={`font-mono text-3xl sm:text-4xl font-black transition-colors ${isActive ? stage.accentColor : "text-slate-400 dark:text-slate-500"
                                                    }`}
                                            >
                                                {stage.letter}
                                            </span>
                                            <span
                                                className={`font-mono font-bold text-sm uppercase tracking-wider transition-colors ${isActive
                                                    ? "text-slate-900 dark:text-white"
                                                    : "text-slate-600 dark:text-slate-400"
                                                    }`}
                                            >
                                                {stage.title}
                                            </span>
                                        </div>

                                        <div
                                            className={`p-2 rounded-xl transition-all ${isActive
                                                ? `${stage.bgLight} ${stage.accentColor}`
                                                : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500"
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    </div>

                                    {/* Expanded Content Area (Active State) with smooth left-to-right slide */}
                                    {isActive ? (
                                        <div
                                            key={`stage-content-${idx}`}
                                            className="mt-5 sm:mt-6 space-y-4 animate-slide-right-smooth"
                                        >
                                            <div>
                                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                                                    {stage.tagline}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                                                    {stage.description}
                                                </p>
                                            </div>

                                            {/* Key Capabilities Pills Grid - displaying complete text without truncation */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                                                {stage.keyActions.map((action, i) => (
                                                    <div
                                                        key={i}
                                                        className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.03] text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-2xs min-w-0"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${stage.bgLight} shrink-0`} />
                                                        <span className="whitespace-normal break-words leading-snug">{action}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Collapsed Preview in Inactive State */
                                        <div className="my-auto hidden md:block">
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-wider line-clamp-2">
                                                {stage.tagline}
                                            </div>
                                            <div className="mt-4 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span>Explore</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Pillar Footer Bar - Active Stage badge removed */}
                                    {!isActive && (
                                        <div className="mt-4 flex items-center justify-end text-[10px] font-mono text-slate-400 dark:text-slate-500 md:hidden pt-2 border-t border-slate-200/50 dark:border-white/[0.04]">
                                            Tap to view
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
