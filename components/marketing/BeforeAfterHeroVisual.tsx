import React from "react";
import { FileSpreadsheet, MessageSquare, Share2, Mail, HelpCircle, ShieldCheck, Database, Lock, History, ArrowDown, CheckCircle2 } from "lucide-react";

export function BeforeAfterHeroVisual() {
    return (
        <section id="how-it-works" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/[0.06] scroll-mt-20">
            <div className="text-center max-w-3xl mx-auto mb-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-2">
                    Visual Explanation
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Before CredSecure <span className="text-slate-400 font-normal mx-2">→</span> <span className="text-indigo-600 dark:text-indigo-400">With CredSecure</span>
                </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* ═══════════════════════════════════════════════════════════
                    BEFORE: TODAY (Fragmented & Unmanaged Sprawl)
                ═══════════════════════════════════════════════════════════ */}
                <div className="rounded-2xl border border-rose-200/80 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/10 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-b border-l border-rose-200 dark:border-rose-800 text-[10px] font-mono font-bold uppercase rounded-bl-lg">
                        Today (Unmanaged Risk)
                    </div>

                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-mono font-extrabold tracking-wider text-rose-700 dark:text-rose-400 uppercase">
                                    TODAY
                                </span>
                            </div>

                            {/* Top Visual Diagram (Fixed Height Container for Pixel-Perfect Alignment) */}
                            <div className="min-h-[175px] flex flex-col justify-between mb-6">
                                {/* Top Sources Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {[
                                        { name: "Excel", icon: FileSpreadsheet, color: "text-emerald-600 dark:text-emerald-400" },
                                        { name: "Teams", icon: MessageSquare, color: "text-blue-600 dark:text-blue-400" },
                                        { name: "SharePoint", icon: Share2, color: "text-teal-600 dark:text-teal-400" },
                                        { name: "Email", icon: Mail, color: "text-sky-600 dark:text-sky-400" },
                                    ].map((src, idx) => (
                                        <div key={idx} className="p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40 bg-white/80 dark:bg-slate-950/60 text-center flex flex-col items-center justify-center gap-1 shadow-xs">
                                            <src.icon className={`w-4 h-4 ${src.color}`} strokeWidth={1.75} />
                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{src.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Converging Visual Lines */}
                                <div className="flex flex-col items-center justify-center pt-2">
                                    <div className="text-slate-400 dark:text-slate-600 text-[11px] font-mono tracking-widest hidden sm:block">
                                        {"\\   |   |   /"}
                                    </div>
                                    <div className="w-px h-2.5 bg-rose-300 dark:bg-rose-800 my-0.5" />
                                    <div className="px-4 py-1 rounded-full border border-rose-300 dark:border-rose-700 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 text-xs font-bold font-mono shadow-xs">
                                        Scattered Credentials
                                    </div>
                                    <ArrowDown className="w-3.5 h-3.5 text-rose-500 mt-1 animate-bounce" />
                                </div>
                            </div>
                        </div>

                        {/* Operational Blind Spots Box */}
                        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-white/70 dark:bg-slate-950/70 space-y-2.5">
                            <div className="h-5 text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold mb-1 flex items-center">
                                Operational Blind Spots
                            </div>
                            {[
                                { question: "Who has access?", detail: "Unmanaged sharing" },
                                { question: "Which is current?", detail: "Stale static copies" },
                                { question: "When does it expire?", detail: "Surprise outages" },
                                { question: "Who changed it?", detail: "Zero audit trail" },
                            ].map((q, idx) => (
                                <div key={idx} className="h-9 flex items-center justify-between px-3 py-1.5 rounded bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-xs font-medium text-slate-800 dark:text-slate-200">
                                    <div className="flex items-center gap-2">
                                        <HelpCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        <span>{q.question}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-rose-600/80 dark:text-rose-400/80">{q.detail}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    AFTER: WITH CREDSECURE (Governed Centralization)
                ═══════════════════════════════════════════════════════════ */}
                <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-b border-l border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold uppercase rounded-bl-lg">
                        With CredSecure (Governed)
                    </div>

                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-mono font-extrabold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
                                    WITH CREDSECURE
                                </span>
                            </div>

                            {/* Top Visual Diagram (Fixed Height Container for Pixel-Perfect Alignment) */}
                            <div className="min-h-[175px] flex flex-col justify-between mb-6">
                                {/* Central Hub Logo Box */}
                                <div className="py-2.5 px-5 rounded-xl border border-indigo-500/30 dark:border-indigo-400/30 bg-slate-900 dark:bg-slate-950 text-white text-center shadow-md flex items-center justify-center gap-3">
                                    <img src="/shield-logo.png" alt="CredSecure Shield Logo" className="h-6 w-6 object-contain" />
                                    <span className="text-base font-extrabold tracking-tight font-sans">CredSecure</span>
                                </div>

                                <div className="flex justify-center -my-1">
                                    <div className="w-px h-3 bg-emerald-400 dark:bg-emerald-600" />
                                </div>

                                {/* 3 Pillars Branch */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 text-center">
                                    {[
                                        { title: "Secure", desc: "Credentials", icon: Database, color: "text-indigo-600 dark:text-indigo-400" },
                                        { title: "Control", desc: "Access", icon: Lock, color: "text-emerald-600 dark:text-emerald-400" },
                                        { title: "Track", desc: "Lifecycle", icon: History, color: "text-amber-600 dark:text-amber-400" },
                                    ].map((pillar, idx) => (
                                        <div key={idx} className="p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-white/80 dark:bg-slate-950/60 flex flex-col items-center justify-center shadow-xs">
                                            <pillar.icon className={`w-3.5 h-3.5 ${pillar.color} mb-0.5`} strokeWidth={2} />
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">{pillar.title}</span>
                                            <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono">{pillar.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 1:1 Governed Direct Answers Box */}
                        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-white/70 dark:bg-slate-950/70 space-y-2.5">
                            <div className="h-5 text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mb-1 flex items-center">
                                Governed Control Answers
                            </div>
                            {[
                                { answer: "Controlled Access", detail: "Role-Based Access" },
                                { answer: "Version History", detail: "Single Source of Truth" },
                                { answer: "Expiry Tracking", detail: "Automated Alerts" },
                                { answer: "Complete Audit Trail", detail: "Every Change Recorded" },
                            ].map((ans, idx) => (
                                <div key={idx} className="h-9 flex items-center justify-between px-3 py-1.5 rounded bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-xs font-medium text-slate-800 dark:text-slate-200">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{ans.answer}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold">{ans.detail}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Underneath Callout */}
            <div className="mt-8 p-5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0b0f19] text-center shadow-sm max-w-4xl mx-auto">
                <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    One governed source for your credentials. Controlled access. Complete traceability.
                </p>
            </div>
        </section>
    );
}
