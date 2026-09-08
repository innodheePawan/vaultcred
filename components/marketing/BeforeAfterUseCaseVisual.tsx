import { AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

export interface BeforeAfterHighlight {
    title: string;
    desc: string;
}

export interface BeforeAfterUseCaseData {
    traditional: {
        flow: string[];
        highlights: BeforeAfterHighlight[];
    };
    governed: {
        flow: string[];
        highlights: BeforeAfterHighlight[];
    };
}

interface BeforeAfterUseCaseVisualProps {
    data: BeforeAfterUseCaseData;
}

export function BeforeAfterUseCaseVisual({ data }: BeforeAfterUseCaseVisualProps) {
    return (
        <div className="my-8 space-y-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Workflow Transformation: Before vs. With CredSecure
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traditional Approach */}
                <div className="rounded-xl border border-rose-200/60 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Traditional Approach</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 ml-auto">
                                Manual Risk
                            </span>
                        </div>

                        {/* Workflow Nodes */}
                        <div className="flex flex-wrap items-center gap-2 mb-6 text-xs font-mono bg-white/70 dark:bg-slate-950/60 p-3 rounded-lg border border-rose-200/40 dark:border-rose-900/30">
                            {data.traditional.flow.map((node, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className={`px-2.5 py-1 rounded text-xs ${
                                        index === data.traditional.flow.length - 1
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                            : "bg-rose-100/80 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200"
                                    }`}>
                                        <span>{node}</span>
                                    </div>
                                    {index < data.traditional.flow.length - 1 && (
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Risk Highlights */}
                        <div className="space-y-2.5">
                            {data.traditional.highlights.map((h, idx) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                        {h.title}: <span className="font-normal text-slate-600 dark:text-slate-400">{h.desc}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* With CredSecure Governed Flow */}
                <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">With CredSecure Governance</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ml-auto">
                                Governed Flow
                            </span>
                        </div>

                        {/* Workflow Nodes */}
                        <div className="flex flex-wrap items-center gap-2 mb-6 text-xs font-mono bg-white/70 dark:bg-slate-950/60 p-3 rounded-lg border border-emerald-200/40 dark:border-emerald-900/30">
                            {data.governed.flow.map((node, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className={`px-2.5 py-1 rounded text-xs ${
                                        index === data.governed.flow.length - 1
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                            : "bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200"
                                    }`}>
                                        <span>{node}</span>
                                    </div>
                                    {index < data.governed.flow.length - 1 && (
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Governance Highlights */}
                        <div className="space-y-2.5">
                            {data.governed.highlights.map((h, idx) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                        {h.title}: <span className="font-normal text-slate-600 dark:text-slate-400">{h.desc}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
