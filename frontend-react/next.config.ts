import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  /* config options here */
  async rewrites() {
    // Dynamic backend URL based on environment
    // Use 'report-system:3001' in Docker/Production, 'localhost:3001' for local dev
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/medusa/:path*',
        destination: 'https://api.laapak.com/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
