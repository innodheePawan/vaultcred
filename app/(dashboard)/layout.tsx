import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { getUserAccessContext, canAccess } from "@/lib/iam/permissions";

import { SessionTimeout } from "@/components/layout/SessionTimeout";

import { Suspense } from 'react';

import { getSystemSettings } from "@/lib/actions/settings";
import { prisma } from "@/lib/prisma"; // Added prisma to fetch user directly
import { LayoutProvider } from "@/components/layout/LayoutContext";
import { getLicenseState } from "@/lib/license-enforcement";
import { LicenseWarningBanner } from "@/components/layout/LicenseWarningBanner";
import { redirect } from 'next/navigation';


export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let settings;
    try {
        settings = await getSystemSettings();
    } catch (e) {
        settings = { applicationName: 'CredSecure', logoUrl: null };
    }
    const session = await auth();

    let currentUser = null;
    if (process.env.DATABASE_URL && session?.user?.id) {
        try {
            currentUser = await prisma.user.findUnique({
                where: { id: session.user.id }
            });
        } catch (e) {
            // Silently swallow fetch failure on dashboard layout if DB is unreachable
        }
    }

    let showSettings = false;
    let showAdminMenu = false;

    if (process.env.DATABASE_URL && session?.user?.id) {
        try {
            const ctx = await getUserAccessContext(session.user.id);
            // Settings: Strictly Super Admin
            showSettings = ctx.role === 'ADMIN';
            // Admin Menu: Super Admin OR Scoped Admin OR Auditor
            showAdminMenu = ctx.role === 'ADMIN' || canAccess(ctx, null, null, 'ADMIN') || canAccess(ctx, null, null, 'AUDIT');
        } catch (e) {
            // User might be invalid or DB issue
            console.error("Failed to load access context:", e);
        }
    }
    let licenseInfo = null;
    try {
        licenseInfo = await getLicenseState();

        // Robust Node.js Server-Side Enforcement (bypassing Edge middleware network issues)
        if (licenseInfo?.state === 'UNACTIVATED' || licenseInfo?.state === 'COMPROMISED') {
            redirect('/activation');
        }

        if (licenseInfo?.state === 'LOCKED') {
            const isSuperUser = session?.user?.role === 'SUPERUSER';
            if (!isSuperUser) {
                redirect('/activation');
            }
        }
    } catch (e) {
        // Fallback for missing DB
    }

    return (
        <LayoutProvider>
            <SessionTimeout />
            <div className="h-screen flex flex-col overflow-hidden">
                <LicenseWarningBanner licenseInfo={licenseInfo} />
                {/* Pass currentUser which contains profileImage */}
                <Header settings={settings} user={currentUser} />
                <div className="flex flex-1 overflow-hidden">
                    <Suspense fallback={<div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" />}>
                        <Sidebar
                            role={session?.user?.role}
                            showSettings={showSettings}
                            showAdminMenu={showAdminMenu}
                        />
                    </Suspense>
                    <div className="flex flex-1 flex-col overflow-hidden relative z-0">
                        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                            {children}
                        </main>
                        <Footer />
                    </div>
                </div>
            </div>
        </LayoutProvider>
    );
}
