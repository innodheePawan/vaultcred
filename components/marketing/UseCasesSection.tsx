"use client";

import { useState, useRef } from "react";
import { UseCaseNavigator } from "@/components/marketing/UseCaseNavigator";
import { ExpandableUseCaseCard, Tier1UseCaseData } from "@/components/marketing/ExpandableUseCaseCard";

interface UseCasesSectionProps {
    tier1UseCases: Tier1UseCaseData[];
}

export function UseCasesSection({ tier1UseCases }: UseCasesSectionProps) {
    const [activeUseCaseId, setActiveUseCaseId] = useState<string | null>(null);
    const animFrameRef = useRef<number | null>(null);

    const cancelScroll = () => {
        if (animFrameRef.current !== null) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
    };

    const smoothScrollTo = (targetY: number, duration = 300, onComplete?: () => void) => {
        cancelScroll();
        const startY = window.scrollY;
        const distance = targetY - startY;

        if (Math.abs(distance) < 5) {
            window.scrollTo(0, targetY);
            onComplete?.();
            return;
        }

        let startTime: number | null = null;
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const step = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);

            window.scrollTo(0, startY + distance * easedProgress);

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(step);
            } else {
                animFrameRef.current = null;
                onComplete?.();
            }
        };

        animFrameRef.current = requestAnimationFrame(step);
    };

    const handleSelectUseCase = (targetId: string) => {
        const navbarOffset = 90;
        const useCaseIds = tier1UseCases.map((uc) => uc.id);

        // Case 1: Clicking the already active card header or navigator card
        if (activeUseCaseId === targetId) {
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navbarOffset;
                smoothScrollTo(Math.max(0, targetTop));
            }
            return;
        }

        // Case 2: Opening a card when no card is currently open
        if (activeUseCaseId === null) {
            setActiveUseCaseId(targetId);
            requestAnimationFrame(() => {
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navbarOffset;
                    smoothScrollTo(Math.max(0, targetTop));
                }
            });
            return;
        }

        // Case 3: Swapping between two open cards
        const indexA = useCaseIds.indexOf(activeUseCaseId);
        const indexB = useCaseIds.indexOf(targetId);

        if (indexB < indexA) {
            // Target Card B is ABOVE active Card A.
            // Card A closing below Card B will NOT alter Card B's pageY position.
            setActiveUseCaseId(targetId);
            requestAnimationFrame(() => {
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navbarOffset;
                    smoothScrollTo(Math.max(0, targetTop));
                }
            });
        } else {
            // Target Card B is BELOW active Card A.
            // Measure Card A's height before closing it so we can keep Card B header static.
            const activeEl = document.getElementById(activeUseCaseId);
            const collapsible = activeEl?.querySelector("[data-collapsible-content]");
            const H_A = collapsible ? (collapsible as HTMLElement).offsetHeight : 0;

            const targetEl = document.getElementById(targetId);
            if (!targetEl) {
                setActiveUseCaseId(targetId);
                return;
            }

            const currentTargetTop = targetEl.getBoundingClientRect().top + window.scrollY;
            const targetScrollY = Math.max(0, currentTargetTop - navbarOffset);

            // Smoothly glide camera down to Card B's header FIRST
            smoothScrollTo(targetScrollY, 320, () => {
                // When camera lands at Card B's header:
                setActiveUseCaseId(targetId);
                // Adjust scrollY by H_A instantly so Card B header stays frozen at exact same 90px top offset
                const adjustedScrollY = Math.max(0, targetScrollY - H_A);
                window.scrollTo(0, adjustedScrollY);
            });
        }
    };

    const handleAccordionToggle = (id: string) => {
        if (activeUseCaseId === id) {
            cancelScroll();
            setActiveUseCaseId(null);
        } else {
            handleSelectUseCase(id);
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
