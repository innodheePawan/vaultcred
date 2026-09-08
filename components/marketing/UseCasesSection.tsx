"use client";

import { useState } from "react";
import { UseCaseNavigator } from "@/components/marketing/UseCaseNavigator";
import { ExpandableUseCaseCard, Tier1UseCaseData } from "@/components/marketing/ExpandableUseCaseCard";

interface UseCasesSectionProps {
    tier1UseCases: Tier1UseCaseData[];
}

export function UseCasesSection({ tier1UseCases }: UseCasesSectionProps) {
    const [activeUseCaseId, setActiveUseCaseId] = useState<string | null>(null);

    const handleSelectUseCase = (id: string) => {
        const target = document.getElementById(id);
        const navbarOffset = 90;

        if (target) {
            let collapseHeightOffset = 0;

            // If a previous card is open and located ABOVE the target card, account for its height collapse in advance
            if (activeUseCaseId && activeUseCaseId !== id) {
                const prevCard = document.getElementById(activeUseCaseId);
                if (prevCard && (prevCard.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                    collapseHeightOffset = prevCard.offsetHeight;
                }
            }

            const currentTargetTop = target.getBoundingClientRect().top + window.scrollY;
            const finalTop = Math.max(0, currentTargetTop - collapseHeightOffset - navbarOffset);

            // 1. Update state (collapses previous card & opens selected card)
            setActiveUseCaseId(id);

            // 2. Perform a single smooth scroll directly to the predicted final settled position
            window.scrollTo({
                top: finalTop,
                behavior: "smooth",
            });
        } else {
            setActiveUseCaseId(id);
        }
    };

    const handleAccordionToggle = (id: string) => {
        if (activeUseCaseId === id) {
            setActiveUseCaseId(null);
        } else {
            setActiveUseCaseId(id);
        }
    };

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
