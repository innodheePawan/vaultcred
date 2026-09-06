import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://getcredsecure.com";

  // Stable, accurate modification dates for release content
  // Prevents sitemap lastmod from changing on every HTTP request
  const SITE_RELEASE_DATE = new Date("2026-09-06T10:00:00.000Z");
  const LEGAL_UPDATE_DATE = new Date("2026-09-06T10:00:00.000Z");

  const routes: Array<{
    path: string;
    lastModified: Date;
    changeFrequency: "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "", lastModified: SITE_RELEASE_DATE, changeFrequency: "weekly", priority: 1.0 },
    { path: "/platform", lastModified: SITE_RELEASE_DATE, changeFrequency: "monthly", priority: 0.8 },
    { path: "/features", lastModified: SITE_RELEASE_DATE, changeFrequency: "monthly", priority: 0.8 },
    { path: "/use-cases", lastModified: SITE_RELEASE_DATE, changeFrequency: "monthly", priority: 0.8 },
    { path: "/security", lastModified: SITE_RELEASE_DATE, changeFrequency: "monthly", priority: 0.8 },
    { path: "/contact-us", lastModified: SITE_RELEASE_DATE, changeFrequency: "monthly", priority: 0.8 },
    { path: "/request-demo", lastModified: SITE_RELEASE_DATE, changeFrequency: "monthly", priority: 0.8 },
    { path: "/privacy", lastModified: LEGAL_UPDATE_DATE, changeFrequency: "monthly", priority: 0.5 },
    { path: "/terms", lastModified: LEGAL_UPDATE_DATE, changeFrequency: "monthly", priority: 0.5 },
    { path: "/cookies", lastModified: LEGAL_UPDATE_DATE, changeFrequency: "monthly", priority: 0.5 },
    { path: "/data-protection", lastModified: LEGAL_UPDATE_DATE, changeFrequency: "monthly", priority: 0.5 },
    { path: "/responsible-disclosure", lastModified: LEGAL_UPDATE_DATE, changeFrequency: "monthly", priority: 0.5 },
    { path: "/subprocessors", lastModified: LEGAL_UPDATE_DATE, changeFrequency: "monthly", priority: 0.5 },
    { path: "/dpa", lastModified: LEGAL_UPDATE_DATE, changeFrequency: "monthly", priority: 0.5 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

