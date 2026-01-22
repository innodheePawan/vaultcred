import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { getUserAccessContext, canAccess } from "@/lib/iam/permissions";

import { SessionTimeout } from "@/components/layout/SessionTimeout";

import { Suspense } from 'react';

import { getSystemSettings } from "@/lib/actions/settings";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getSystemSettings();
    const session = await auth();

    let showSettings = false;
    let showAdminMenu = false;

    if (session?.user?.id) {
        try {
            const ctx = await getUserAccessContext(session.user.id);
            // Settings: Strictly Super Admin
            showSettings = ctx.isAdmin;
            // Admin Menu: Super Admin OR Scoped Admin OR Auditor
            showAdminMenu = ctx.isAdmin || canAccess(ctx, null, null, 'ADMIN') || canAccess(ctx, null, null, 'AUDIT');
        } catch (e) {
            // User might be invalid or DB issue
            console.error("Failed to load access context:", e);
        }
    }

    return (
        <>
            <SessionTimeout timeoutMs={600000} />
            <Header settings={settings} />
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
                        <div className="min-h-full">
                            {children}
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>
        </>
    );
}
