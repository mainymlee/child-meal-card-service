import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The root response is rendered from the immutable v10 HTML prototype.
  // Explicit tracing keeps that source file available in Vercel functions.
  outputFileTracingIncludes: {
    "/v10": ["./한끼_웹앱_v10 (1).html"],
  },
};

export default nextConfig;
