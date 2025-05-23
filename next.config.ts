// next.config.ts - REEMPLAZAR TODO EL CONTENIDO
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com', 
    ],
  },
  
  // ✅ CONFIGURACIÓN CRÍTICA PARA EVITAR CANVAS
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // ✅ IGNORAR COMPLETAMENTE canvas y pdfjs-dist en servidor
      config.externals = [...(config.externals || []), 'canvas', 'pdfjs-dist'];
    }
    
    // ✅ FALLBACKS para módulos problemáticos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      'pdfjs-dist': false,
    };
    
    // ✅ IGNORAR archivos .node
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader'
    });
    
    return config;
  },
  
  // ✅ EXPERIMENTAL - evitar problemas ESM
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;