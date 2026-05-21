import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CredSecure | Operational Credential Governance Platform",
  description: "Govern enterprise credentials with visibility, traceability, and control across SAP landscapes, integration platforms, service accounts, and operational workflows.",
  keywords: ["SAP credential governance", "service account governance", "operational credential security", "API credential governance", "privileged access governance", "audit traceability platform"],
};

import { auth } from "@/lib/auth";
import { SessionTimeout } from "@/components/layout/SessionTimeout";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="h-full">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col`}
      >
        <Providers session={session}>
          <Suspense fallback={null}>
            <SessionTimeout timeoutMs={900000} />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
