import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse's pdfjs-dist dependency loads its worker script from a
  // relative path resolved at runtime; bundling it (the default) rewrites
  // that path to a nonexistent in-bundle chunk file, breaking PDF parsing
  // in production with a "Setting up fake worker failed" error. Excluding
  // it from bundling lets it load normally from node_modules instead.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // Excluding them from bundling means the serverless function's own file
  // trace (which platforms like Netlify use to decide what actually ships)
  // has to pick them up some other way — and it can't, since the worker
  // script is resolved at runtime via a dynamic path, not a static
  // import/require the tracer can follow. Without this, the deployed
  // function is missing pdf-parse/pdfjs-dist entirely and throws
  // "Cannot find module" the first time this route runs in production.
  outputFileTracingIncludes: {
    "/api/accounts/*/import-report": ["./node_modules/pdf-parse/**/*", "./node_modules/pdfjs-dist/**/*"],
  },
};

export default nextConfig;
