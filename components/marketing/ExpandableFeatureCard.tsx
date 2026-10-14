'use client';

import { useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { GuessStageBadge, GuessStageName } from "@/components/marketing/GuessStageBadge";

interface ExpandableFeatureCardProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    items: string[];
    defaultOpen?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
    guessStages?: GuessStageName[];
    guessEmphasis?: GuessStageName[];
}

export function ExpandableFeatureCard({
    title,
    subtitle,
    icon: IconComponent,
    items,
    defaultOpen = false,
    isOpen: controlledIsOpen,
    onToggle,
    guessStages,
    guessEmphasis,
}: ExpandableFeatureCardProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

    const isControlled = typeof controlledIsOpen === "boolean";
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const handleToggle = () => {
        if (isControlled && onToggle) {
            onToggle();
        } else {
            setInternalIsOpen(!internalIsOpen);
        }
    };

    return (
        <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white dark:bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-white/[0.1]">
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between px-6 sm:px-8 py-5 text-left group cursor-pointer select-none"
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-4">
                    {/* Icon box — matches use-case card */}
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] group-hover:bg-slate-200/60 dark:group-hover:bg-white/[0.08] transition-colors shrink-0">
                        {IconComponent ? (
                            <IconComponent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                        ) : (
                            <div className="w-5 h-5 rounded bg-slate-300 dark:bg-slate-600" />
                        )}
                    </div>

                    <div className="min-w-0 space-y-1">
                        {/* Title + GUESS badge row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                {title}
                            </h3>
                            {guessStages && guessStages.length > 0 && (
                                <GuessStageBadge stages={guessStages} emphasis={guessEmphasis} />
                            )}
                        </div>

                        {/* Subtitle — indigo, matches use-case style */}
                        {subtitle && (
                            <p className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400/90 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <ChevronDown
                    className={`w-5 h-5 text-slate-400 group-hover:text-indigo-500 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-indigo-500" : ""
                    }`}
                />
            </button>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="px-6 sm:px-8 pb-5 pt-0">
                    <div className="border-t border-slate-100 dark:border-white/[0.04] pt-4 space-y-2.5">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 mt-1.5 shrink-0" />
                                <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
