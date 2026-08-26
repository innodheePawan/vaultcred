'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquare, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export function QuickActionsFloatingWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

    if (!mounted) return null;

    return (
        <div ref={containerRef} className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center pointer-events-none">
            {/* Expanded Compact Panel */}
            <div
                className={`pointer-events-auto transition-all duration-300 ease-in-out transform ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
                    } bg-white/95 dark:bg-[#0b101d]/95 backdrop-blur-xl border-l border-t border-b border-slate-200 dark:border-white/10 shadow-2xl rounded-l-2xl p-3 w-56 space-y-2`}
            >
                {/* Header with ChevronRight Hide arrow */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                        Quick Links
                    </span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                        title="Hide menu"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                </div>

                {/* Option 1: Contact Us */}
                <Link
                    href="/contact-us"
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] hover:bg-blue-600 dark:hover:bg-blue-600 hover:border-blue-600 transition-colors shadow-xs"
                >
                    <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-white transition-colors">
                            Contact Us
                        </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                </Link>

                {/* Option 2: Request Demo */}
                <Link
                    href="/request-demo"
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:border-indigo-600 transition-colors shadow-xs"
                >
                    <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-white transition-colors">
                            Request Demo
                        </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                </Link>
            </div>

            {/* Compact Collapsed Button (Just the ChevronLeft arrow button) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto bg-slate-900/90 dark:bg-blue-600/90 hover:bg-slate-800 dark:hover:bg-blue-500 text-white backdrop-blur-md border-l border-t border-b border-white/20 shadow-xl rounded-l-full py-3.5 px-2 flex items-center justify-center cursor-pointer transition-all duration-200 group hover:-translate-x-1"
                    title="Show Quick Links"
                    aria-label="Show Quick Links"
                >
                    <ChevronLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
                </button>
            )}
        </div>
    );
}
