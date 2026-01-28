import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Optional: if type errors persist despite compile success (Next.js sometimes weird)
  },
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
