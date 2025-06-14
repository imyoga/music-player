/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Static export for production builds only
  output: 'export',
  trailingSlash: true,
  
  // Production build goes to Backend/public, development stays in Frontend/.next
  distDir: process.env.NODE_ENV === 'production' ? '../Backend/public' : '.next',
  
  // Ensure clean production builds
  cleanDistDir: true,
  
  // Set basePath and assetPrefix only for production
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/home-sync-radio',
    assetPrefix: '/home-sync-radio',
  }),
};

export default nextConfig;
