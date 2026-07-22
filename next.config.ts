import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse's pdfjs-dist dependency loads its worker script from a
  // relative path resolved at runtime; bundling it (the default) rewrites
  // that path to a nonexistent in-bundle chunk file, breaking PDF parsing
  // in production with a "Setting up fake worker failed" error. Excluding
  // it from bundling lets it load normally from node_modules instead.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
