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
  /* config options here */
  async rewrites() {
    // Use environment variable for backend URL
    // In production: http://82.112.253.29:3001
    // In local Docker: http://report-system:3001
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://report-system:3001';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
