import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Las fotos de mascotas se envían por Server Action (máx. 5 MB c/u)
    serverActions: { bodySizeLimit: '6mb' },
  },
};

export default nextConfig;
