import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";

import { SessionTimeout } from "@/components/layout/SessionTimeout";

import { Suspense } from 'react';

import { getSystemSettings } from "@/lib/actions/settings";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getSystemSettings();

    return (
        <>
            <SessionTimeout timeoutMs={600000} />
            <Header settings={settings} />
            <div className="flex flex-1 overflow-hidden">
                <Suspense fallback={<div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" />}>
                    <Sidebar />
                </Suspense>
                <div className="flex flex-1 flex-col flex- overflow-hidden">
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
