'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Sparkles, 
    RefreshCw, 
    ArrowDownToLine, 
    X
} from 'lucide-react';
import { 
    generateSecureCredential, 
    calculateEntropy, 
    calculateStrength,
    PasswordGeneratorPolicy 
} from '@/lib/utils/password-generator';

export interface PasswordGeneratorPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (generatedPassword: string) => void;
    initialLength?: number;
    anchorRef?: React.RefObject<HTMLElement | null>;
}

const PRESETS = [
    { label: '16 Safe', length: 16, policy: { uppercase: true, lowercase: true, numbers: true, special: true } },
    { label: '24 Enterprise', length: 24, policy: { uppercase: true, lowercase: true, numbers: true, special: true } },
    { label: 'No Symbols', length: 16, policy: { uppercase: true, lowercase: true, numbers: true, special: false } },
];

export function PasswordGeneratorPopover({
    isOpen,
    onClose,
    onApply,
    initialLength = 16,
    anchorRef
}: PasswordGeneratorPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [length, setLength] = useState<number>(initialLength);
    const [policy, setPolicy] = useState<PasswordGeneratorPolicy>({
        uppercase: true,
        lowercase: true,
        numbers: true,
        special: true,
    });
    const [password, setPassword] = useState<string>('');
    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

    // Dynamic positioning: aligned near the Password field on the right-hand side
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (!anchorRef?.current) {
                // Fallback: right side
                setPositionStyle({
                    position: 'fixed',
                    right: '20px',
                    top: '120px',
                });
                return;
            }

            const rect = anchorRef.current.getBoundingClientRect();
            const popupWidth = 320;
            const spacing = 14;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Align vertically with the Password field
            let top = rect.top - 6;
            const maxTop = viewportHeight - 370;
            if (top > maxTop) {
                top = Math.max(16, maxTop);
            }
            if (top < 16) {
                top = 16;
            }

            // Check if there is room to the right of the field
            const spaceOnRight = viewportWidth - rect.right;
            const fitsDirectlyRight = spaceOnRight >= popupWidth + spacing + 16;

            if (fitsDirectlyRight && viewportWidth >= 768) {
                // Placed immediately to the right of the password field
                setPositionStyle({
                    position: 'fixed',
                    top: `${top}px`,
                    left: `${rect.right + spacing}px`,
                    width: `${popupWidth}px`,
                });
            } else if (viewportWidth >= 640) {
                // Docked to the right side of the screen, vertically aligned with the password field
                setPositionStyle({
                    position: 'fixed',
                    top: `${top}px`,
                    right: '20px',
                    width: `${popupWidth}px`,
                });
            } else {
                // Mobile: centered below field or near it
                setPositionStyle({
                    position: 'fixed',
                    top: `${Math.min(rect.bottom + 8, viewportHeight - 370)}px`,
                    left: '16px',
                    right: '16px',
                    width: 'auto',
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, anchorRef]);

    // Regenerate password based on active options
    const handleGenerate = useCallback(() => {
        setIsSpinning(true);
        setTimeout(() => setIsSpinning(false), 250);

        const newPass = generateSecureCredential(
            length,
            policy.uppercase,
            policy.lowercase,
            policy.numbers,
            policy.special
        );
        setPassword(newPass);
    }, [length, policy]);

    // Generate immediately when opened or when options change
    useEffect(() => {
        if (isOpen) {
            handleGenerate();
        }
    }, [isOpen, handleGenerate]);

    // Close on Click Outside or Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current && 
                !popoverRef.current.contains(event.target as Node) &&
                anchorRef?.current &&
                !anchorRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, anchorRef]);

    // Handle policy toggle with safeguard (must keep at least 1 enabled)
    const handlePolicyToggle = (key: keyof PasswordGeneratorPolicy) => {
        setPolicy((prev) => {
            const updated = { ...prev, [key]: !prev[key] };
            const activeCount = Object.values(updated).filter(Boolean).length;
            if (activeCount === 0) return prev; // Don't allow unchecking everything
            return updated;
        });
    };

    // Directly insert password into the parent password field
    const handleInsert = () => {
        if (!password) return;
        onApply(password);
        onClose();
    };

    // Calculate entropy & strength
    const entropy = useMemo(() => calculateEntropy(length, policy), [length, policy]);
    const strength = useMemo(() => calculateStrength(entropy), [entropy]);

    if (!isOpen) return null;

    return (
        <>
            {/* Click-outside backdrop */}
            <div 
                className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[0.5px] transition-opacity animate-in fade-in-0"
                onClick={onClose}
            />

            {/* Compact Floating Generator properly aligned near the Password Field */}
            <div 
                ref={popoverRef}
                style={positionStyle}
                className="z-50 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl font-sans text-slate-800 dark:text-slate-100 transition-all duration-150 animate-in fade-in-0 zoom-in-95"
            >
                {/* Compact Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Password Generator
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Compact Body */}
                <div className="p-3.5 space-y-3">
                    {/* Output box with inline regenerate */}
                    <div className="relative flex items-center bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-2 font-mono text-xs text-indigo-600 dark:text-indigo-300 select-all break-all min-h-[38px] leading-tight">
                        <span className="flex-1 pr-6 truncate sm:break-all font-semibold">
                            {password || 'Generating...'}
                        </span>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            className="absolute right-1.5 p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Regenerate"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Inline Entropy Meter */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Strength</span>
                            <span className={`font-semibold ${strength.color}`}>
                                {entropy}-bit &bull; {strength.label}
                            </span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 rounded-full ${strength.bgColor}`}
                                style={{ width: `${strength.percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Length Slider (Compact) */}
                    <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Length</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{length} chars</span>
                        </div>
                        <input
                            type="range"
                            min={8}
                            max={64}
                            step={1}
                            value={length}
                            onChange={(e) => setLength(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-200 dark:bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 focus:outline-none"
                        />
                    </div>

                    {/* Character Set Demands (Compact Toggle Chips) */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Character Sets
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            {[
                                { key: 'uppercase', label: 'A-Z', title: 'Uppercase Letters' },
                                { key: 'lowercase', label: 'a-z', title: 'Lowercase Letters' },
                                { key: 'numbers', label: '0-9', title: 'Numbers' },
                                { key: 'special', label: '!@#', title: 'Enterprise Safe Symbols' },
                            ].map((item) => {
                                const active = policy[item.key as keyof PasswordGeneratorPolicy];
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => handlePolicyToggle(item.key as keyof PasswordGeneratorPolicy)}
                                        title={item.title}
                                        className={`py-1 text-[11px] font-mono font-semibold rounded-md border text-center transition-all cursor-pointer select-none ${
                                            active 
                                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-600/50 text-indigo-700 dark:text-indigo-300'
                                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Demands Presets */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                        {PRESETS.map((p, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => { setLength(p.length); setPolicy(p.policy); }}
                                className="flex-1 py-1 text-[10px] font-medium rounded border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-center"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Single Direct Insert Button */}
                    <div className="pt-1">
                        <Button
                            type="button"
                            onClick={handleInsert}
                            className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                            <span>Insert Password</span>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
