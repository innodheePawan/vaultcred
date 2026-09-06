'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldCheck, Check, X } from 'lucide-react';

interface MathCaptchaProps {
    onValidate: (isValid: boolean) => void;
    resetKey?: number;
}

export function MathCaptcha({ onValidate, resetKey = 0 }: MathCaptchaProps) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const generateCaptcha = useCallback(() => {
        const n1 = Math.floor(Math.random() * 9) + 1;
        const n2 = Math.floor(Math.random() * 9) + 1;
        setNum1(n1);
        setNum2(n2);
        setUserAnswer('');
        setIsValid(false);
        onValidate(false);
    }, [onValidate]);

    useEffect(() => {
        setIsMounted(true);
        generateCaptcha();
    }, [resetKey, generateCaptcha]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUserAnswer(val);
        const parsed = parseInt(val.trim(), 10);
        const valid = !isNaN(parsed) && parsed === num1 + num2;
        setIsValid(valid);
        onValidate(valid);
    };

    if (!isMounted) {
        return (
            <div className="h-20 p-3.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] animate-pulse" />
        );
    }

    return (
        <div className="space-y-2 p-3.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Security Verification *
                </label>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    {isValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Validated
                        </span>
                    ) : (
                        'Solve problem to enable submit'
                    )}
                </span>
            </div>

            <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-900 dark:text-white select-none shrink-0 shadow-xs">
                    <span>What is {num1} + {num2} ?</span>
                    <button
                        type="button"
                        onClick={generateCaptcha}
                        title="Generate new challenge"
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="relative flex-1">
                    <input
                        type="number"
                        required
                        value={userAnswer}
                        onChange={handleChange}
                        placeholder="Your answer"
                        className={`w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-950 border text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors ${
                            userAnswer === ''
                                ? 'border-slate-200 dark:border-white/[0.08] focus:border-blue-600 dark:focus:border-blue-500/40'
                                : isValid
                                ? 'border-emerald-500 dark:border-emerald-500/60 ring-1 ring-emerald-500/20'
                                : 'border-rose-400 dark:border-rose-500/60 ring-1 ring-rose-500/20'
                        }`}
                    />
                    {userAnswer !== '' && (
                        <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                            {isValid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                                <X className="w-3.5 h-3.5 text-rose-400" />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
