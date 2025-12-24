/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'metaforge.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.metaforge.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.metaforge.app',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
