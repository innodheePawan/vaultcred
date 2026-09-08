"use client";

import { useState, useEffect } from "react";
import { UseCaseNavigator } from "@/components/marketing/UseCaseNavigator";
import { ExpandableUseCaseCard, Tier1UseCaseData } from "@/components/marketing/ExpandableUseCaseCard";

interface UseCasesSectionProps {
    tier1UseCases: Tier1UseCaseData[];
}

export function UseCasesSection({ tier1UseCases }: UseCasesSectionProps) {
    const [activeUseCaseId, setActiveUseCaseId] = useState<string | null>(null);

    const handleSelectUseCase = (id: string) => {
        setActiveUseCaseId(id);
    };

    const handleAccordionToggle = (id: string) => {
        if (activeUseCaseId === id) {
            setActiveUseCaseId(null);
        } else {
            setActiveUseCaseId(id);
        }
    };

    useEffect(() => {
        if (!activeUseCaseId) return;

        // Perform smooth scroll after React updates DOM layout so target position is completely static
        const timer = setTimeout(() => {
            const target = document.getElementById(activeUseCaseId);
            if (target) {
                const navbarOffset = 90;
                const targetTop = target.getBoundingClientRect().top + window.scrollY - navbarOffset;
                window.scrollTo({
                    top: Math.max(0, targetTop),
                    behavior: "smooth",
                });
            }
        }, 10);

        return () => clearTimeout(timer);
    }, [activeUseCaseId]);

    return (
        <div>
            {/* Quick Discovery Navigator Anchor & Carousel */}
            <div id="quick-discovery-navigator" className="scroll-mt-20">
                <UseCaseNavigator onSelectUseCase={handleSelectUseCase} />
            </div>

            {/* Category Hook */}
            <section className="border-y border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        &ldquo;Most credential risks begin after storage. These use cases show how governance addresses the operational lifecycle — not just the encryption.&rdquo;
                    </p>
                </div>
            </section>

            {/* Tier 1: Primary Deep-Dive Use Cases (Single-Open Accordion) */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-4">
                {tier1UseCases.map((uc) => (
                    <ExpandableUseCaseCard
                        key={uc.id}
                        data={uc}
                        isOpen={activeUseCaseId === uc.id}
                        onToggle={() => handleAccordionToggle(uc.id)}
                    />
                ))}
            </section>
        </div>
    );
}
