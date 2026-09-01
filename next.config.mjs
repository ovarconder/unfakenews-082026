/** @type {import("next").NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    forceSwcTransforms: false,
  },
  async rewrites() {
    return {
      // beforeFiles: ทำงานก่อน route handler และ static file ทั้งหมด
      // จำเป็นต้องใช้เพราะ Next.js App Router จะ match
      // app/sitemap.xml/route.ts ก่อนถ้าใช้ afterFiles (default)
      beforeFiles: [
        {
          source: "/sitemap.xml",
          destination: "/sitemap-xml",
        },
        {
          source: "/sitemap/:lang.xml",
          destination: "/sitemap/:lang",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};
export default nextConfig;
