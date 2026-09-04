import React from "react";
import { FileSpreadsheet, MessageSquare, Share2, Mail, HelpCircle, ShieldCheck, Database, Lock, History, FileSearch, ArrowDown } from "lucide-react";

export function BeforeAfterHeroVisual() {
    return (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/[0.06]">
            <div className="text-center max-w-3xl mx-auto mb-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">
                    Visual Explanation
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Before <span className="text-slate-400 font-normal mx-2">→</span> <span className="text-indigo-600 dark:text-indigo-400">With CredSecure</span>
                </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* ═══════════════════════════════════════════════════════════
                    BEFORE: TODAY (Fragmented & Unmanaged Sprawl)
                ═══════════════════════════════════════════════════════════ */}
                <div className="rounded-2xl border border-rose-200/80 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/10 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-b border-l border-rose-200 dark:border-rose-800 text-[10px] font-mono font-bold uppercase rounded-bl-lg">
                        Today (Unmanaged Risk)
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-xs font-mono font-extrabold tracking-wider text-rose-700 dark:text-rose-400 uppercase">
                                TODAY
                            </span>
                        </div>

                        {/* Top Sources Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {[
                                { name: "Excel", icon: FileSpreadsheet, color: "text-emerald-600 dark:text-emerald-400" },
                                { name: "Teams", icon: MessageSquare, color: "text-blue-600 dark:text-blue-400" },
                                { name: "SharePoint", icon: Share2, color: "text-teal-600 dark:text-teal-400" },
                                { name: "Email", icon: Mail, color: "text-sky-600 dark:text-sky-400" },
                            ].map((src, idx) => (
                                <div key={idx} className="p-3 rounded-lg border border-rose-200/60 dark:border-rose-900/40 bg-white/80 dark:bg-slate-950/60 text-center flex flex-col items-center justify-center gap-1.5 shadow-xs">
                                    <src.icon className={`w-5 h-5 ${src.color}`} strokeWidth={1.75} />
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{src.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Converging Visual Lines */}
                        <div className="flex flex-col items-center justify-center my-4">
                            <div className="text-slate-400 dark:text-slate-600 text-xs font-mono tracking-widest hidden sm:block">
                                \ &nbsp; | &nbsp; | &nbsp; /
                            </div>
                            <div className="w-px h-4 bg-rose-300 dark:bg-rose-800 my-1" />
                            <div className="px-4 py-2 rounded-full border border-rose-300 dark:border-rose-700 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 text-xs font-bold font-mono shadow-xs">
                                Credentials Everywhere
                            </div>
                            <ArrowDown className="w-4 h-4 text-rose-500 my-2 animate-bounce" />
                        </div>

                        {/* Unanswered Questions Box */}
                        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-white/70 dark:bg-slate-950/70 space-y-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold mb-2">
                                Operational Blind Spots
                            </div>
                            {[
                                "Who has access?",
                                "Which is current?",
                                "When does it expire?",
                                "Who changed it?",
                            ].map((q, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <HelpCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>{q}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    AFTER: WITH CREDSECURE (Governed Centralization)
                ═══════════════════════════════════════════════════════════ */}
                <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-b border-l border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold uppercase rounded-bl-lg">
                        With CredSecure (Governed)
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-xs font-mono font-extrabold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
                                WITH CREDSECURE
                            </span>
                        </div>

                        {/* Central Hub */}
                        <div className="flex flex-col items-center justify-center mb-6">
                            <div className="w-full py-3.5 px-6 rounded-xl border border-indigo-500/30 dark:border-indigo-400/30 bg-gradient-to-r from-indigo-900 to-slate-900 text-white text-center shadow-md flex items-center justify-center gap-2.5">
                                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                <span className="text-sm font-extrabold tracking-wider font-mono">CREDSECURE</span>
                            </div>
                            <div className="w-px h-5 bg-emerald-400 dark:bg-emerald-600 my-1" />
                        </div>

                        {/* 3 Pillars Branch */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center mb-5">
                            {[
                                { title: "Store", desc: "Credentials", icon: Database, color: "text-indigo-600 dark:text-indigo-400" },
                                { title: "Control", desc: "Access", icon: Lock, color: "text-emerald-600 dark:text-emerald-400" },
                                { title: "Track", desc: "Lifecycle", icon: History, color: "text-amber-600 dark:text-amber-400" },
                            ].map((pillar, idx) => (
                                <div key={idx} className="p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-white/80 dark:bg-slate-950/60 flex flex-col items-center justify-center shadow-xs">
                                    <pillar.icon className={`w-4 h-4 ${pillar.color} mb-1`} strokeWidth={2} />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{pillar.title}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{pillar.desc}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Output: Audit */}
                        <div className="flex flex-col items-center">
                            <div className="w-px h-4 bg-emerald-400 dark:bg-emerald-600 my-0.5" />
                            <div className="w-full p-3 rounded-lg border border-emerald-300 dark:border-emerald-700/60 bg-emerald-100/70 dark:bg-emerald-900/40 text-center flex items-center justify-center gap-2">
                                <FileSearch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100 font-mono">
                                    Audit
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Underneath Callout */}
            <div className="mt-8 p-5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0b0f19] text-center shadow-sm max-w-4xl mx-auto">
                <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    One governed source for your operational credentials — with controlled access, ownership, expiry tracking, history and complete traceability.
                </p>
            </div>
        </section>
    );
}
