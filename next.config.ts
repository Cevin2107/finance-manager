import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Tắt ESLint check khi build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Tắt TypeScript check khi build (optional)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;