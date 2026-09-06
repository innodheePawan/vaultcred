import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://getcredsecure.com";
  const lastModified = new Date();

  const routes = [
    "",
    "/platform",
    "/features",
    "/use-cases",
    "/security",
    "/contact-us",
    "/request-demo",
    "/privacy",
    "/terms",
    "/cookies",
    "/data-protection",
    "/responsible-disclosure",
    "/subprocessors",
    "/dpa",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : route.startsWith("/privacy") || route.startsWith("/terms") ? 0.5 : 0.8,
  }));
}
