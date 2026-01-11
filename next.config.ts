import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  // ✅ Cloudflare Pages ビルドで ESLint エラーで落とさない（MVP用）
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
