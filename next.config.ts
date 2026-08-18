import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/v10.css": ["./docs/prototypes/한끼_웹앱_v10.html"],
    "/app-logo.png": ["./docs/prototypes/한끼_웹앱_v10.html"],
  },
};

export default nextConfig;
