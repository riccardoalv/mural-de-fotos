import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["computacao.unir.br"],
  },
  basePath: "/mural",
  assetPrefix: "/mural",
};

export default nextConfig;
