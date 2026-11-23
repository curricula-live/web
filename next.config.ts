import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Use the installed TypeScript compiler API; detached CLI output is unavailable in this runtime.
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
