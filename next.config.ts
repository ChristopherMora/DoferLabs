import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para Docker y producción
  output: 'standalone',
  
  // Optimizaciones
  reactStrictMode: true,
  
  // Imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'makerhub.dofer.com.mx',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ]
  },
};

export default nextConfig;
