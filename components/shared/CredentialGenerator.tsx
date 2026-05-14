'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCw, Check } from 'lucide-react';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SPECIAL_CHARS = '!@#$%^*-_+=';

// Central configuration for extensibility
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

    // Secure random picker function
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

    // 3. Security Shuffling: shuffle the string so the mandatory chars aren't always at the start
    const resultArray = result.split('');
    for (let i = resultArray.length - 1; i > 0; i--) {
        const randomValues = new Uint32Array(1);
        window.crypto.getRandomValues(randomValues);
        const j = randomValues[0] % (i + 1);
        [resultArray[i], resultArray[j]] = [resultArray[j], resultArray[i]];
    }

    return resultArray.join('');
}

function calculateStrength(length: number): { label: string, color: string, percentage: number } {
    // A simple strength indicator based on length and assuming a complex character set.
    if (length < 12) return { label: 'Weak', color: 'bg-red-500', percentage: 33 };
    if (length < 16) return { label: 'Good', color: 'bg-yellow-500', percentage: 66 };
    return { label: 'Strong', color: 'bg-green-500', percentage: 100 };
}

export function CredentialGenerator() {
    const [length, setLength] = useState<number>(16);
    const [credential, setCredential] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);

    // Initial generation
    useEffect(() => {
        setCredential(generateSecureCredential(length));
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

    const strength = calculateStrength(length);

    return (
        <div className="w-full max-w-2xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col space-y-6">
                
                {/* Header */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Generate Secure Credential</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Create an enterprise-safe password instantly.
                    </p>
                </div>

                {/* Length Selector */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Length: {length}
                        </label>
                        <Input 
                            type="number" 
                            min={8} 
                            max={64} 
                            value={length}
                            onChange={(e) => handleLengthChange(parseInt(e.target.value) || 8)}
                            className="w-20 text-center"
                        />
                    </div>
                    <input 
                        type="range"
                        min={8} 
                        max={64} 
                        step={1}
                        value={length}
                        onChange={(e) => handleLengthChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                    />
                </div>

                {/* Display & Actions */}
                <div className="space-y-3">
                    <div className="flex space-x-2">
                        <Input 
                            value={credential}
                            readOnly
                            className="font-mono text-lg tracking-wider"
                        />
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={handleGenerate}
                            title="Regenerate"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                            onClick={handleCopy}
                            className="min-w-[100px]"
                        >
                            {isCopied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Strength Indicator */}
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 ${strength.color}`} 
                                style={{ width: `${strength.percentage}%` }}
                            />
                        </div>
                        <span className={`text-xs font-medium ${strength.percentage === 100 ? 'text-green-600 dark:text-green-400' : strength.percentage > 33 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                            {strength.label}
                        </span>
                    </div>
                </div>

                {/* Informational Note */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Credentials are generated locally in your browser and are never stored or transmitted. This improves trust and transparency for visitors.
                    </p>
                </div>
            </div>
        </div>
    );
}
