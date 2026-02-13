'use client';

import { CheckCircle } from 'lucide-react';

interface SecurityChallengeProps {
    verified: boolean;
    onVerify: (verified: boolean) => void;
}

export function SecurityChallenge({ verified, onVerify }: SecurityChallengeProps) {
    return (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                Security Challenge
            </label>
            <div
                onClick={() => onVerify(true)}
                className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${verified
                    ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                    : 'bg-gray-50 border-gray-200 hover:border-indigo-400 dark:bg-gray-800 dark:border-gray-700'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${verified ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                        }`}>
                        {verified && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        I am not a robot
                    </span>
                </div>
                <div className="text-xs text-gray-400 font-mono tracking-tight uppercase">Security Check</div>
            </div>
            {verified && (
                <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verification successful
                </p>
            )}
        </div>
    );
}
