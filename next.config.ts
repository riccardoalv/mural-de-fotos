import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "computacao.unir.br",
      "mural-de-fotos.s3.us-east-2.amazonaws.com",
    ],
  },
  basePath: "/mural",
};

export default nextConfig;
