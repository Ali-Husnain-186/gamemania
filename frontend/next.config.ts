import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Default Next server output so `next start` works with PM2 on the VPS.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
