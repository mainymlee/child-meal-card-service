import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/v10.css": ["./한끼_웹앱_v10 (1).html"],
    "/app-logo.png": ["./한끼_웹앱_v10 (1).html"],
  },
};

export default nextConfig;
