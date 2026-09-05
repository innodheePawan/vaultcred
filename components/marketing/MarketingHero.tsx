import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";

export type MarketingHeroProps = {
    eyebrow: {
        icon?: LucideIcon;
        label: string;
    };
    title: {
        line1: string;
        gradientLine: string;
        className?: string;
    };
    description: React.ReactNode;
    primaryCta: {
        label: string;
        href: string;
        icon?: React.ReactNode;
    };
    secondaryCta?: {
        label: string;
        href: string;
    };
    visual: React.ReactNode;
    contentMaxWidth?: string;
    titleMaxWidth?: string;
    descriptionMaxWidth?: string;
};

export function MarketingHero({
    eyebrow,
    title,
    description,
    primaryCta,
    secondaryCta,
    visual,
    contentMaxWidth = "max-w-2xl",
    titleMaxWidth,
    descriptionMaxWidth = "max-w-xl",
}: MarketingHeroProps) {
    const EyebrowIcon = eyebrow.icon;

    return (
        <section className="py-14 sm:py-18 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                {/* Left Content Column */}
                <div className={`lg:col-span-7 space-y-5 text-left ${contentMaxWidth}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        {EyebrowIcon && (
                            <EyebrowIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {eyebrow.label}
                        </span>
                    </div>

                    <h1 className={`text-2xl sm:text-3xl lg:text-[2.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25] ${titleMaxWidth || ""}`}>
                        <div>{title.line1}</div>
                        <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 mt-1">
                            {title.gradientLine}
                        </div>
                    </h1>

                    <div className={`space-y-3 ${descriptionMaxWidth}`}>
                        {typeof description === "string" ? (
                            <p className="text-base sm:text-lg text-slate-650 dark:text-slate-300 leading-relaxed">
                                {description}
                            </p>
                        ) : (
                            description
                        )}
                    </div>

                    {/* CTA Actions */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Link href={primaryCta.href}>
                            <Button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all inline-flex items-center gap-2 cursor-pointer">
                                {primaryCta.label}
                                {primaryCta.icon || <ArrowRight className="w-4 h-4" />}
                            </Button>
                        </Link>

                        {secondaryCta && (
                            <Link href={secondaryCta.href}>
                                <Button variant="outline" className="h-11 px-6 border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                                    {secondaryCta.label}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Right Column: Visual */}
                <div className="lg:col-span-5">
                    {visual}
                </div>
            </div>
        </section>
    );
}
