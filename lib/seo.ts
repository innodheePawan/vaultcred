import type { Metadata } from "next";

interface ConstructMetadataProps {
  title?: string;
  description?: string;
  path: string;
  noIndex?: boolean;
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

  const isUatEnv =
    process.env.NEXT_PUBLIC_APP_ENV === "uat" ||
    process.env.APP_ENV === "uat" ||
    process.env.NEXT_PUBLIC_IS_UAT === "true" ||
    process.env.IS_UAT === "true" ||
    process.env.AWS_BRANCH === "uat" ||
    process.env.AWS_BRANCH === "credsecure-uat" ||
    (typeof process.env.NEXT_PUBLIC_SITE_URL === "string" &&
      (process.env.NEXT_PUBLIC_SITE_URL.includes("amplifyapp.com") ||
        process.env.NEXT_PUBLIC_SITE_URL.includes("uat")));

  const shouldNoIndex = noIndex || isUatEnv;

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
