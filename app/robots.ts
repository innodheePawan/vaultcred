import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard$",
        "/dashboard/",
        "/dashboard?",
        "/credentials$",
        "/credentials/",
        "/credentials?",
        "/settings$",
        "/settings/",
        "/settings?",
        "/api$",
        "/api/",
        "/api?",
        "/setup$",
        "/setup/",
        "/setup?",
        "/debug-env$",
        "/debug-env/",
        "/debug-env?",
        "/env-value$",
        "/env-value/",
        "/env-value?",
      ],
    },
    sitemap: "https://getcredsecure.com/sitemap.xml",
  };
}
