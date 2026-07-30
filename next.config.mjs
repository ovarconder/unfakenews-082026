/** @type {import("next").NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    forceSwcTransforms: false,
  },
};
export default nextConfig;
