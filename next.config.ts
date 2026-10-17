import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // `radix-ui` é um pacote "barrel"; sem isso, importar só o Slot traz todos os primitivos.
    optimizePackageImports: ["radix-ui"],
  },
};

export default nextConfig;
