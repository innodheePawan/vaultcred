'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCw, Check, KeyRound, Minus, ShieldCheck } from 'lucide-react';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SPECIAL_CHARS = '!@#$%^*-_+=';

export const GENERATOR_RULES = {
    uppercase: UPPERCASE_CHARS,
    lowercase: LOWERCASE_CHARS,
    numbers: NUMBER_CHARS,
    special: SPECIAL_CHARS,
};

function generateSecureCredential(length: number): string {
    const allSets = [
        GENERATOR_RULES.uppercase,
        GENERATOR_RULES.lowercase,
        GENERATOR_RULES.numbers,
        GENERATOR_RULES.special,
    ];

    let result = '';

    const pickRandomChar = (charset: string) => {
        const randomValues = new Uint32Array(1);
        window.crypto.getRandomValues(randomValues);
        return charset[randomValues[0] % charset.length];
    };

    // 1. Mandatory inclusion: 1 char from each set
    for (const charset of allSets) {
        result += pickRandomChar(charset);
    }

    // 2. Fill the rest randomly from all combined characters
    const allChars = allSets.join('');
    for (let i = result.length; i < length; i++) {
        result += pickRandomChar(allChars);
    }

    // 3. Security Shuffling
    const resultArray = result.split('');
    for (let i = resultArray.length - 1; i > 0; i--) {
        const randomValues = new Uint32Array(1);
        window.crypto.getRandomValues(randomValues);
        const j = randomValues[0] % (i + 1);
        [resultArray[i], resultArray[j]] = [resultArray[j], resultArray[i]];
    }

    return resultArray.join('');
}

export function FloatingCredentialWidget() {
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [length, setLength] = useState<number>(16);
    const [credential, setCredential] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);
    
    // Random animation states
    const [headerAnim, setHeaderAnim] = useState('animate-[pulse_2s_ease-in-out_infinite]');
    const [btnFloatAnim, setBtnFloatAnim] = useState('animate-bounce');
    const [shieldAnim, setShieldAnim] = useState('animate-[spin_4s_linear_infinite]');

    // Initial auto-generation
    useEffect(() => {
        setCredential(generateSecureCredential(length));
        
        // Pick random motions on load to keep it fresh
        const headerAnims = [
            'animate-[pulse_2s_ease-in-out_infinite]',
            'animate-[spin_4s_linear_infinite]',
            'animate-[bounce_3s_infinite]',
        ];
        const floatAnims = [
            'animate-bounce', // Standard up/down
            '[animation:float-horizontal_4s_ease-in-out_infinite]', // Left to right
            '[animation:float-circular_5s_linear_infinite]', // Circular
            '[animation:float-star_6s_ease-in-out_infinite]', // Star/Random line
            '[animation:float-diagonal_4s_ease-in-out_infinite]', // Diagonal
            '[animation:float-figure8_5s_ease-in-out_infinite]' // Figure 8
        ];
        const internalAnims = [
            'animate-[pulse_2s_ease-in-out_infinite]',
            'animate-[spin_4s_linear_infinite]',
            'animate-[spin_3s_linear_reverse_infinite]',
        ];
        setHeaderAnim(headerAnims[Math.floor(Math.random() * headerAnims.length)]);
        setBtnFloatAnim(floatAnims[Math.floor(Math.random() * floatAnims.length)]);
        setShieldAnim(internalAnims[Math.floor(Math.random() * internalAnims.length)]);
    }, []);

    const handleGenerate = useCallback(() => {
        setCredential(generateSecureCredential(length));
        setIsCopied(false);
    }, [length]);

    const handleCopy = async () => {
        if (!credential) return;
        try {
            await navigator.clipboard.writeText(credential);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
            alert("Failed to copy to clipboard.");
        }
    };

    const handleLengthChange = (newLength: number) => {
        const val = Math.max(8, Math.min(64, newLength));
        setLength(val);
        setCredential(generateSecureCredential(val));
        setIsCopied(false);
    };

    if (isMinimized) {
        return (
            <>
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes float-horizontal {
                        0%, 100% { transform: translateX(0); }
                        50% { transform: translateX(-20px); }
                    }
                    @keyframes float-circular {
                        0% { transform: rotate(0deg) translateX(15px) rotate(0deg); }
                        100% { transform: rotate(360deg) translateX(15px) rotate(-360deg); }
                    }
                    @keyframes float-star {
                        0%, 100% { transform: translate(0, 0); }
                        20% { transform: translate(-20px, -15px); }
                        40% { transform: translate(10px, -25px); }
                        60% { transform: translate(20px, 10px); }
                        80% { transform: translate(-10px, 20px); }
                    }
                    @keyframes float-diagonal {
                        0%, 100% { transform: translate(0, 0); }
                        50% { transform: translate(-20px, -20px); }
                    }
                    @keyframes float-figure8 {
                        0%, 100% { transform: translate(0, 0); }
                        25% { transform: translate(-20px, -15px); }
                        50% { transform: translate(0, -30px); }
                        75% { transform: translate(20px, -15px); }
                    }
                `}} />
                <div className={`fixed bottom-6 right-10 z-50 ${btnFloatAnim}`}>
                <Button
                    onClick={() => setIsMinimized(false)}
                    className="h-14 w-14 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 hover:scale-110 flex items-center justify-center"
                    title="Open Security Utility"
                >
                    <ShieldCheck className={`w-6 h-6 ${shieldAnim}`} />
                </Button>
            </div>
            </>
        );
    }

    return (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-10 z-50 w-full sm:w-80 transition-all duration-300 animate-in slide-in-from-bottom-5">
            <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-indigo-400/50 rounded-full blur-[6px] animate-pulse"></div>
                            <KeyRound className={`w-4 h-4 text-indigo-300 relative z-10 ${headerAnim}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-100">Password Generator</h3>
                    </div>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                        title="Minimize"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-4">
                    {/* Display & Actions */}
                    <div className="space-y-2">
                        <div className="flex space-x-2">
                            <Input
                                value={credential}
                                readOnly
                                className="font-mono text-sm tracking-wider bg-slate-900 border-slate-700 text-emerald-400 focus-visible:ring-0"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleGenerate}
                                className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white shrink-0"
                                title="Regenerate"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            onClick={handleCopy}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20"
                        >
                            {isCopied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied to Clipboard
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Password
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Length Selector */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-400">
                                Length: {length}
                            </label>
                            <Input
                                type="number"
                                min={8}
                                max={64}
                                value={length}
                                onChange={(e) => handleLengthChange(parseInt(e.target.value) || 8)}
                                className="w-16 h-7 text-xs text-center bg-slate-900 border-slate-700 focus-visible:ring-1"
                            />
                        </div>
                        <input
                            type="range"
                            min={8}
                            max={64}
                            step={1}
                            value={length}
                            onChange={(e) => handleLengthChange(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                        />
                    </div>

                </div>

                {/* Informational Note */}
                <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800">
                    <p className="text-[10px] leading-relaxed text-slate-500 text-center">
                        Credentials are generated locally in your browser and are never stored or transmitted.
                    </p>
                </div>
            </div>
        </div>
    );
}
