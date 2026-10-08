import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.50", "*.local"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ticketm.net",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;