"use client";

import React, { useState } from "react";
import { Users, Cpu, Layers, ShieldCheck } from "lucide-react";

export function UseCaseWorkflowVisual() {
    const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);

    const pillars = [
        {
            id: "people",
            title: "PEOPLE",
            subtitle: "Controlled Access",
            icon: Users,
            color: "text-indigo-600 dark:text-indigo-400",
            badgeBg: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
            borderHover: "hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30",
            useCases: [
                "Production Access",
                "External Vendor Access",
            ],
            desc: "Time-bound, MFA-verified operator and contractor access with automatic revocation.",
        },
        {
            id: "applications",
            title: "APPLICATIONS",
            subtitle: "Credential Retrieval",
            icon: Cpu,
            color: "text-emerald-600 dark:text-emerald-400",
            badgeBg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            borderHover: "hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
            useCases: [
                "App Credential Provisioning",
            ],
            desc: "Direct, API-driven .env and secret delivery during build & startup without plain text files.",
        },
        {
            id: "platforms",
            title: "PLATFORMS",
            subtitle: "Security Material Provisioning",
            icon: Layers,
            color: "text-purple-600 dark:text-purple-400",
            badgeBg: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
            borderHover: "hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/30",
            useCases: [
                "SAP Credential Governance",
                "BTP Security Material",
            ],
            desc: "Centralized lifecycle management and direct target system provisioning for enterprise suites.",
        },
    ];

    return (
        <div className="relative border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#0b0f19] p-6 shadow-2xl overflow-hidden font-sans select-none min-h-[460px] flex flex-col justify-between">
            {/* Background Ambient Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header Tag */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    Where CredSecure Fits
                </span>
                <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20">
                    Operational Scope
                </span>
            </div>

            {/* Central CredSecure Hub Node */}
            <div className="relative z-10 flex flex-col items-center mb-3">
                <div className="w-40 py-2.5 px-4 rounded-xl border border-indigo-500/40 dark:border-indigo-400/40 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white text-center shadow-[0_0_20px_rgba(99,102,241,0.25)] flex flex-col items-center justify-center gap-1 transition-transform duration-300 hover:scale-105">
                    <img src="/shield-logo.png" alt="CredSecure Shield Logo" className="h-6 w-6 object-contain" />
                    <span className="text-xs font-black tracking-widest font-mono text-white uppercase">
                        CREDSECURE
                    </span>
                    <span className="text-[8px] font-mono text-indigo-300/80 uppercase tracking-wider">
                        Operational Governance
                    </span>
                </div>
            </div>

            {/* Flow Connecting Lines */}
            <div className="relative z-10 flex items-center justify-center mb-4">
                <div className="w-full max-w-[280px] h-3 border-t-2 border-x-2 border-slate-200 dark:border-white/10 rounded-t-lg relative">
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-200 dark:bg-white/10" />
                </div>
            </div>

            {/* 3 Pillars Grid */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {pillars.map((p) => {
                    const IconComponent = p.icon;
                    const isHovered = hoveredPillar === p.id;

                    return (
                        <div
                            key={p.id}
                            onMouseEnter={() => setHoveredPillar(p.id)}
                            onMouseLeave={() => setHoveredPillar(null)}
                            className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                                isHovered
                                    ? "border-indigo-500/60 dark:border-indigo-400/60 bg-slate-50 dark:bg-indigo-950/30 shadow-md scale-[1.02]"
                                    : "border-slate-200/90 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02]"
                            }`}
                        >
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className={`p-1 rounded-md ${p.badgeBg} border`}>
                                        <IconComponent className="w-3.5 h-3.5" strokeWidth={2} />
                                    </div>
                                    <span className="text-[11px] font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200">
                                        {p.title}
                                    </span>
                                </div>

                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                    {p.subtitle}
                                </div>

                                <div className="space-y-1">
                                    {p.useCases.map((uc, idx) => (
                                        <div
                                            key={idx}
                                            className="text-[10px] font-mono font-medium px-2 py-1 rounded bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.05] text-slate-700 dark:text-slate-300 truncate"
                                        >
                                            {uc}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Outcome Node */}
            <div className="relative z-10 flex flex-col items-center pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest">
                        GOVERNED CREDENTIAL OPERATIONS
                    </span>
                </div>
            </div>

            {/* Dynamic Bottom Description */}
            <div className="relative z-10 mt-3 text-center min-h-[26px] flex items-center justify-center">
                {hoveredPillar ? (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium transition-all duration-200">
                        {pillars.find(p => p.id === hoveredPillar)?.desc}
                    </p>
                ) : (
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                        Controlled Access • Credential Delivery • Target System Provisioning
                    </p>
                )}
            </div>
        </div>
    );
}
