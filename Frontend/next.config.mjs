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
  trailingSlash: false, // Fixed: trailingSlash breaks SSE streams with redirects
  
  // Production build goes to Backend/public, development stays in Frontend/.next
  distDir: process.env.NODE_ENV === 'production' ? '../Backend/public' : '.next',
  
  // Ensure clean production builds
  cleanDistDir: true,
  
  // No basePath or assetPrefix needed for subdomain-based routing
  
  // Proxy API calls to backend during development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:45001/api/:path*',
        },
      ];
    }
    return [];
  },

  // Headers for better SSE support
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/stream/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
            {
              key: 'Connection',
              value: 'keep-alive',
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
