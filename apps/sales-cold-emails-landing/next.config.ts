import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mcpfactory.org",
      },
    ],
  },
};

export default nextConfig;
