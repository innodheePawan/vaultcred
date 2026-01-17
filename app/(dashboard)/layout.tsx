import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";

import { SessionTimeout } from "@/components/layout/SessionTimeout";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SessionTimeout timeoutMs={600000} />
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
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
