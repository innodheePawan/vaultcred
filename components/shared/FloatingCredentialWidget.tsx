'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Check, KeyRound, Minus, ChevronUp, Sliders, Shield } from 'lucide-react';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SPECIAL_CHARS = '!@#$%^*-_+=';

function generateSecureCredential(
    length: number,
    uppercase: boolean,
    lowercase: boolean,
    numbers: boolean,
    special: boolean
): string {
    let charPool = '';
    const mandatoryChars: string[] = [];

    const pickRandomChar = (charset: string) => {
        const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
        if (cryptoObj) {
            const randomValues = new Uint32Array(1);
            cryptoObj.getRandomValues(randomValues);
            return charset[randomValues[0] % charset.length];
        }
        return charset[Math.floor(Math.random() * charset.length)];
    };

    if (uppercase) {
        charPool += UPPERCASE_CHARS;
        mandatoryChars.push(pickRandomChar(UPPERCASE_CHARS));
    }
    if (lowercase) {
        charPool += LOWERCASE_CHARS;
        mandatoryChars.push(pickRandomChar(LOWERCASE_CHARS));
    }
    if (numbers) {
        charPool += NUMBER_CHARS;
        mandatoryChars.push(pickRandomChar(NUMBER_CHARS));
    }
    if (special) {
        charPool += SPECIAL_CHARS;
        mandatoryChars.push(pickRandomChar(SPECIAL_CHARS));
    }

    if (charPool.length === 0) return '';

    let result = '';
    // Add mandatory characters first to guarantee presence
    for (const char of mandatoryChars) {
        result += char;
    }

    // Fill remaining length
    for (let i = result.length; i < length; i++) {
        result += pickRandomChar(charPool);
    }

    // Shuffle the result securely
    const resultArray = result.split('');
    for (let i = resultArray.length - 1; i > 0; i--) {
        const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
        let j = 0;
        if (cryptoObj) {
            const randomValues = new Uint32Array(1);
            cryptoObj.getRandomValues(randomValues);
            j = randomValues[0] % (i + 1);
        } else {
            j = Math.floor(Math.random() * (i + 1));
        }
        [resultArray[i], resultArray[j]] = [resultArray[j], resultArray[i]];
    }

    return resultArray.join('');
}

export function FloatingCredentialWidget() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [length, setLength] = useState<number>(16);
    const [credential, setCredential] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);

    // Policy Toggles
    const [policy, setPolicy] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        special: true,
    });

    // Mobile scroll lock when widget is open
    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isOpen) {
                document.body.classList.add('overflow-hidden', 'sm:overflow-auto');
            } else {
                document.body.classList.remove('overflow-hidden', 'sm:overflow-auto');
            }
        }
        return () => {
            if (typeof document !== 'undefined') {
                document.body.classList.remove('overflow-hidden', 'sm:overflow-auto');
            }
        };
    }, [isOpen]);

    // Ensure at least one policy is active
    const handlePolicyToggle = (key: keyof typeof policy) => {
        setPolicy((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            const activeCount = Object.values(next).filter(Boolean).length;
            if (activeCount === 0) return prev; // prevent unchecking last active toggle
            return next;
        });
    };

    // Callback to generate credential based on current rules
    const handleGenerate = useCallback(() => {
        const value = generateSecureCredential(
            length,
            policy.uppercase,
            policy.lowercase,
            policy.numbers,
            policy.special
        );
        setCredential(value);
        setIsCopied(false);
    }, [length, policy]);

    // Initial auto-generation
    useEffect(() => {
        handleGenerate();
    }, [handleGenerate]);

    const handleCopy = async () => {
        if (!credential) return;
        try {
            await navigator.clipboard.writeText(credential);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
        }
    };

    // Calculate Entropy
    const entropy = useMemo(() => {
        let poolSize = 0;
        if (policy.uppercase) poolSize += 26;
        if (policy.lowercase) poolSize += 26;
        if (policy.numbers) poolSize += 10;
        if (policy.special) poolSize += SPECIAL_CHARS.length; // 11

        if (poolSize === 0) return 0;
        return Math.round(length * Math.log2(poolSize));
    }, [length, policy]);

    // Derived classification and visual styling for strength
    const strength = useMemo(() => {
        if (entropy < 60) return { label: 'Low' };
        if (entropy < 85) return { label: 'Medium' };
        if (entropy < 110) return { label: 'Strong' };
        return { label: 'Enterprise' };
    }, [entropy]);

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#090d16] hover:bg-[#0f172a] text-slate-300 hover:text-white border border-white/10 hover:border-white/20 shadow-md transition-all font-sans text-xs font-medium cursor-pointer"
                >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Credential Utility</span>
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Backdrop overlay for mobile */}
            <div 
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] sm:hidden transition-opacity duration-150 animate-in fade-in-0"
                onClick={() => setIsOpen(false)}
            />

            <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-80 border-t sm:border border-white/10 bg-[#090d16] sm:rounded-xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-slate-200 transition-all duration-150 ease-out animate-in fade-in-0 slide-in-from-bottom-6 sm:slide-in-from-bottom-2">
                {/* Mobile Drag Indicator */}
                <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                        <div>
                            <h3 className="text-[11px] font-bold text-white tracking-wider uppercase">Credential Utility</h3>
                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wide">Generate Scoped Secret Payload</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                        title="Minimize"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {/* Generated Output */}
                    <div className="space-y-2">
                        <div className="relative flex items-center bg-black/40 border border-white/10 rounded-lg p-2.5 font-mono text-[12px] text-indigo-300 select-all overflow-x-auto break-all min-h-[42px] leading-relaxed">
                            {credential}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleCopy}
                                className="flex-1 h-8 bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy to Clipboard</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleGenerate}
                                className="h-8 w-8 bg-transparent border-white/10 hover:bg-white/[0.04] text-slate-400 hover:text-white shrink-0 cursor-pointer"
                                title="Regenerate"
                            >
                                <RefreshCw className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Muted Entropy Monospace Text */}
                    <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Entropy Signature</span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {entropy}-bit &bull; {strength.label}
                        </span>
                    </div>

                    {/* Length Slider */}
                    <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Bit Depth Length</span>
                            <span className="font-mono font-bold text-indigo-400">{length} chars</span>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="range"
                                min={8}
                                max={64}
                                step={1}
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="flex-1 h-1 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Policies Checklist */}
                    <div className="space-y-2 pt-2.5 border-t border-white/5">
                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Policy Enforcements</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {[
                                { label: 'Uppercase [A-Z]', key: 'uppercase' },
                                { label: 'Lowercase [a-z]', key: 'lowercase' },
                                { label: 'Numbers [0-9]', key: 'numbers' },
                                { label: 'Special [!@#$]', key: 'special' },
                            ].map((item) => (
                                <label
                                    key={item.key}
                                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer select-none"
                                >
                                    <input
                                        type="checkbox"
                                        checked={policy[item.key as keyof typeof policy]}
                                        onChange={() => handlePolicyToggle(item.key as keyof typeof policy)}
                                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/[0.02] text-indigo-600 focus:ring-0 focus:ring-offset-0 accent-indigo-500 cursor-pointer"
                                    />
                                    <span className="text-[11px]">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.01] text-center">
                    <span className="text-[9px] font-mono text-slate-600 tracking-wider uppercase">
                        Runtime-generated &bull; Never stored
                    </span>
                </div>
            </div>
        </>
    );
}

