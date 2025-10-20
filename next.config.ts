import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Control cache and prefetch behavior to reduce unnecessary fetches
    staleTimes: {
      dynamic: 30, // Cache dynamic routes for 30 seconds
      static: 180, // Cache static routes for 3 minutes
    },
  },
  // Logging for debugging
  logging: {
    fetches: {
      fullUrl: true, // Log full URL in development
    },
  },
  // Set build timestamp at build time if not already set
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP:
      process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString(),
  },
};

export default nextConfig;
