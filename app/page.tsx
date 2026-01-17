
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                    Universal Credential Vault
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                    Secure, enterprise-grade credential management for your organization.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link href="/login">
                        <Button size="lg">Sign In</Button>
                    </Link>

                </div>
            </div>
        </div>
    );
}
