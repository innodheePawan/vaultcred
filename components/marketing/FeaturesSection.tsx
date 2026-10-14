"use client";

import { useState } from "react";
import {
    Vault,
    ShieldCheck,
    Lock,
    Plug,
    FileSearch,
    Users,
    Flame,
    Palette,
    Database,
    BadgeCheck,
    type LucideIcon,
} from "lucide-react";
import { FeatureNavigator } from "@/components/marketing/FeatureNavigator";
import { ExpandableFeatureCard } from "@/components/marketing/ExpandableFeatureCard";
import { GuessStageName } from "@/components/marketing/GuessStageBadge";

const iconMap: Record<string, LucideIcon> = {
    "credential-vault": Vault,
    "identity-access-management": Users,
    "authentication-security": Lock,
    "api-gateway": Plug,
    "audit-compliance": FileSearch,
    "external-vendor-access": ShieldCheck,
    "one-time-secret-sharing": Flame,
    "custom-branding-whitelabeling": Palette,
    "database-management": Database,
    "licensing-system-governance": BadgeCheck,
};

export interface FeatureModuleData {
    id: string;
    title: string;
    subtitle?: string;
    items: string[];
    guessStages?: GuessStageName[];
    guessEmphasis?: GuessStageName[];
}

interface FeaturesSectionProps {
    modules: FeatureModuleData[];
}

export function FeaturesSection({ modules }: FeaturesSectionProps) {
    const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);

    const handleSelectFeature = (id: string) => {
        const target = document.getElementById(id);
        const navbarOffset = 90;

        if (target) {
            let collapseHeightOffset = 0;

            // If a previous card is open and located ABOVE the target card, account for its height collapse in advance
            if (activeFeatureId && activeFeatureId !== id) {
                const prevCard = document.getElementById(activeFeatureId);
                if (prevCard && (prevCard.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                    collapseHeightOffset = prevCard.offsetHeight;
                }
            }

            const currentTargetTop = target.getBoundingClientRect().top + window.scrollY;
            const finalTop = Math.max(0, currentTargetTop - collapseHeightOffset - navbarOffset);

            // 1. Update state (collapses previous card & opens selected card)
            setActiveFeatureId(id);

            // 2. Perform a single smooth scroll directly to the predicted final settled position
            window.scrollTo({
                top: finalTop,
                behavior: "smooth",
            });
        } else {
            setActiveFeatureId(id);
        }
    };

    const handleAccordionToggle = (id: string) => {
        if (activeFeatureId === id) {
            setActiveFeatureId(null);
        } else {
            setActiveFeatureId(id);
        }
    };

    return (
        <div>
            {/* Quick Feature Navigator Carousel */}
            <div id="quick-feature-navigator" className="scroll-mt-20 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01]">
                <FeatureNavigator onSelectFeature={handleSelectFeature} />
            </div>

            {/* Detailed Feature Modules (Single-Open Accordion) */}
            <section id="feature-modules" className="scroll-mt-20 py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-slate-200 dark:border-white/[0.06]">
                <div className="space-y-4">
                    {modules.map((mod) => (
                        <div key={mod.id} id={mod.id} className="scroll-mt-24">
                            <ExpandableFeatureCard
                                title={mod.title}
                                subtitle={mod.subtitle}
                                icon={iconMap[mod.id]}
                                items={mod.items}
                                guessStages={mod.guessStages}
                                guessEmphasis={mod.guessEmphasis}
                                isOpen={activeFeatureId === mod.id}
                                onToggle={() => handleAccordionToggle(mod.id)}
                            />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
