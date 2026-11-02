import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  
  // Same-origin API proxy to eliminate CORS and OPTIONS preflights
  async rewrites() {
    const coreApiOrigin = process.env.CORE_API_ORIGIN || "http://3.211.19.155";
    
    return [
      {
        source: "/core-api/:path*",
        destination: `${coreApiOrigin}/nollywin/core/:path*`,
      },
    ];
  },
};

export default nextConfig;
