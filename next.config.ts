import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["10.12.173.215"],
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/posts": ["./node_modules/ffmpeg-static/**/*"],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
