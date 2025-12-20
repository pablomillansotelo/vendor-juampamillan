import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        search: '/**'
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      }
    ], 
  },
  transpilePackages: ['yaml', 'redoc'],
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Transpilar módulos ES6 de yaml y redoc
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Configurar para manejar módulos ES6
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules[\\/](yaml|redoc)/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

export default nextConfig;
