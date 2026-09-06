import type { Metadata } from "next";

interface ConstructMetadataProps {
  title?: string;
  description?: string;
  path: string;
  noIndex?: boolean;
}

export function isUatEnvironment(): boolean {
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV || "").toLowerCase().trim();
  if (appEnv === "production" || appEnv === "prod") {
    return false;
  }

  if (appEnv === "uat" || appEnv === "staging") {
    return true;
  }

  const isUatFlag = (process.env.NEXT_PUBLIC_IS_UAT || process.env.IS_UAT || "").toLowerCase().trim();
  if (isUatFlag === "true" || isUatFlag === "1") {
    return true;
  }

  const awsBranch = (process.env.AWS_BRANCH || "").toLowerCase().trim();
  if (awsBranch === "uat" || awsBranch === "credsecure-uat" || awsBranch === "staging") {
    return true;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").toLowerCase().trim();
  if (siteUrl.includes("amplifyapp.com") || (siteUrl.includes("uat") && !siteUrl.includes("getcredsecure.com"))) {
    return true;
  }

  return false;
}

export function constructMetadata({
  title,
  description,
  path,
  noIndex = false,
}: ConstructMetadataProps): Metadata {
  const defaultTitle = "CredSecure | Operational Credential Governance Platform";
  const defaultDescription =
    "Secure, govern, and trace enterprise credentials, service accounts, API tokens, and security materials across SAP, BTP Integration Suite, middleware, and business applications. Built by Innodhee Services.";

  const fullTitle = title ? `${title} | CredSecure` : defaultTitle;
  const metaDescription = description || defaultDescription;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const isUat = isUatEnvironment();
  const shouldNoIndex = noIndex || isUat;

  return {
    title: title || { absolute: defaultTitle },
    description: metaDescription,
    alternates: {
      canonical: normalizedPath,
    },
    openGraph: {
      title: fullTitle,
      description: metaDescription,
      url: normalizedPath,
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
      title: fullTitle,
      description: metaDescription,
      images: ["https://getcredsecure.com/og-image.png"],
    },
    ...(shouldNoIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

