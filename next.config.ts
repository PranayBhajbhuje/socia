import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["10.12.173.215"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
