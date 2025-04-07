// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com', 
      // Agrega otros dominios según sea necesario
    ],
  },
  // Permite cargar módulos externos si es necesario
  transpilePackages: [
    // Aquí puedes agregar paquetes que necesiten ser transpilados
  ],
};

module.exports = nextConfig;