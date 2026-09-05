"use client";

import React, { useState } from "react";
import { KeyRound, Database, Sliders, ShieldCheck, FileCheck } from "lucide-react";

export function CapabilityMapVisual() {
    const [hoveredFamily, setHoveredFamily] = useState<string | null>(null);

    const families = [
        {
            id: "manage",
            title: "MANAGE",
            icon: Database,
            color: "text-blue-600 dark:text-blue-400",
            badgeBg: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
            modules: ["Credential Vault", "Database Management"],
            desc: "Centralized credential storage and zero-downtime database lifecycle management.",
        },
        {
            id: "control",
            title: "CONTROL",
            icon: Sliders,
            color: "text-indigo-600 dark:text-indigo-400",
            badgeBg: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
            modules: ["Identity & Access", "External Vendor Access", "One-Time Secret Sharing"],
            desc: "Granular RBAC, time-bound vendor custody, and ephemeral secret links.",
        },
        {
            id: "protect",
            title: "PROTECT",
            icon: ShieldCheck,
            color: "text-purple-600 dark:text-purple-400",
            badgeBg: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
            modules: ["Authentication & Security", "API Gateway"],
            desc: "Mandatory TOTP 2FA, password entropy, and multi-tier API gateway security.",
        },
        {
            id: "govern",
            title: "GOVERN",
            icon: FileCheck,
            color: "text-emerald-600 dark:text-emerald-400",
            badgeBg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            modules: ["Audit & Compliance", "Licensing & Governance", "Custom Branding"],
            desc: "Tamper-evident event audit ledgers, license authority, and custom whitelabeling.",
        },
    ];

    return (
        <div className="relative border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#0b0f19] p-6 shadow-2xl overflow-hidden font-sans select-none min-h-[460px] flex flex-col justify-between">
            {/* Background Ambient Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header Tag */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    Capability Map
                </span>
                <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20">
                    Platform Structure
                </span>
            </div>

            {/* Central CredSecure Hub Node */}
            <div className="relative z-10 flex flex-col items-center mb-4">
                <div className="w-40 py-2.5 px-4 rounded-xl border border-indigo-500/40 dark:border-indigo-400/40 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white text-center shadow-[0_0_20px_rgba(99,102,241,0.25)] flex flex-col items-center justify-center gap-1 transition-transform duration-300 hover:scale-105">
                    <img src="/shield-logo.png" alt="CredSecure Shield Logo" className="h-6 w-6 object-contain" />
                    <span className="text-xs font-black tracking-widest font-mono text-white uppercase">
                        CREDSECURE
                    </span>
                    <span className="text-[8px] font-mono text-indigo-300/80 uppercase tracking-wider">
                        Platform Core
                    </span>
                </div>
            </div>

            {/* 4 Capability Families Grid (2x2) */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {families.map((fam) => {
                    const IconComponent = fam.icon;
                    const isHovered = hoveredFamily === fam.id;

                    return (
                        <div
                            key={fam.id}
                            onMouseEnter={() => setHoveredFamily(fam.id)}
                            onMouseLeave={() => setHoveredFamily(null)}
                            className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                                isHovered
                                    ? "border-indigo-500/60 dark:border-indigo-400/60 bg-slate-50 dark:bg-indigo-950/30 shadow-md scale-[1.02]"
                                    : "border-slate-200/90 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02]"
                            }`}
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1 rounded-md ${fam.badgeBg} border`}>
                                        <IconComponent className="w-3.5 h-3.5" strokeWidth={2} />
                                    </div>
                                    <span className="text-[11px] font-mono font-extrabold tracking-widest text-slate-800 dark:text-slate-200">
                                        {fam.title}
                                    </span>
                                </div>

                                <div className="space-y-1 pl-1">
                                    {fam.modules.map((m, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                            <span className="truncate">{m}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Caption */}
            <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-center min-h-[30px] flex items-center justify-center">
                {hoveredFamily ? (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium transition-all duration-200">
                        {families.find(f => f.id === hoveredFamily)?.desc}
                    </p>
                ) : (
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                        4 Capability Families • 10 Integrated Modules • Unified Governance
                    </p>
                )}
            </div>
        </div>
    );
}
