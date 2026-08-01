import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Proxy /api → Express when hitting Next directly (:3000).
  // On the VPS, Nginx already proxies /api; this is a safety net.
  async rewrites() {
    const internal = process.env.INTERNAL_API_ORIGIN?.replace(/\/$/, '') || 'http://127.0.0.1:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${internal}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.igdb.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      { protocol: 'https', hostname: 'cdn.cloudflare.steamstatic.com' },
      { protocol: 'https', hostname: 'shared.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'steamcdn-a.akamaihd.net' },
    ],
    // Serve large enough assets for desktop + Retina
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    // Required by Next 15+ when using non-default Image quality values
    qualities: [75, 85, 90],
  },
};

export default nextConfig;
