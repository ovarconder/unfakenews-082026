/** @type {import("next").NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    forceSwcTransforms: false,
  },
  async rewrites() {
    return {
      // beforeFiles ทำงานก่อน route handler ทุกตัว
      // rewrite /sitemap.xml → /api/sitemap
      // เพราะ /api/ routes ไม่ถูก app/layout.tsx ครอบ
      // → Content-Type: application/xml ทำงานได้ถูกต้อง
      beforeFiles: [
        {
          source: "/sitemap.xml",
          destination: "/api/sitemap",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};
export default nextConfig;
