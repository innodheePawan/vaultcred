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
  metadataBase: new URL("https://getcredsecure.com"),
  title: {
    default: "CredSecure | Operational Credential Governance Platform",
    template: "%s | CredSecure",
  },
  description:
    "Secure, govern, and trace enterprise credentials, service accounts, API tokens, and security materials across SAP, BTP Integration Suite, middleware, and business applications. Built by Innodhee Services.",
  keywords: [
    "SAP credential governance",
    "service account governance",
    "operational credential security",
    "API credential governance",
    "privileged access governance",
    "audit traceability platform",
    "BTP Integration Suite credential governance",
  ],
  openGraph: {
    siteName: "CredSecure",
    type: "website",
    images: [
      {
        url: "https://getcredsecure.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "CredSecure — Operational Credential Governance Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://getcredsecure.com/og-image.png"],
  },
};

import { auth } from "@/lib/auth";
import { SessionTimeout } from "@/components/layout/SessionTimeout";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://getcredsecure.com/#organization",
      "name": "Innodhee Services Pvt. Ltd.",
      "url": "https://innodhee.com/",
      "brand": {
        "@type": "Brand",
        "name": "CredSecure",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://getcredsecure.com/#website",
      "url": "https://getcredsecure.com/",
      "name": "CredSecure",
      "publisher": {
        "@id": "https://getcredsecure.com/#organization",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://getcredsecure.com/#software",
      "name": "CredSecure",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "Credential Governance and Security Software",
      "operatingSystem": "Web-based enterprise platform",
      "description":
        "CredSecure is an enterprise credential governance platform for securely governing, controlling, tracing, and provisioning credentials, service accounts, API tokens, certificates, keys, and security materials across SAP landscapes, BTP Integration Suite, middleware, and business applications.",
      "provider": {
        "@id": "https://getcredsecure.com/#organization",
      },
      "url": "https://getcredsecure.com/",
      "audience": {
        "@type": "BusinessAudience",
        "audienceType": "Enterprise IT, Security, SAP, Integration, and Operations Teams",
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex flex-col`}
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
