import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   
  images: {
    // Autoriser les images locales depuis /public/uploads
    // Next.js optimise automatiquement les images via <Image />


    unoptimized:true,

    // Formats de sortie — WebP en priorité, AVIF si supporté
    formats: ['image/avif', 'image/webp'],

    // Tailles de breakpoints pour le responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 600],
  },

  // Permettre les gros fichiers en upload (10MB)
  experimental: {
    
    serverActions: {
      bodySizeLimit: '10mb',
     
    },
  },
};

export default nextConfig;
