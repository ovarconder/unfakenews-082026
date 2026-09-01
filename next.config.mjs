/** @type {import("next").NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    forceSwcTransforms: false,
  },
  async rewrites() {
    return [
      // Rewrite /sitemap.xml → internal handler (app/sitemap-xml/route.ts)
      // Next.js ไม่รองรับ folder ชื่อ "sitemap.xml" (มี dot) เป็น route ได้ถูกต้อง
      {
        source: "/sitemap.xml",
        destination: "/sitemap-xml",
      },
      // Rewrite /sitemap/:lang.xml → internal handler (ตัด .xml ออกใน route)
      {
        source: "/sitemap/:lang.xml",
        destination: "/sitemap/:lang",
      },
    ];
  },
};
export default nextConfig;
