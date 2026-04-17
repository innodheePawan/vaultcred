import { Loader2 } from 'lucide-react';

export default function SettingsLoading() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] w-full h-full space-y-4 animate-in fade-in duration-500">
            <div className="relative">
                {/* Outer glowing ring */}
                <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 dark:bg-blue-500/10 animate-pulse" />
                {/* Spinning loader */}
                <Loader2 className="relative h-10 w-10 text-blue-600 dark:text-blue-500 animate-spin" />
            </div>
            
            <div className="flex flex-col items-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                    Loading Settings Configuration...
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Fetching secure parameters.
                </p>
            </div>
            
            {/* Minimalist progress bar skeleton */}
            <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mt-6 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-1/2 animate-[pulse_1s_ease-in-out_infinite]" />
            </div>
        </div>
    );
}
