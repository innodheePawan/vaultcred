"use client";

import React, { useMemo } from 'react';
import { AlertTriangle, Clock, Activity, ShieldAlert } from 'lucide-react';

type LicenseWarningBannerProps = {
    licenseInfo: any;
};

export function LicenseWarningBanner({ licenseInfo }: LicenseWarningBannerProps): React.ReactElement | null {
    const bannerConfig = useMemo(() => {
        if (!licenseInfo || !licenseInfo.validityTill) return null;

        const nowUtc = new Date();
        const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));

        const validityDate = new Date(licenseInfo.validityTill);
        const validityUtc = new Date(Date.UTC(validityDate.getUTCFullYear(), validityDate.getUTCMonth(), validityDate.getUTCDate()));

        const graceEndStr = licenseInfo.graceEnd;
        const graceEndDate = graceEndStr ? new Date(graceEndStr) : validityUtc;
        const graceEndUtc = new Date(Date.UTC(graceEndDate.getUTCFullYear(), graceEndDate.getUTCMonth(), graceEndDate.getUTCDate()));

        // Check if inside GRACE period
        if (licenseInfo.state === 'GRACE') {
            const msDiff = graceEndUtc.getTime() - todayUtc.getTime();
            const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

            return {
                type: 'GRACE',
                days: daysRemaining,
                message: `LICENSE EXPIRED. You are in a grace period. The system will lock in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
                bgClass: 'bg-red-50 dark:bg-red-900/50',
                borderClass: 'border-red-500',
                textClass: 'text-red-700 dark:text-red-200',
                icon: <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            };
        }

        // Check PRE-EXPIRY Warning if state is VALID
        if (licenseInfo.state === 'VALID') {
            const msDiff = validityUtc.getTime() - todayUtc.getTime();
            const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

            if (daysRemaining <= 15) {
                return {
                    type: 'PRE_EXPIRY',
                    days: daysRemaining,
                    message: `Your license will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Please renew to avoid interruption.`,
                    bgClass: 'bg-amber-50 dark:bg-amber-900/50',
                    borderClass: 'border-amber-500',
                    textClass: 'text-amber-800 dark:text-amber-200',
                    icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                };
            }
        }

        return null;
    }, [licenseInfo]);

    if (!bannerConfig) return null;

    return (
        <div className={`w-full border-b ${bannerConfig.borderClass} ${bannerConfig.bgClass} px-4 py-3 flex items-center justify-center gap-3 relative z-50`}>
            {bannerConfig.icon}
            <span className={`text-sm font-semibold ${bannerConfig.textClass}`}>
                {bannerConfig.message}
            </span>
            <a href="/activation" className="px-3 py-1 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 rounded text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Renew Now
            </a>
        </div>
    );
}
