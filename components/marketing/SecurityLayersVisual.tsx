"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, Fingerprint, ShieldAlert, FileSearch, KeyRound } from "lucide-react";

interface LayerNode {
    id: string;
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    color: string;
    bgGlow: string;
    badgeColor: string;
    position: string;
    desc: string;
}

export function SecurityLayersVisual() {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const nodes: LayerNode[] = [
        {
            id: "encrypted",
            title: "ENCRYPTED",
            value: "AES-256-GCM",
            icon: Lock,
            color: "text-blue-500 dark:text-blue-400",
            bgGlow: "from-blue-500/20 to-indigo-500/5",
            badgeColor: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
            position: "top-left",
            desc: "Credentials encrypted at rest with isolated key management."
        },
        {
            id: "access",
            title: "ACCESS CONTROL",
            value: "Least Privilege",
            icon: ShieldCheck,
            color: "text-indigo-500 dark:text-indigo-400",
            bgGlow: "from-indigo-500/20 to-purple-500/5",
            badgeColor: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
            position: "top-right",
            desc: "Granular access control and permission scoping."
        },
        {
            id: "identity",
            title: "IDENTITY",
            value: "MFA",
            icon: Fingerprint,
            color: "text-purple-500 dark:text-purple-400",
            bgGlow: "from-purple-500/20 to-pink-500/5",
            badgeColor: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300",
            position: "bottom-left",
            desc: "Multi-factor authentication across user access."
        },
        {
            id: "threat",
            title: "THREAT DEFENSE",
            value: "Abuse Protection",
            icon: ShieldAlert,
            color: "text-amber-500 dark:text-amber-400",
            bgGlow: "from-amber-500/20 to-rose-500/5",
            badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
            position: "bottom-right",
            desc: "Automated rate limiting and abuse prevention boundaries."
        },
    ];

    return (
        <div className="relative border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#0b0f19] p-6 shadow-2xl overflow-hidden font-sans select-none min-h-[460px] flex flex-col justify-between">
            {/* Background Ambient Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header Tag */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Security Protection Boundaries
                </span>
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/20">
                    Active Defense
                </span>
            </div>

            {/* Main Visual Container - Concentric Layout */}
            <div className="relative z-10 flex flex-col items-center justify-center py-1 my-auto">
                
                {/* Concentric Rings Visual Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Outer Ring */}
                    <div className="w-[320px] h-[320px] rounded-full border border-dashed border-slate-200 dark:border-white/10 animate-[spin_60s_linear_infinite]" />
                    {/* Middle Ring */}
                    <div className="absolute w-[220px] h-[220px] rounded-full border border-slate-200/80 dark:border-indigo-500/20" />
                    {/* Inner Ring */}
                    <div className="absolute w-[140px] h-[140px] rounded-full border border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-500/5 animate-pulse" />
                </div>

                {/* Central CredSecure Core Node */}
                <div className="relative z-20 flex flex-col items-center">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mb-1.5 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                        <span>CREDENTIALS & SECRETS</span>
                        <span className="text-xs">🔐</span>
                    </div>

                    <div className="w-36 py-2.5 px-4 rounded-xl border border-indigo-500/40 dark:border-indigo-400/40 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white text-center shadow-[0_0_25px_rgba(99,102,241,0.3)] flex flex-col items-center justify-center gap-1 transition-transform duration-300 hover:scale-105">
                        <img src="/shield-logo.png" alt="CredSecure Shield Logo" className="h-6 w-6 object-contain" />
                        <span className="text-xs font-black tracking-widest font-mono text-white uppercase">
                            CREDSECURE
                        </span>
                        <span className="text-[8px] font-mono text-indigo-300/80 uppercase tracking-wider">
                            Vault Core
                        </span>
                    </div>
                </div>

                {/* 4 Boundary Nodes */}
                <div className="w-full grid grid-cols-2 gap-4 mt-6 relative z-20">
                    {nodes.map((node) => {
                        const Icon = node.icon;
                        const isHovered = hoveredNode === node.id;

                        return (
                            <div
                                key={node.id}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                                    isHovered
                                        ? "border-indigo-500/60 dark:border-indigo-400/60 bg-slate-50 dark:bg-indigo-950/40 shadow-lg scale-[1.02]"
                                        : "border-slate-200/90 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/10"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`p-1.5 rounded-md ${node.badgeColor} border`}>
                                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                                    </div>
                                    <div className="text-[10px] font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase truncate">
                                        {node.title}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pl-7">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                                        {node.value}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">↓</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Outer Perimeter: AUDIT & TRACEABILITY */}
                <div
                    onMouseEnter={() => setHoveredNode("audit")}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`w-full mt-4 p-3 rounded-xl border transition-all duration-300 cursor-pointer relative z-20 flex items-center justify-between ${
                        hoveredNode === "audit"
                            ? "border-emerald-500/60 dark:border-emerald-400/60 bg-emerald-500/10 shadow-lg"
                            : "border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                    }`}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <FileSearch className="w-3.5 h-3.5" strokeWidth={2} />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-300 uppercase">
                                AUDIT & TRACEABILITY
                            </div>
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                                Comprehensive action tracking logs
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            Every Action Tracked
                        </span>
                    </div>
                </div>

            </div>

            {/* Bottom Caption */}
            <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-center min-h-[32px] flex items-center justify-center">
                {hoveredNode ? (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium transition-all duration-200">
                        {nodes.find(n => n.id === hoveredNode)?.desc || "Complete audit trail for all user and service access."}
                    </p>
                ) : (
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                        Layered Protection • Controlled Access • Complete Traceability
                    </p>
                )}
            </div>
        </div>
    );
}
