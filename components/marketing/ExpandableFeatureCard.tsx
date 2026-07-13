'use client';

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ExpandableFeatureCardProps {
    title: string;
    items: string[];
    defaultOpen?: boolean;
}

export function ExpandableFeatureCard({ title, items, defaultOpen = false }: ExpandableFeatureCardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-slate-200 dark:border-white/[0.06] rounded-lg bg-slate-50 dark:bg-white/[0.02] overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-white/[0.1]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-4 text-left group"
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {title}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-200/50 dark:bg-white/[0.04] px-2 py-0.5 rounded-full">
                        {items.length}
                    </span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="px-5 pb-4 pt-0">
                    <div className="border-t border-slate-200 dark:border-white/[0.04] pt-3 space-y-2">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                                <div className="w-1 h-1 rounded-full bg-indigo-500/60 mt-1.5 shrink-0" />
                                <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
