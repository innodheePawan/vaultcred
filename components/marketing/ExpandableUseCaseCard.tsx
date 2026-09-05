"use client";

import React from "react";
import { Server, KeyRound, Globe, FileCode, Layers, ChevronDown, Info } from "lucide-react";
import { BeforeAfterEnvVisual } from "@/components/marketing/BeforeAfterEnvVisual";
import { BeforeAfterBtpVisual } from "@/components/marketing/BeforeAfterBtpVisual";

const iconMap: Record<string, React.ElementType> = {
    "sap-credential-governance": Server,
    "production-access": KeyRound,
    "external-vendor-access": Globe,
    "application-credential-provisioning": FileCode,
    "btp-security-material-provisioning": Layers,
};

export interface Tier1UseCaseData {
    id: string;
    title: string;
    subtitle?: string;
    problem: string;
    pain: string[];
    solution: string;
    workflow: { step: string; desc: string }[];
    updateNote?: string;
    extensibilityTitle?: string;
    extensibilityNote?: string;
    outcome?: string;
    outcomeHeadline?: string;
    outcomeSub?: string;
    color: string;
    dotColor: string;
    visualType?: "env" | "btp";
}

interface ExpandableUseCaseCardProps {
    data: Tier1UseCaseData;
    isOpen: boolean;
    onToggle: () => void;
}

export function ExpandableUseCaseCard({ data, isOpen, onToggle }: ExpandableUseCaseCardProps) {
    const IconComponent = iconMap[data.id] || Server;

    return (
        <div
            id={data.id}
            className={`scroll-mt-24 border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white dark:bg-white/[0.02] border-l-2 ${data.color} overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-white/[0.1]`}
        >
            {/* Header (Always Visible) */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-6 sm:px-8 py-5 text-left group cursor-pointer select-none"
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-4">
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] group-hover:bg-slate-200/60 dark:group-hover:bg-white/[0.08] transition-colors shrink-0">
                        <IconComponent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors truncate">
                            {data.title}
                        </h2>
                        {data.subtitle && (
                            <p className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400/90 truncate mt-0.5">
                                {data.subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <ChevronDown
                        className={`w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-indigo-500" : ""
                        }`}
                    />
                </div>
            </button>

            {/* Collapsible Content */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="border-t border-slate-200/80 dark:border-white/[0.04]">
                    
                    {/* Problem & Solution Body */}
                    <div className="px-6 sm:px-8 pt-6 pb-6 space-y-6">
                        {/* Problem */}
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-2">
                                The Problem
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {data.problem}
                            </p>
                        </div>

                        {/* Operational Pain */}
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-2">
                                Operational Pain
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {data.pain.map((p, pIdx) => (
                                    <div key={pIdx} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500/60 mt-2 shrink-0" />
                                        <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* How CredSecure Solves It */}
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-2">
                                How CredSecure Solves It
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {data.solution}
                            </p>
                        </div>

                        {/* Embedded Visual Diagram */}
                        {data.visualType === "env" && <BeforeAfterEnvVisual />}
                        {data.visualType === "btp" && <BeforeAfterBtpVisual />}
                    </div>

                    {/* Governance Workflow */}
                    <div className="px-6 sm:px-8 py-6 border-t border-slate-200 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-4">
                            Governance Workflow
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {data.workflow.map((step, sIdx) => (
                                <div key={sIdx} className="flex flex-col justify-between p-3 rounded-lg border border-slate-200/60 dark:border-white/[0.04] bg-white/80 dark:bg-white/[0.02]">
                                    <div>
                                        <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mb-1">0{sIdx + 1}</div>
                                        <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">{step.step}</div>
                                        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Credential Updates Note */}
                    {data.updateNote && (
                        <div className="px-6 sm:px-8 py-3 border-t border-slate-200 dark:border-white/[0.04] bg-slate-50/80 dark:bg-white/[0.01]">
                            <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                                <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                                <p className="leading-relaxed">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Credential Updates: </span>
                                    {data.updateNote}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Extensibility Note */}
                    {data.extensibilityNote && (
                        <div className="px-6 sm:px-8 py-3 border-t border-slate-200 dark:border-white/[0.04] bg-slate-50/80 dark:bg-white/[0.01]">
                            <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                                <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                <p className="leading-relaxed">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {data.extensibilityTitle || "Extensibility Note"}{" "}
                                    </span>
                                    {data.extensibilityNote}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Outcome */}
                    <div className="px-6 sm:px-8 py-5 border-t border-slate-200 dark:border-white/[0.04] bg-slate-100/30 dark:bg-white/[0.02]">
                        {data.outcomeHeadline ? (
                            <div>
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${data.dotColor} shrink-0`} />
                                    {data.outcomeHeadline}
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-4 leading-relaxed font-medium">
                                    {data.outcomeSub}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${data.dotColor} mt-1.5 shrink-0`} />
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{data.outcome}</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
