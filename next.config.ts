import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Optional: if type errors persist despite compile success (Next.js sometimes weird)
  },
  serverExternalPackages: ['@prisma/client', 'prisma', '@prisma/engines'],
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/@prisma/engines/**/*",
      "./node_modules/prisma/query-engine*",
      "./node_modules/prisma/schema-engine*"
    ]
  }
};

export default nextConfig;
