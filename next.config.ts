import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@cursor/sdk", "@connectrpc/connect-node", "@connectrpc/connect"],
};

export default nextConfig;
