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
  // Enable PWA
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;