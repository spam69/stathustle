
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.giphy.com', // For Giphy GIFs
      },
      {
        protocol: 'https',
        hostname: 'media0.giphy.com',
      },
      {
        protocol: 'https',
        hostname: 'media1.giphy.com',
      },
      {
        protocol: 'https',
        hostname: 'media2.giphy.com',
      },
      {
        protocol: 'https',
        hostname: 'media3.giphy.com',
      },
      {
        protocol: 'https',
        hostname: 'media4.giphy.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-5756768f216748b3980d8362b0586f74.r2.dev', 
        pathname: '/**', // Allows /stathustle/*
      },
      {
        protocol: 'https',
        hostname: 'cdn.stathustle.com', // New custom domain for R2
        pathname: '/**', // Allows /stathustle/* or other paths if your custom domain maps directly
      }
    ],
  },
};

export default nextConfig;
