
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSystemSettings } from "@/lib/actions/settings";
import { LayoutProvider } from "@/components/layout/LayoutContext";

export default async function PublicShareLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let settings;
    try {
        settings = await getSystemSettings();
    } catch (e) {
        settings = { applicationName: 'CRED Secure', logoUrl: null };
    }

    return (
        <LayoutProvider>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <Header settings={settings} publicView={true} />
                <main className="flex-1 flex flex-col items-center justify-center w-full">
                    {children}
                </main>
                <Footer />
            </div>
        </LayoutProvider>
    );
}
