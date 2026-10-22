"use client";

export type GuessStageName = "Govern" | "Update" | "Exchange" | "Store" | "Secure";

interface GuessStageBadgeProps {
    /** List of active stage names or short codes */
    stages?: (GuessStageName | "G" | "U" | "E" | "S" | "Store" | "Secure")[];
    /** Primary emphasis stage names */
    emphasis?: (GuessStageName | string)[];
    compact?: boolean;
}

interface SlotDefinition {
    id: GuessStageName;
    letter: string;
    title: string;
}

const SLOTS: SlotDefinition[] = [
    { id: "Govern", letter: "G", title: "Govern" },
    { id: "Update", letter: "U", title: "Update" },
    { id: "Exchange", letter: "E", title: "Exchange" },
    { id: "Store", letter: "S", title: "Store" },
    { id: "Secure", letter: "S", title: "Secure" },
];

/**
 * Lightweight stage indicator tag for Use Cases & Platform Features.
 * Accurately maps the 5 operational lifecycle stages (Govern, Update, Exchange, Store, Secure).
 */
export function GuessStageBadge({
    stages = [],
    emphasis = [],
    compact = false,
}: GuessStageBadgeProps) {

    const isSlotActive = (slot: SlotDefinition): boolean => {
        // Direct string match against full title (e.g. "Govern", "Store", "Secure")
        if (stages.some((s) => s.toLowerCase() === slot.title.toLowerCase())) {
            return true;
        }

        // Direct match on short code for non-ambiguous stages
        if (slot.letter === "G" && stages.includes("G")) return true;
        if (slot.letter === "U" && stages.includes("U")) return true;
        if (slot.letter === "E" && stages.includes("E")) return true;

        // Fallback for short code "S":
        // If "S" is in stages without explicit "Store" or "Secure", check emphasis or fallback
        if (stages.includes("S")) {
            const hasExplicitStore = stages.some((s) => s.toLowerCase() === "store");
            const hasExplicitSecure = stages.some((s) => s.toLowerCase() === "secure");

            // If no explicit Store/Secure, default behavior based on emphasis
            if (!hasExplicitStore && !hasExplicitSecure) {
                if (slot.title === "Secure" && emphasis.some((e) => e.toLowerCase() === "secure")) {
                    return true;
                }
                if (slot.title === "Store" && emphasis.some((e) => e.toLowerCase() === "store")) {
                    return true;
                }
            }
        }

        return false;
    };

    const isSlotEmphasized = (slot: SlotDefinition): boolean => {
        return emphasis.some((e) => e.toLowerCase() === slot.title.toLowerCase());
    };

    const activeStageTitles = SLOTS.filter(isSlotActive).map((s) => s.title);

    return (
        <div
            title={`Operational Stages: ${activeStageTitles.join(" · ")}`}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] font-mono text-[10px] select-none ${
                compact ? "" : ""
            }`}
        >
            <span className="text-[8px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest pr-1.5 border-r border-slate-200 dark:border-white/[0.07]">
                GUESS
            </span>

            <div className="flex items-center gap-[3px]">
                {SLOTS.map((slot, idx) => {
                    const active = isSlotActive(slot);
                    const emphasized = isSlotEmphasized(slot);

                    return (
                        <span
                            key={idx}
                            title={`${slot.letter} — ${slot.title}`}
                            aria-label={`${slot.title}${active ? " (active)" : ""}`}
                            className={`w-[15px] h-[15px] rounded-sm flex items-center justify-center font-bold text-[10px] leading-none transition-all duration-200 ${
                                active
                                    ? emphasized
                                        ? "bg-indigo-600 text-white dark:bg-indigo-500 ring-1 ring-indigo-400/40"
                                        : "bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white"
                                    : "bg-slate-200/70 dark:bg-white/[0.05] text-slate-400 dark:text-slate-600"
                            }`}
                        >
                            {slot.letter}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
