import React from "react";
import { KeyRound, Server, FileKey, Shield, FileLock, FileText, ArrowRight, ShieldCheck } from "lucide-react";

export function PlatformHeroVisual() {
    return (
        <div className="relative border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#0b0f19] p-6 shadow-2xl overflow-hidden font-sans min-h-[460px] flex flex-col justify-between select-none">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Platform Control Hub
                    </span>
                    <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20">
                        Unified Governance
                    </span>
                </div>

                {/* Main Architectural Flow */}
                <div className="grid grid-cols-12 gap-3 items-center py-1">
                    
                    {/* Left: Input Credential Types (5 Cols) */}
                    <div className="col-span-5 space-y-2">
                        {[
                            { name: "Passwords", icon: KeyRound, color: "text-blue-500" },
                            { name: "API Keys", icon: Server, color: "text-indigo-500" },
                            { name: "Certificates", icon: FileKey, color: "text-violet-500" },
                            { name: "OAuth 2.0", icon: Shield, color: "text-purple-500" },
                            { name: "Secure Files", icon: FileLock, color: "text-amber-500" },
                            { name: "Security Keys", icon: FileText, color: "text-emerald-500" },
                        ].map((item, idx) => (
                            <div key={idx} className="p-2 rounded-lg border border-slate-200/80 dark:border-white/[0.05] bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between shadow-2xs hover:border-indigo-500/30 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                    <item.icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} strokeWidth={1.75} />
                                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                                </div>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 ml-1" />
                            </div>
                        ))}
                    </div>

                    {/* Center: Connectors & Central CREDSECURE Hub (3 Cols) */}
                    <div className="col-span-3 flex flex-col items-center justify-center relative">
                        <div className="w-full py-4 px-2 rounded-xl border border-indigo-500/30 dark:border-indigo-400/30 bg-gradient-to-b from-indigo-950 to-slate-900 text-white text-center shadow-[0_0_20px_rgba(99,102,241,0.25)] flex flex-col items-center justify-center gap-1.5 relative z-10 transition-transform duration-300 hover:scale-105">
                            <img src="/shield-logo.png" alt="CredSecure Shield Logo" className="h-7 w-7 object-contain" />
                            <span className="text-[11px] font-extrabold tracking-wider font-mono text-indigo-200 uppercase">
                                CREDSECURE
                            </span>
                        </div>
                    </div>

                    {/* Right: Governed Output Capabilities (4 Cols) */}
                    <div className="col-span-4 space-y-2.5">
                        {[
                            { label: "CONTROL", sub: "Access & Scopes", color: "border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400" },
                            { label: "TRACK", sub: "Lifecycle Rules", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" },
                            { label: "AUDIT", sub: "Complete Trails", color: "border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400" },
                        ].map((out, idx) => (
                            <div key={idx} className={`p-2.5 rounded-lg border ${out.color} text-center space-y-0.5 shadow-2xs`}>
                                <div className="text-[11px] font-extrabold font-mono tracking-widest">{out.label}</div>
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{out.sub}</div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Bottom Architectural Caption */}
                <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] text-center">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        Centralized Governance • Controlled Access • Complete Traceability
                    </span>
                </div>
            </div>
        </div>
    );
}
