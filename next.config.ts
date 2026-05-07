import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images (Google profile photos for admin sidebar)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
